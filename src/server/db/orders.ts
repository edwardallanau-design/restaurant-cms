import { getPayload } from '@/lib/payload'
import type { MenuItem, Modifier, ModifierOption } from '@/payload-types'

export interface ValidationOptionView {
  id: number
  label: string
  priceAdjustment: number
  active: boolean
}

export interface ValidationModifierView {
  id: number
  name: string
  type: 'single' | 'multi'
  required: boolean
  options: ValidationOptionView[]
}

export interface ValidationMenuItemView {
  id: number
  name: string
  price: number
  active: boolean
  modifiers: ValidationModifierView[]
}

export async function getMenuItemsForValidation(
  restaurantId: number,
  menuItemIds: number[],
): Promise<ValidationMenuItemView[]> {
  const payload = await getPayload()

  const [items, modifiers, options] = await Promise.all([
    payload.find({
      collection: 'menu-items',
      where: { restaurant: { equals: restaurantId }, id: { in: menuItemIds } },
      limit: 0,
    }),
    payload.find({
      collection: 'modifiers',
      // Active-only: an inactive modifier is hidden from the menu read (S2), so checkout
      // treats it as not belonging to the item at all — selections referencing it fail
      // INVALID_MODIFIER_SELECTION, and an inactive *required* modifier no longer blocks
      // the item from being ordered. Items/options stay unfiltered because they carry
      // their own specific rejection codes (ITEM_INACTIVE / OPTION_INACTIVE).
      where: { restaurant: { equals: restaurantId }, menuItem: { in: menuItemIds }, active: { equals: true } },
      limit: 0,
    }),
    payload.find({
      collection: 'modifier-options',
      where: { restaurant: { equals: restaurantId } },
      limit: 0,
    }),
  ])

  const optionsByModifier = new Map<number, ValidationOptionView[]>()
  for (const option of options.docs as ModifierOption[]) {
    const modifierId = typeof option.modifier === 'number' ? option.modifier : option.modifier.id
    const list = optionsByModifier.get(modifierId) ?? []
    list.push({
      id: option.id,
      label: option.label,
      priceAdjustment: option.priceAdjustment ?? 0,
      active: option.active ?? true,
    })
    optionsByModifier.set(modifierId, list)
  }

  const modifiersByItem = new Map<number, ValidationModifierView[]>()
  for (const modifier of modifiers.docs as Modifier[]) {
    const itemId = typeof modifier.menuItem === 'number' ? modifier.menuItem : modifier.menuItem.id
    const list = modifiersByItem.get(itemId) ?? []
    list.push({
      id: modifier.id,
      name: modifier.name,
      type: modifier.type,
      required: modifier.required ?? false,
      options: optionsByModifier.get(modifier.id) ?? [],
    })
    modifiersByItem.set(itemId, list)
  }

  return (items.docs as MenuItem[]).map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    active: item.available ?? true,
    modifiers: modifiersByItem.get(item.id) ?? [],
  }))
}
