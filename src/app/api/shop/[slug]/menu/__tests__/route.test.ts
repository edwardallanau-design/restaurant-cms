import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetMenu = vi.fn()

vi.mock('@/server/ordering/menu', () => ({
  getMenu: mockGetMenu,
}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}))

const { GET } = await import('../route')

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

describe('GET /api/shop/:slug/menu', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with the menu tree for a known slug', async () => {
    mockGetMenu.mockResolvedValue([{ id: 1, name: 'Coffee', order: 1, items: [] }])

    const response = await GET(new Request('http://localhost/api/shop/pilot/menu'), makeParams('pilot'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual([{ id: 1, name: 'Coffee', order: 1, items: [] }])
  })

  it('returns 200 [] for a tenant with no active categories', async () => {
    mockGetMenu.mockResolvedValue([])

    const response = await GET(new Request('http://localhost/api/shop/pilot/menu'), makeParams('pilot'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual([])
  })

  it('returns 404 RESTAURANT_NOT_FOUND for an unknown slug', async () => {
    mockGetMenu.mockResolvedValue(null)

    const response = await GET(
      new Request('http://localhost/api/shop/unknown/menu'),
      makeParams('unknown'),
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({
      error: { code: 'RESTAURANT_NOT_FOUND', message: 'Restaurant not found', details: [] },
    })
  })
})
