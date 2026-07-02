import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DomainError } from '@/server/ordering/errors'

const mockCheckout = vi.fn()

vi.mock('@/server/ordering/checkout', () => ({
  checkout: mockCheckout,
}))

const { POST } = await import('../route')

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/shop/pilot/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/shop/:slug/orders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 201 with the created order on success', async () => {
    mockCheckout.mockResolvedValue({
      orderNumber: 'ORD-0042',
      totalPrice: 13.5,
      status: 'PENDING',
      createdAt: '2026-07-02T00:00:00.000Z',
    })

    const response = await POST(
      makeRequest({ items: [{ menuItemId: 10, quantity: 1, selectedModifiers: [] }] }),
      makeParams('pilot'),
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body).toEqual({
      orderNumber: 'ORD-0042',
      totalPrice: 13.5,
      status: 'PENDING',
      createdAt: '2026-07-02T00:00:00.000Z',
    })
  })

  it('returns 400 for malformed JSON body shape', async () => {
    const response = await POST(makeRequest({ items: [{ quantity: 1 }] }), makeParams('pilot'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBeDefined()
    expect(mockCheckout).not.toHaveBeenCalled()
  })

  it('returns 404 RESTAURANT_NOT_FOUND for an unknown slug', async () => {
    mockCheckout.mockResolvedValue(null)

    const response = await POST(
      makeRequest({ items: [{ menuItemId: 10, quantity: 1, selectedModifiers: [] }] }),
      makeParams('unknown'),
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({
      error: { code: 'RESTAURANT_NOT_FOUND', message: 'Restaurant not found', details: [] },
    })
  })

  it('returns 422 with the domain error code when checkout throws a DomainError', async () => {
    mockCheckout.mockRejectedValue(new DomainError('EMPTY_ORDER', 'The cart must contain at least one item.'))

    const response = await POST(makeRequest({ items: [] }), makeParams('pilot'))
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body).toEqual({
      error: { code: 'EMPTY_ORDER', message: 'The cart must contain at least one item.', details: [] },
    })
  })
})
