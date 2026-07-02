import { getPayload } from '@/lib/payload'
import { commitTransaction, killTransaction } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import type { MenuItem, Modifier, ModifierOption, Order } from '@/payload-types'

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

export interface PricedOrderItem {
  menuItem: number
  itemName: string
  unitPrice: number
  quantity: number
  selectedModifiers: unknown
}

export interface CreateOrderResult {
  orderNumber: string
  totalPrice: number
  status: string
  createdAt: string
}

// Narrow structural view of the drizzle-backed adapter's transaction-session and table
// registries. Not part of Payload's public `BaseDatabaseAdapter` type (only `sessions` is,
// typed as `db: unknown`) nor of `@payloadcms/drizzle`'s public export map (its `DrizzleAdapter`
// type and `getTransaction` helper live at internal subpaths outside `exports` in that
// package's package.json) — but `sessions` and `tables` are plain runtime properties set by
// `postgresAdapter()` (see node_modules/@payloadcms/db-postgres/dist/index.js), so reading them
// off `payload.db` at runtime is safe; this type only documents the shape we rely on.
interface DrizzleUpdateBuilder {
  set: (values: Record<string, unknown>) => {
    where: (condition: unknown) => {
      returning: (columns: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
    }
  }
}
interface TransactionScopedAdapter {
  sessions: Record<string, { db: { update: (table: unknown) => DrizzleUpdateBuilder } } | undefined>
  tables: Record<string, { id: unknown; lastOrderSequence: unknown } | undefined>
}

export async function createOrderForTenant(
  restaurantId: number,
  items: PricedOrderItem[],
  totalPrice: number,
): Promise<CreateOrderResult> {
  const payload = await getPayload()
  const beginResult = await payload.db.beginTransaction()

  if (beginResult === null) {
    throw new Error(
      'createOrderForTenant requires a transaction-capable database adapter, but beginTransaction() returned null',
    )
  }

  const transactionID = beginResult
  const req = { payload, transactionID }

  try {
    // Atomic per-café sequence increment (INV-6). A plain findByID + update has no row lock
    // under @payloadcms/db-postgres (verified: it issues a plain SELECT, no FOR UPDATE), so two
    // concurrent checkouts for one café could read the same counter and race. Doing the
    // increment as a single `UPDATE ... SET x = x + 1 ... RETURNING x` on the transaction's own
    // drizzle session makes Postgres itself serialize concurrent updates to the same row — the
    // second transaction blocks until the first commits/rolls back, then sees the incremented
    // value. No application-level lock or retry loop needed.
    const adapter = payload.db as unknown as TransactionScopedAdapter
    const session = adapter.sessions[transactionID]
    if (!session) {
      throw new Error(`createOrderForTenant: no transaction session found for id ${transactionID}`)
    }
    const restaurantsTable = adapter.tables.restaurants
    if (!restaurantsTable) {
      throw new Error("createOrderForTenant: adapter.tables.restaurants is not registered")
    }

    const [updatedRestaurant] = await session.db
      .update(restaurantsTable)
      .set({ lastOrderSequence: sql`${restaurantsTable.lastOrderSequence} + 1` })
      .where(sql`${restaurantsTable.id} = ${restaurantId}`)
      .returning({ lastOrderSequence: restaurantsTable.lastOrderSequence })

    if (!updatedRestaurant) {
      throw new Error(`createOrderForTenant: restaurant ${restaurantId} not found for sequence increment`)
    }

    const sequenceNumber = updatedRestaurant.lastOrderSequence as number
    const orderNumber = `ORD-${String(sequenceNumber).padStart(4, '0')}`

    const order = await payload.create({
      collection: 'orders',
      data: {
        restaurant: restaurantId,
        sequenceNumber,
        orderNumber,
        status: 'PENDING',
        totalPrice,
        // items have already been priced/validated (Task 5's checkout service) by the time
        // they reach this transactional write; selectedModifiers is stored as an opaque JSON
        // snapshot (INV-3), which is wider in PricedOrderItem (`unknown`) than the generated
        // JSON-field union Payload's Create type expects.
        items: items as unknown as Order['items'],
      },
      req: { transactionID },
    })

    await commitTransaction(req)

    return {
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
    }
  } catch (err) {
    await killTransaction(req)
    throw err
  }
}
