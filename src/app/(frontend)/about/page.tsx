import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import Image from 'next/image'
import { getPayload } from '@/lib/payload'
import { CACHE_TAGS } from '@/lib/cache'
import { Container } from '@/components/custom/Container'
import { Section } from '@/components/custom/Section'
import { ButtonLink } from '@/components/custom/Button'
import { RichText } from '@/components/custom/RichText'
import type { Media } from '@/payload-types'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our story, values, and the team behind the restaurant.',
}

const getAboutData = unstable_cache(
  async () => {
    const payload = await getPayload()
    const [gallery, content] = await Promise.all([
      payload.find({
        collection: 'gallery-images',
        sort: 'order',
        limit: 4,
        depth: 1,
      }),
      payload.findGlobal({ slug: 'page-content', depth: 0 }),
    ])
    return { galleryImages: gallery.docs, content }
  },
  ['about-page'],
  { tags: [CACHE_TAGS.gallery, CACHE_TAGS.content], revalidate: 300 },
)

const STORY_BG: Record<string, string> = {
  white: 'bg-white',
  surface: 'bg-surface',
  'primary-light': 'bg-primary-50',
}

const STORY_ALIGN: Record<string, string> = {
  center: 'text-center',
  left: 'text-left',
}

export default async function AboutPage() {
  const { galleryImages, content } = await getAboutData()
  const about = content.about

  type StoryFmt = { background?: string | null; textAlign?: string | null; containerWidth?: string | null }
  const fmt = (about as typeof about & { storyFormatting?: StoryFmt })?.storyFormatting
  const storyBg = STORY_BG[fmt?.background ?? 'white'] ?? 'bg-white'
  const storyAlign = STORY_ALIGN[fmt?.textAlign ?? 'center'] ?? 'text-center'
  const storyContainerWidth = (fmt?.containerWidth ?? 'narrow') as 'narrow' | 'default' | 'wide'

  return (
    <>
      {/* Page header */}
      <div className="bg-primary-900 pb-20 pt-32 text-center text-white">
        <Container>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-300">
            {about?.eyebrow ?? 'Who We Are'}
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            {about?.headerTitle ?? 'About Us'}
          </h1>
        </Container>
      </div>

      {/* Story section */}
      {(about?.story || about?.tagline) && (
        <Section className={storyBg}>
          <Container size={storyContainerWidth}>
            <div className={`space-y-6 ${storyAlign}`}>
              {about?.tagline && (
                <p className="font-serif text-2xl font-semibold leading-snug text-primary-700 sm:text-3xl">
                  &ldquo;{about.tagline}&rdquo;
                </p>
              )}
              {about?.story && (
                <RichText
                  content={about.story}
                  className={`${storyAlign} leading-relaxed text-gray-600`}
                />
              )}
            </div>
          </Container>
        </Section>
      )}

      {/* Gallery strip */}
      {galleryImages.length > 0 && (
        <Section padding="sm" className="bg-surface overflow-hidden">
          <Container>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
              {galleryImages.map((item) => {
                const img = typeof item.image === 'object' ? (item.image as Media) : null
                return (
                  <div key={item.id} className="relative aspect-square overflow-hidden rounded-card">
                    {img?.url ? (
                      <Image
                        src={img.url}
                        alt={img.alt ?? 'Restaurant photo'}
                        fill
                        className="object-cover"
                        sizes="(min-width: 640px) 25vw, 50vw"
                      />
                    ) : (
                      <div className="h-full bg-primary-100" />
                    )}
                  </div>
                )
              })}
            </div>
          </Container>
        </Section>
      )}

      {/* Values */}
      {about?.values && about.values.length > 0 && (
        <Section className="bg-white">
          <Container>
            <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900">
              {about.valuesHeading ?? 'Our Values'}
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {about.values.map((card) => (
                <div
                  key={card.id}
                  className="space-y-3 rounded-card p-6 text-center ring-1 ring-gray-100"
                >
                  {card.icon && <div className="text-4xl">{card.icon}</div>}
                  <h3 className="font-serif text-lg font-semibold text-gray-900">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{card.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* CTA */}
      <Section padding="sm" className="bg-primary-900 text-center text-white">
        <Container size="narrow">
          <h2 className="mb-4 font-serif text-3xl font-bold">
            {about?.ctaHeading ?? 'Come Visit Us'}
          </h2>
          <p className="mb-8 text-white/70">
            {about?.ctaSubtext ??
              "We'd love to welcome you. View our menu or get in touch to plan your visit."}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink href="/menu" size="lg">
              {about?.ctaPrimaryText ?? 'View Our Menu'}
            </ButtonLink>
            <ButtonLink
              href="/contact"
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white/10"
            >
              {about?.ctaSecondaryText ?? 'Contact Us'}
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  )
}
