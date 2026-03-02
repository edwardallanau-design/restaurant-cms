import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { getPayload } from '@/lib/payload'
import { CACHE_TAGS } from '@/lib/cache'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedMenu } from '@/components/home/FeaturedMenu'
import { GalleryPreview } from '@/components/home/GalleryPreview'
import type { Media } from '@/payload-types'

// ── Cached data fetchers ────────────────────────────────────────────────────

const getHomeData = unstable_cache(
  async () => {
    const payload = await getPayload()
    const [hero, settings, content, featuredItems, featuredGallery] = await Promise.all([
      payload.findGlobal({ slug: 'hero-section', depth: 1 }),
      payload.findGlobal({ slug: 'site-settings', depth: 1 }),
      payload.findGlobal({ slug: 'page-content', depth: 0 }),
      payload.find({
        collection: 'menu-items',
        where: { and: [{ featured: { equals: true } }, { available: { equals: true } }] },
        sort: 'order',
        limit: 6,
        depth: 1,
      }),
      payload.find({
        collection: 'gallery-images',
        where: { featured: { equals: true } },
        sort: 'order',
        limit: 6,
        depth: 1,
      }),
    ])
    return { hero, settings, content, featuredItems: featuredItems.docs, featuredGallery: featuredGallery.docs }
  },
  ['home-page'],
  {
    tags: [CACHE_TAGS.hero, CACHE_TAGS.settings, CACHE_TAGS.content, CACHE_TAGS.menu, CACHE_TAGS.gallery, CACHE_TAGS.media],
    revalidate: 300,
  },
)

// ── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getHomeData()
  const ogImage = typeof settings.seo?.ogImage === 'object'
    ? (settings.seo.ogImage as Media)
    : null

  return {
    title: settings.seo?.metaTitle ?? settings.restaurantName ?? 'Restaurant',
    description: settings.seo?.metaDescription ?? settings.tagline ?? undefined,
    openGraph: {
      title: settings.seo?.metaTitle ?? settings.restaurantName ?? undefined,
      description: settings.seo?.metaDescription ?? undefined,
      images: ogImage?.url ? [{ url: ogImage.url, alt: ogImage.alt ?? '' }] : [],
    },
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { hero, content, featuredItems, featuredGallery } = await getHomeData()

  return (
    <>
      <HeroSection
        heading={hero.heading}
        subheading={hero.subheading}
        backgroundImage={hero.backgroundImage}
        backgroundVideo={hero.backgroundVideo}
        primaryCta={hero.primaryCta}
        secondaryCta={hero.secondaryCta}
        overlay={hero.overlay}
      />
      <FeaturedMenu
        items={featuredItems}
        eyebrow={content.home?.eyebrow ?? undefined}
        heading={content.home?.headerTitle ?? undefined}
      />
      <GalleryPreview images={featuredGallery} />
    </>
  )
}
