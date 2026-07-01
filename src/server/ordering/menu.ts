import { resolveSlug, getMenuForTenant } from '@/server/db'
import type { MenuCategoryView } from '@/server/db'

export async function getMenu(slug: string): Promise<MenuCategoryView[] | null> {
  const restaurant = await resolveSlug(slug)
  if (!restaurant) return null
  return getMenuForTenant(restaurant.id)
}
