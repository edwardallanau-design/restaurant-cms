import { getPayload } from '@/lib/payload'
import type { Restaurant } from '@/payload-types'

export async function resolveSlug(slug: string): Promise<Restaurant | null> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'restaurants',
    where: { slug: { equals: slug }, active: { equals: true } },
    limit: 1,
  })
  return result.docs[0] ?? null
}
