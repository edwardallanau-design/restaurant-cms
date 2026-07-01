import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFind = vi.fn()

vi.mock('@/lib/payload', () => ({
  getPayload: vi.fn(() => Promise.resolve({ find: mockFind })),
}))

const { getSettingsForTenant, getHeroForTenant, getPageContentForTenant } =
  await import('../settings')

const PILOT_ID = 'pilot-uuid'
const DECOY_ID = 'decoy-uuid'

describe('getSettingsForTenant', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries only the given tenant — pilot', async () => {
    const pilotDoc = { id: 's1', restaurant: PILOT_ID, restaurantName: 'Pilot Café' }
    mockFind.mockResolvedValue({ docs: [pilotDoc] })

    const result = await getSettingsForTenant(PILOT_ID)

    expect(mockFind).toHaveBeenCalledWith({
      collection: 'tenant-site-settings',
      where: { restaurant: { equals: PILOT_ID } },
      limit: 1,
    })
    expect(result?.restaurantName).toBe('Pilot Café')
  })

  it('queries only the given tenant — decoy does not bleed into pilot', async () => {
    const decoyDoc = { id: 's2', restaurant: DECOY_ID, restaurantName: 'Decoy Café' }
    mockFind.mockResolvedValue({ docs: [decoyDoc] })

    const result = await getSettingsForTenant(DECOY_ID)

    expect(mockFind).toHaveBeenCalledWith({
      collection: 'tenant-site-settings',
      where: { restaurant: { equals: DECOY_ID } },
      limit: 1,
    })
    expect(result?.restaurantName).toBe('Decoy Café')
    expect(mockFind).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ restaurant: { equals: PILOT_ID } }),
      }),
    )
  })

  it('returns null when no settings document exists for the tenant', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    const result = await getSettingsForTenant('nonexistent')
    expect(result).toBeNull()
  })
})

describe('getHeroForTenant', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries tenant-hero-sections scoped to restaurantId', async () => {
    const heroDoc = { id: 'h1', restaurant: PILOT_ID, heading: 'Taste the Difference' }
    mockFind.mockResolvedValue({ docs: [heroDoc] })

    const result = await getHeroForTenant(PILOT_ID)

    expect(mockFind).toHaveBeenCalledWith({
      collection: 'tenant-hero-sections',
      where: { restaurant: { equals: PILOT_ID } },
      limit: 1,
    })
    expect(result?.heading).toBe('Taste the Difference')
  })

  it('returns null when no hero document exists for the tenant', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    expect(await getHeroForTenant(PILOT_ID)).toBeNull()
  })
})

describe('getPageContentForTenant', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries tenant-page-content scoped to restaurantId', async () => {
    const contentDoc = { id: 'c1', restaurant: PILOT_ID, menu: { eyebrow: 'What We Offer' } }
    mockFind.mockResolvedValue({ docs: [contentDoc] })

    const result = await getPageContentForTenant(PILOT_ID)

    expect(mockFind).toHaveBeenCalledWith({
      collection: 'tenant-page-content',
      where: { restaurant: { equals: PILOT_ID } },
      limit: 1,
    })
    expect(result?.menu?.eyebrow).toBe('What We Offer')
  })

  it('returns null when no content document exists for the tenant', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    expect(await getPageContentForTenant(PILOT_ID)).toBeNull()
  })
})
