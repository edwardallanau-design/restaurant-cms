import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { unstable_cache } from 'next/cache'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getPayload } from '@/lib/payload'
import { CACHE_TAGS } from '@/lib/cache'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
})

const getSiteSettings = unstable_cache(
  async () => {
    const payload = await getPayload()
    return payload.findGlobal({ slug: 'site-settings', depth: 1 })
  },
  ['site-settings'],
  { tags: [CACHE_TAGS.settings], revalidate: false },
)

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const name = settings.restaurantName ?? 'Restaurant'
  return {
    title: {
      default: settings.seo?.metaTitle ?? name,
      template: `%s | ${name}`,
    },
    description: settings.seo?.metaDescription ?? undefined,
  }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <Header
          settings={{
            restaurantName: settings.restaurantName,
            logo: settings.logo,
            navigation: settings.navigation,
          }}
        />
        <main>{children}</main>
        <Footer
          settings={{
            restaurantName: settings.restaurantName,
            contact: settings.contact,
            hours: settings.hours,
            socialLinks: settings.socialLinks,
            navigation: settings.navigation,
          }}
        />
      </body>
    </html>
  )
}
