import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { getPayload } from '@/lib/payload'
import { CACHE_TAGS } from '@/lib/cache'
import { env } from '@/env'
import { resolveSlug, getPageContentForTenant } from '@/server/db'
import { Container } from '@/components/custom/Container'
import { Section } from '@/components/custom/Section'
import { MenuItemCard } from '@/components/menu/MenuItemCard'
import type { MenuItem } from '@/payload-types'

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Browse our full menu — starters, mains, desserts, and more.',
}

// ── Data ─────────────────────────────────────────────────────────────────────

const getMenuData = unstable_cache(
  async () => {
    const payload = await getPayload()
    const pilot = await resolveSlug(env.PILOT_RESTAURANT_SLUG)
    if (!pilot) throw new Error('Pilot restaurant not found.')

    const [categories, items, content] = await Promise.all([
      payload.find({
        collection: 'menu-categories',
        sort: 'order',
        limit: 50,
      }),
      payload.find({
        collection: 'menu-items',
        where: { available: { equals: true } },
        sort: 'order',
        limit: 300,
        depth: 1,
      }),
      getPageContentForTenant(pilot.id),
    ])
    return { categories: categories.docs, items: items.docs, content }
  },
  ['menu-page'],
  { tags: [CACHE_TAGS.menu, CACHE_TAGS.content, CACHE_TAGS.media], revalidate: 300 },
)

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function MenuPage() {
  const { categories, items, content } = await getMenuData()

  // Group items by category id
  const itemsByCategory = new Map<string, MenuItem[]>()
  for (const item of items) {
    const catId =
      typeof item.category === 'object' ? String(item.category.id) : String(item.category ?? '')
    if (!catId) continue
    const existing = itemsByCategory.get(catId) ?? []
    existing.push(item)
    itemsByCategory.set(catId, existing)
  }

  // Items without a matched category
  const uncategorised = items.filter((item) => {
    const catId = typeof item.category === 'object' ? item.category.id : item.category
    return !catId
  })

  return (
    <>
      {/* Page header */}
      <div className="bg-primary-900 pt-32 pb-16 text-center text-white">
        <Container>
          <p className="mb-2 text-sm font-semibold tracking-widest text-primary-300 uppercase">
            {content?.menu?.eyebrow ?? 'What We Offer'}
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            {content?.menu?.headerTitle ?? 'Our Menu'}
          </h1>
        </Container>
      </div>

      {/* Menu sections */}
      <Section className="bg-white">
        <Container>
          {categories.map((category) => {
            const catItems = itemsByCategory.get(String(category.id)) ?? []
            if (!catItems.length) return null

            return (
              <div
                key={category.id}
                id={String(category.slug ?? category.id)}
                className="mb-16 scroll-mt-24 last:mb-0"
              >
                {/* Category heading */}
                <div className="mb-8 border-b border-gray-100 pb-4">
                  <h2 className="font-serif text-2xl font-bold text-gray-900 sm:text-3xl">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="mt-1 text-gray-500">{category.description}</p>
                  )}
                </div>

                {/* Items grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {catItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Uncategorised items */}
          {uncategorised.length > 0 && (
            <div className="mb-16">
              <h2 className="mb-8 font-serif text-2xl font-bold text-gray-900">Other Items</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {uncategorised.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
