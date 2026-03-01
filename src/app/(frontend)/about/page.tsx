import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import Image from 'next/image'
import { getPayload } from '@/lib/payload'
import { CACHE_TAGS } from '@/lib/cache'
import { Container } from '@/components/custom/Container'
import { Section } from '@/components/custom/Section'
import { ButtonLink } from '@/components/custom/Button'
import type { Media } from '@/payload-types'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our story, values, and the team behind the restaurant.',
}

const getAboutData = unstable_cache(
  async () => {
    const payload = await getPayload()
    const [settings, gallery] = await Promise.all([
      payload.findGlobal({ slug: 'site-settings', depth: 1 }),
      // Use a couple of non-featured gallery images as ambiance shots
      payload.find({
        collection: 'gallery-images',
        sort: 'order',
        limit: 4,
        depth: 1,
      }),
    ])
    return { settings, galleryImages: gallery.docs }
  },
  ['about-page'],
  { tags: [CACHE_TAGS.settings, CACHE_TAGS.gallery], revalidate: 300 },
)

export default async function AboutPage() {
  const { settings, galleryImages } = await getAboutData()

  return (
    <>
      {/* Page header */}
      <div className="bg-primary-900 pb-20 pt-32 text-center text-white">
        <Container>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-300">
            Who We Are
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            About {settings.restaurantName ?? 'Us'}
          </h1>
        </Container>
      </div>

      {/* Story section */}
      <Section className="bg-white">
        <Container size="narrow">
          <div className="space-y-6 text-center">
            {settings.tagline && (
              <p className="font-serif text-2xl font-semibold leading-snug text-primary-700 sm:text-3xl">
                &ldquo;{settings.tagline}&rdquo;
              </p>
            )}
            <p className="leading-relaxed text-gray-600">
              Welcome to {settings.restaurantName ?? 'our restaurant'}. We believe in crafting
              every dish with care, using the finest seasonal ingredients to create an experience
              you&apos;ll want to return to. Our passion for food is matched only by our
              commitment to making every guest feel at home.
            </p>
            <p className="leading-relaxed text-gray-600">
              Whether you&apos;re joining us for a quiet dinner, a family celebration, or a
              special occasion, our team is dedicated to making it unforgettable.
            </p>
          </div>
        </Container>
      </Section>

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
      <Section className="bg-white">
        <Container>
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900">
            Our Values
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: '🌿',
                title: 'Fresh & Seasonal',
                desc: 'We source the finest local and seasonal ingredients to keep every dish vibrant and full of flavour.',
              },
              {
                icon: '👨‍🍳',
                title: 'Crafted with Care',
                desc: 'Every plate is prepared by our dedicated kitchen team with time-honoured techniques and modern creativity.',
              },
              {
                icon: '🤝',
                title: 'Warm Hospitality',
                desc: 'From the moment you walk in, we treat every guest like family. Your experience is our priority.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center space-y-3 rounded-card p-6 ring-1 ring-gray-100">
                <div className="text-4xl">{icon}</div>
                <h3 className="font-serif text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section padding="sm" className="bg-primary-900 text-center text-white">
        <Container size="narrow">
          <h2 className="mb-4 font-serif text-3xl font-bold">Come Visit Us</h2>
          <p className="mb-8 text-white/70">
            We&apos;d love to welcome you. View our menu or get in touch to plan your visit.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink href="/menu" size="lg">
              View Our Menu
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              Contact Us
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  )
}
