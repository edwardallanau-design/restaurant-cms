import { unstable_cache } from 'next/cache'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getPayload } from '@/lib/payload'
import { CACHE_TAGS } from '@/lib/cache'

const getSiteSettings = unstable_cache(
  async () => {
    const payload = await getPayload()
    return payload.findGlobal({ slug: 'site-settings', depth: 1 })
  },
  ['site-settings'],
  { tags: [CACHE_TAGS.settings], revalidate: false },
)

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()

  return (
    <>
      <Header settings={{ restaurantName: settings.restaurantName, logo: settings.logo }} />
      <main>{children}</main>
      <Footer
        settings={{
          restaurantName: settings.restaurantName,
          contact: settings.contact,
          hours: settings.hours,
          socialLinks: settings.socialLinks,
        }}
      />
    </>
  )
}
