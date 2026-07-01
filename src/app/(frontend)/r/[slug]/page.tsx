import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveSlug } from '@/server/db'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const restaurant = await resolveSlug(slug)
  if (!restaurant) return { title: 'Not Found' }
  return { title: restaurant.name }
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params
  const restaurant = await resolveSlug(slug)
  if (!restaurant) notFound()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="font-serif text-4xl font-bold text-gray-900">{restaurant.name}</h1>
      <p className="mt-4 text-gray-500">Digital menu coming soon.</p>
    </main>
  )
}
