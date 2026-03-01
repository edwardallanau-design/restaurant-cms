import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import Image from 'next/image'
import { getPayload } from '@/lib/payload'
import { CACHE_TAGS } from '@/lib/cache'
import { Container } from '@/components/custom/Container'
import { Section } from '@/components/custom/Section'
import type { Media, MenuItem } from '@/payload-types'

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Browse our full menu — starters, mains, desserts, and more.',
}

// ── Data ─────────────────────────────────────────────────────────────────────

const getMenuData = unstable_cache(
  async () => {
    const payload = await getPayload()
    const [categories, items] = await Promise.all([
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
    ])
    return { categories: categories.docs, items: items.docs }
  },
  ['menu-page'],
  { tags: [CACHE_TAGS.menu], revalidate: 300 },
)

const DIETARY_COLORS: Record<string, string> = {
  vegetarian: 'bg-green-100 text-green-800',
  vegan: 'bg-emerald-100 text-emerald-800',
  'gluten-free': 'bg-yellow-100 text-yellow-800',
  spicy: 'bg-red-100 text-red-800',
  'contains-nuts': 'bg-orange-100 text-orange-800',
  'dairy-free': 'bg-blue-100 text-blue-800',
  'chefs-special': 'bg-primary-100 text-primary-800',
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function MenuPage() {
  const { categories, items } = await getMenuData()

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
      <div className="bg-primary-900 pb-16 pt-32 text-center text-white">
        <Container>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-300">
            What We Offer
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">Our Menu</h1>
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
                className="mb-16 last:mb-0 scroll-mt-24"
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

function MenuItemCard({ item }: { item: MenuItem }) {
  const image = typeof item.image === 'object' ? (item.image as Media) : null

  return (
    <article className="flex gap-4 rounded-card p-4 ring-1 ring-gray-100 transition hover:shadow-sm">
      {/* Thumbnail */}
      {image?.url && (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md">
          <Image
            src={image.url}
            alt={image.alt ?? item.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
      )}
      <div className="flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900">{item.name}</h3>
          <span className="shrink-0 font-semibold text-primary-600">
            ${Number(item.price).toFixed(2)}
          </span>
        </div>
        {/* Dietary flags */}
        {item.dietaryFlags && item.dietaryFlags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.dietaryFlags.map((flag) => (
              <span
                key={flag}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  DIETARY_COLORS[flag] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {flag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
