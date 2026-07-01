import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { getPayload } from '@/lib/payload'
import { CACHE_TAGS } from '@/lib/cache'
import { env } from '@/env'
import { resolveSlug, getPageContentForTenant } from '@/server/db'
import { Container } from '@/components/custom/Container'
import { Section } from '@/components/custom/Section'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Explore photos of our food, ambiance, and events.',
}

const getGalleryData = unstable_cache(
  async () => {
    const payload = await getPayload()
    const pilot = await resolveSlug(env.PILOT_RESTAURANT_SLUG)
    if (!pilot) throw new Error('Pilot restaurant not found.')

    const [result, content] = await Promise.all([
      payload.find({
        collection: 'gallery-images',
        sort: 'order',
        limit: 100,
        depth: 1,
      }),
      getPageContentForTenant(pilot.id),
    ])
    return { images: result.docs, content }
  },
  ['gallery-page'],
  { tags: [CACHE_TAGS.gallery, CACHE_TAGS.content, CACHE_TAGS.media], revalidate: 300 },
)

export default async function GalleryPage() {
  const { images, content } = await getGalleryData()

  return (
    <>
      <div className="bg-primary-900 pt-32 pb-16 text-center text-white">
        <Container>
          <p className="mb-2 text-sm font-semibold tracking-widest text-primary-300 uppercase">
            {content?.gallery?.eyebrow ?? 'A Visual Story'}
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            {content?.gallery?.headerTitle ?? 'Gallery'}
          </h1>
        </Container>
      </div>

      <Section className="bg-white">
        <Container>
          {images.length > 0 ? (
            <GalleryGrid images={images} />
          ) : (
            <p className="text-center text-muted">No photos yet — check back soon!</p>
          )}
        </Container>
      </Section>
    </>
  )
}
