import { resolveSlug, getMenuItemsForValidation, createOrderForTenant } from '@/server/db'
import type { ValidationModifierView, CreateOrderResult } from '@/server/db'
import { DomainError } from './errors'
import type { Cart } from './checkout.schema'

export async function checkout(slug: string, cart: Cart): Promise<CreateOrderResult | null> {
  const restaurant = await resolveSlug(slug)
  if (!restaurant) return null

  if (cart.items.length === 0) {
    throw new DomainError('EMPTY_ORDER', 'The cart must contain at least one item.')
  }

  const menuItemIds = cart.items.map((line) => line.menuItemId)
  const menuItems = await getMenuItemsForValidation(restaurant.id, menuItemIds)
  const menuItemsById = new Map(menuItems.map((item) => [item.id, item]))

  const pricedItems = cart.items.map((line) => {
    const menuItem = menuItemsById.get(line.menuItemId)

    if (!menuItem || !menuItem.active) {
      throw new DomainError('ITEM_INACTIVE', `Menu item ${line.menuItemId} is not available.`)
    }

    const modifiersById = new Map<number, ValidationModifierView>(menuItem.modifiers.map((m) => [m.id, m]))

    // Integrity checks (same family as "belongs to" below): a duplicate modifierId lets two
    // selections target the same single-select modifier, each with one option, sneaking two
    // options past the single-select cardinality check (INV-9) since neither selection alone
    // has 2+ options. A duplicate optionId within one selection would price that option twice.
    const seenModifierIds = new Set<number>()
    for (const selection of line.selectedModifiers) {
      if (seenModifierIds.has(selection.modifierId)) {
        throw new DomainError(
          'INVALID_MODIFIER_SELECTION',
          `Modifier ${selection.modifierId} is selected more than once for item ${line.menuItemId}.`,
        )
      }
      seenModifierIds.add(selection.modifierId)

      const seenOptionIds = new Set<number>()
      for (const optionId of selection.optionIds) {
        if (seenOptionIds.has(optionId)) {
          throw new DomainError(
            'INVALID_MODIFIER_SELECTION',
            `Option ${optionId} is selected more than once for modifier ${selection.modifierId}.`,
          )
        }
        seenOptionIds.add(optionId)
      }
    }

    const resolvedSelections = line.selectedModifiers.map((selection) => {
      const modifier = modifiersById.get(selection.modifierId)
      if (!modifier) {
        throw new DomainError(
          'INVALID_MODIFIER_SELECTION',
          `Modifier ${selection.modifierId} does not belong to item ${line.menuItemId}.`,
        )
      }

      const optionsById = new Map(modifier.options.map((o) => [o.id, o]))
      const resolvedOptions = selection.optionIds.map((optionId) => {
        const option = optionsById.get(optionId)
        if (!option) {
          throw new DomainError(
            'INVALID_MODIFIER_SELECTION',
            `Option ${optionId} does not belong to modifier ${selection.modifierId}.`,
          )
        }
        if (!option.active) {
          throw new DomainError('OPTION_INACTIVE', `Option ${optionId} is not available.`)
        }
        return option
      })

      if (modifier.type === 'single' && resolvedOptions.length > 1) {
        throw new DomainError(
          'INVALID_MODIFIER_SELECTION',
          `Modifier ${modifier.id} is single-select but received ${resolvedOptions.length} options.`,
        )
      }

      return { modifier, options: resolvedOptions }
    })

    for (const modifier of menuItem.modifiers) {
      if (!modifier.required) continue
      const selected = resolvedSelections.find((sel) => sel.modifier.id === modifier.id)
      if (!selected || selected.options.length === 0) {
        throw new DomainError(
          'REQUIRED_MODIFIER_MISSING',
          `Modifier ${modifier.id} is required but has no selection.`,
        )
      }
    }

    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new DomainError('INVALID_QUANTITY', `Quantity must be an integer >= 1, got ${line.quantity}.`)
    }

    const modifierAdjustmentTotal = resolvedSelections.reduce(
      (sum, sel) => sum + sel.options.reduce((s, o) => s + o.priceAdjustment, 0),
      0,
    )
    // Round at the pricing boundary (first place multiplication happens) to guard against
    // float drift (e.g. 4.2 + 0.1 !== 4.3 in IEEE 754).
    const lineTotal = Math.round((menuItem.price + modifierAdjustmentTotal) * line.quantity * 100) / 100

    return {
      menuItem: menuItem.id,
      itemName: menuItem.name,
      unitPrice: menuItem.price,
      quantity: line.quantity,
      selectedModifiers: resolvedSelections
        .filter((sel) => sel.options.length > 0)
        .map((sel) => ({
          modifierName: sel.modifier.name,
          options: sel.options.map((o) => ({ label: o.label, priceAdjustment: o.priceAdjustment })),
        })),
      lineTotal,
    }
  })

  const totalPrice = Math.round(pricedItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100
  const items = pricedItems.map(({ lineTotal: _lineTotal, ...item }) => item)

  return createOrderForTenant(restaurant.id, items, totalPrice)
}
