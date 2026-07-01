import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import { resolveSlug } from '@/server/db'
import { getMenu } from '@/server/ordering/menu'
import { CACHE_TAGS } from '@/lib/cache'

interface Props {
  params: Promise<{ slug: string }>
}

const getRestaurant = (slug: string) =>
  unstable_cache(() => resolveSlug(slug), [`restaurant-${slug}`], { revalidate: 60 })()

const getCachedMenu = (slug: string) =>
  unstable_cache(() => getMenu(slug), [`menu-${slug}`], { tags: [CACHE_TAGS.menu] })()

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const restaurant = await getRestaurant(slug)
  if (!restaurant) return { title: 'Not Found' }
  return { title: restaurant.name }
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params
  const restaurant = await getRestaurant(slug)
  if (!restaurant) notFound()

  const menu = await getCachedMenu(slug)

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="font-serif text-4xl font-bold text-gray-900">{restaurant.name}</h1>
      {menu === null || menu.length === 0 ? (
        <p className="mt-4 text-gray-500">Menu coming soon.</p>
      ) : (
        menu.map((category) => (
          <section key={category.id} className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">{category.name}</h2>
            <ul className="mt-4 space-y-4">
              {category.items.map((item) => (
                <li key={item.id}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="text-gray-700">${item.price.toFixed(2)}</span>
                  </div>
                  {item.modifiers.map((modifier) => (
                    <div key={modifier.id} className="mt-1 pl-4 text-sm text-gray-500">
                      {modifier.name}
                      {modifier.required ? ' (required)' : ''}:{' '}
                      {modifier.options
                        .map((option) =>
                          option.priceAdjustment
                            ? `${option.label} (${option.priceAdjustment > 0 ? '+' : '-'}$${Math.abs(option.priceAdjustment).toFixed(2)})`
                            : option.label,
                        )
                        .join(', ')}
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  )
}
