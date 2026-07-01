import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFind = vi.fn()

vi.mock('@/lib/payload', () => ({
  getPayload: vi.fn(() => Promise.resolve({ find: mockFind })),
}))

const { resolveSlug } = await import('../restaurants')

describe('resolveSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the restaurant when an active restaurant matches the slug', async () => {
    const pilot = { id: 'pilot-uuid', name: 'Pilot Café', slug: 'pilot', active: true }
    mockFind.mockResolvedValue({ docs: [pilot], totalDocs: 1 })

    const result = await resolveSlug('pilot')

    expect(result).toEqual(pilot)
    expect(mockFind).toHaveBeenCalledWith({
      collection: 'restaurants',
      where: { slug: { equals: 'pilot' }, active: { equals: true } },
      limit: 1,
    })
  })

  it('returns null when no active restaurant matches the slug', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0 })

    const result = await resolveSlug('does-not-exist')

    expect(result).toBeNull()
  })

  it('returns null when the restaurant exists but is inactive', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0 })

    const result = await resolveSlug('inactive-slug')

    expect(result).toBeNull()
    // active: false restaurants are excluded by the where clause
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ active: { equals: true } }),
      }),
    )
  })
})
