import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFind = vi.fn()

vi.mock('@/lib/payload', () => ({
  getPayload: vi.fn(() => Promise.resolve({ find: mockFind })),
}))

const { getMenuForTenant } = await import('../menu')

const PILOT_ID = 1

describe('getMenuForTenant', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries all four collections scoped to the tenant and active/available flags', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    await getMenuForTenant(PILOT_ID)

    expect(mockFind).toHaveBeenCalledWith({
      collection: 'menu-categories',
      where: { restaurant: { equals: PILOT_ID }, active: { equals: true } },
      sort: 'order',
      limit: 0,
    })
    expect(mockFind).toHaveBeenCalledWith({
      collection: 'menu-items',
      where: { restaurant: { equals: PILOT_ID }, available: { equals: true } },
      limit: 0,
    })
    expect(mockFind).toHaveBeenCalledWith({
      collection: 'modifiers',
      where: { restaurant: { equals: PILOT_ID }, active: { equals: true } },
      limit: 0,
    })
    expect(mockFind).toHaveBeenCalledWith({
      collection: 'modifier-options',
      where: { restaurant: { equals: PILOT_ID }, active: { equals: true } },
      limit: 0,
    })
  })

  it('assembles a nested tree: category -> items -> modifiers -> options', async () => {
    mockFind.mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'menu-categories') {
        return Promise.resolve({ docs: [{ id: 1, name: 'Coffee', order: 1 }] })
      }
      if (collection === 'menu-items') {
        return Promise.resolve({
          docs: [{ id: 10, name: 'Cappuccino', description: null, price: 4.5, category: 1 }],
        })
      }
      if (collection === 'modifiers') {
        return Promise.resolve({
          docs: [{ id: 101, name: 'Size', type: 'single', required: true, menuItem: 10 }],
        })
      }
      if (collection === 'modifier-options') {
        return Promise.resolve({
          docs: [{ id: 201, label: 'Large', priceAdjustment: 1, modifier: 101 }],
        })
      }
      return Promise.resolve({ docs: [] })
    })

    const result = await getMenuForTenant(PILOT_ID)

    expect(result).toEqual([
      {
        id: 1,
        name: 'Coffee',
        order: 1,
        items: [
          {
            id: 10,
            name: 'Cappuccino',
            description: null,
            price: 4.5,
            modifiers: [
              {
                id: 101,
                name: 'Size',
                type: 'single',
                required: true,
                options: [{ id: 201, label: 'Large', priceAdjustment: 1 }],
              },
            ],
          },
        ],
      },
    ])
  })

  it('keeps items with zero modifiers and categories with zero items', async () => {
    mockFind.mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'menu-categories') {
        return Promise.resolve({ docs: [{ id: 1, name: 'Empty Category', order: 1 }] })
      }
      return Promise.resolve({ docs: [] })
    })

    const result = await getMenuForTenant(PILOT_ID)

    expect(result).toEqual([{ id: 1, name: 'Empty Category', order: 1, items: [] }])
  })

  it('never mixes decoy tenant rows into a pilot query', async () => {
    mockFind.mockImplementation(({ where }: { where: { restaurant: { equals: number } } }) => {
      if (where.restaurant.equals === PILOT_ID) {
        return Promise.resolve({ docs: [{ id: 1, name: 'Pilot Category', order: 1 }] })
      }
      return Promise.resolve({ docs: [{ id: 2, name: 'Decoy Category', order: 1 }] })
    })

    const result = await getMenuForTenant(PILOT_ID)

    expect(result).toEqual([{ id: 1, name: 'Pilot Category', order: 1, items: [] }])
    expect(result.some((c) => c.name === 'Decoy Category')).toBe(false)
  })
})
