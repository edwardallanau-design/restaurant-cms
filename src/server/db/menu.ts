import { getPayload } from '@/lib/payload'
import type { MenuCategory, MenuItem, Modifier, ModifierOption } from '@/payload-types'

export interface MenuOptionView {
  id: number
  label: string
  priceAdjustment: number
}

export interface MenuModifierView {
  id: number
  name: string
  type: 'single' | 'multi'
  required: boolean
  options: MenuOptionView[]
}

export interface MenuItemView {
  id: number
  name: string
  description: MenuItem['description']
  price: number
  modifiers: MenuModifierView[]
}

export interface MenuCategoryView {
  id: number
  name: string
  order: number
  items: MenuItemView[]
}

export async function getMenuForTenant(restaurantId: number): Promise<MenuCategoryView[]> {
  const payload = await getPayload()

  const [categories, items, modifiers, options] = await Promise.all([
    payload.find({
      collection: 'menu-categories',
      where: { restaurant: { equals: restaurantId }, active: { equals: true } },
      sort: 'order',
      limit: 0,
    }),
    payload.find({
      collection: 'menu-items',
      where: { restaurant: { equals: restaurantId }, available: { equals: true } },
      limit: 0,
    }),
    payload.find({
      collection: 'modifiers',
      where: { restaurant: { equals: restaurantId }, active: { equals: true } },
      limit: 0,
    }),
    payload.find({
      collection: 'modifier-options',
      where: { restaurant: { equals: restaurantId }, active: { equals: true } },
      limit: 0,
    }),
  ])

  const optionsByModifier = new Map<number, MenuOptionView[]>()
  for (const option of options.docs as ModifierOption[]) {
    if (option.modifier == null) continue
    const modifierId = typeof option.modifier === 'number' ? option.modifier : option.modifier.id
    const list = optionsByModifier.get(modifierId) ?? []
    list.push({ id: option.id, label: option.label, priceAdjustment: option.priceAdjustment ?? 0 })
    optionsByModifier.set(modifierId, list)
  }

  const modifiersByItem = new Map<number, MenuModifierView[]>()
  for (const modifier of modifiers.docs as Modifier[]) {
    if (modifier.menuItem == null) continue
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

  const itemsByCategory = new Map<number, MenuItemView[]>()
  for (const item of items.docs as MenuItem[]) {
    if (item.category == null) continue
    const categoryId = typeof item.category === 'number' ? item.category : item.category.id
    const list = itemsByCategory.get(categoryId) ?? []
    list.push({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      modifiers: modifiersByItem.get(item.id) ?? [],
    })
    itemsByCategory.set(categoryId, list)
  }

  return (categories.docs as MenuCategory[]).map((category) => ({
    id: category.id,
    name: category.name,
    order: category.order ?? 0,
    items: itemsByCategory.get(category.id) ?? [],
  }))
}
