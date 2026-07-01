import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockResolveSlug = vi.fn()
const mockGetMenuForTenant = vi.fn()

vi.mock('@/server/db', () => ({
  resolveSlug: mockResolveSlug,
  getMenuForTenant: mockGetMenuForTenant,
}))

const { getMenu } = await import('../menu')

describe('getMenu', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when the slug does not resolve to a tenant', async () => {
    mockResolveSlug.mockResolvedValue(null)

    const result = await getMenu('unknown-slug')

    expect(result).toBeNull()
    expect(mockGetMenuForTenant).not.toHaveBeenCalled()
  })

  it('delegates to getMenuForTenant with the resolved restaurant id', async () => {
    mockResolveSlug.mockResolvedValue({ id: 7, name: 'Pilot Café', slug: 'pilot', active: true })
    mockGetMenuForTenant.mockResolvedValue([{ id: 1, name: 'Coffee', order: 1, items: [] }])

    const result = await getMenu('pilot')

    expect(mockGetMenuForTenant).toHaveBeenCalledWith(7)
    expect(result).toEqual([{ id: 1, name: 'Coffee', order: 1, items: [] }])
  })
})
