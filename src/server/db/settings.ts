import { getPayload } from '@/lib/payload'
import type { TenantSiteSetting, TenantHeroSection, TenantPageContent } from '@/payload-types'

export async function getSettingsForTenant(
  restaurantId: string,
): Promise<TenantSiteSetting | null> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'tenant-site-settings',
    where: { restaurant: { equals: restaurantId } },
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getHeroForTenant(
  restaurantId: string,
): Promise<TenantHeroSection | null> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'tenant-hero-sections',
    where: { restaurant: { equals: restaurantId } },
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getPageContentForTenant(
  restaurantId: string,
): Promise<TenantPageContent | null> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'tenant-page-content',
    where: { restaurant: { equals: restaurantId } },
    limit: 1,
  })
  return result.docs[0] ?? null
}
