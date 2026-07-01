import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFind = vi.fn()
const mockFindByID = vi.fn()
const mockUpdate = vi.fn()
const mockCreate = vi.fn()
const mockBeginTransaction = vi.fn()
const mockCommitTransaction = vi.fn()
const mockKillTransaction = vi.fn()

vi.mock('@/lib/payload', () => ({
  getPayload: vi.fn(() =>
    Promise.resolve({
      find: mockFind,
      findByID: mockFindByID,
      update: mockUpdate,
      create: mockCreate,
      db: { beginTransaction: mockBeginTransaction },
    }),
  ),
}))

vi.mock('payload', () => ({
  commitTransaction: mockCommitTransaction,
  killTransaction: mockKillTransaction,
}))

const { getMenuItemsForValidation, createOrderForTenant } = await import('../orders')

const PILOT_ID = 1

describe('getMenuItemsForValidation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries menu-items scoped to the tenant and the given ids, including inactive rows', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    await getMenuItemsForValidation(PILOT_ID, [10, 11])

    expect(mockFind).toHaveBeenCalledWith({
      collection: 'menu-items',
      where: { restaurant: { equals: PILOT_ID }, id: { in: [10, 11] } },
      limit: 0,
    })
    expect(mockFind).toHaveBeenCalledWith({
      collection: 'modifiers',
      where: { restaurant: { equals: PILOT_ID }, menuItem: { in: [10, 11] }, active: { equals: true } },
      limit: 0,
    })
    expect(mockFind).toHaveBeenCalledWith({
      collection: 'modifier-options',
      where: { restaurant: { equals: PILOT_ID } },
      limit: 0,
    })
  })

  it('assembles items -> modifiers -> options, preserving inactive flags', async () => {
    mockFind.mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'menu-items') {
        return Promise.resolve({
          docs: [{ id: 10, name: 'Cappuccino', price: 4.5, available: false }],
        })
      }
      if (collection === 'modifiers') {
        return Promise.resolve({
          docs: [{ id: 101, name: 'Size', type: 'single', required: true, active: true, menuItem: 10 }],
        })
      }
      if (collection === 'modifier-options') {
        return Promise.resolve({
          docs: [
            { id: 201, label: 'Small', priceAdjustment: 0, active: true, modifier: 101 },
            { id: 202, label: 'Large', priceAdjustment: 1, active: false, modifier: 101 },
          ],
        })
      }
      return Promise.resolve({ docs: [] })
    })

    const result = await getMenuItemsForValidation(PILOT_ID, [10])

    expect(result).toEqual([
      {
        id: 10,
        name: 'Cappuccino',
        price: 4.5,
        active: false,
        modifiers: [
          {
            id: 101,
            name: 'Size',
            type: 'single',
            required: true,
            options: [
              { id: 201, label: 'Small', priceAdjustment: 0, active: true },
              { id: 202, label: 'Large', priceAdjustment: 1, active: false },
            ],
          },
        ],
      },
    ])
  })

  it('never mixes decoy tenant rows into a pilot query', async () => {
    mockFind.mockImplementation(
      ({ collection, where }: { collection: string; where: { restaurant: { equals: number } } }) => {
        const isPilot = where.restaurant.equals === PILOT_ID
        if (collection === 'menu-items') {
          return Promise.resolve({
            docs: isPilot
              ? [{ id: 10, name: 'Pilot Item', price: 1, available: true }]
              : [{ id: 20, name: 'Decoy Item', price: 1, available: true }],
          })
        }
        return Promise.resolve({ docs: [] })
      },
    )

    const result = await getMenuItemsForValidation(PILOT_ID, [10])

    expect(result).toEqual([{ id: 10, name: 'Pilot Item', price: 1, active: true, modifiers: [] }])
    expect(result.some((i) => i.name === 'Decoy Item')).toBe(false)
  })
})

describe('createOrderForTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBeginTransaction.mockResolvedValue('txn-1')
    mockFindByID.mockResolvedValue({ id: PILOT_ID, lastOrderSequence: 5 })
    mockUpdate.mockResolvedValue({ id: PILOT_ID, lastOrderSequence: 6 })
    mockCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ ...data, id: 999, createdAt: '2026-07-02T00:00:00.000Z' }),
    )
    mockCommitTransaction.mockResolvedValue(undefined)
    mockKillTransaction.mockResolvedValue(undefined)
  })

  it('locks the restaurant row, increments the sequence, and creates the order with a zero-padded order number', async () => {
    const items = [
      {
        menuItem: 10,
        itemName: 'Cappuccino',
        unitPrice: 4.5,
        quantity: 2,
        selectedModifiers: [{ modifierName: 'Size', options: [{ label: 'Large', priceAdjustment: 1 }] }],
      },
    ]

    const result = await createOrderForTenant(PILOT_ID, items, 13.5)

    expect(mockFindByID).toHaveBeenCalledWith({
      collection: 'restaurants',
      id: PILOT_ID,
      req: { transactionID: 'txn-1' },
    })
    expect(mockUpdate).toHaveBeenCalledWith({
      collection: 'restaurants',
      id: PILOT_ID,
      data: { lastOrderSequence: 6 },
      req: { transactionID: 'txn-1' },
    })
    expect(mockCreate).toHaveBeenCalledWith({
      collection: 'orders',
      data: {
        restaurant: PILOT_ID,
        sequenceNumber: 6,
        orderNumber: 'ORD-0006',
        status: 'PENDING',
        totalPrice: 13.5,
        items,
      },
      req: { transactionID: 'txn-1' },
    })
    expect(result).toEqual({
      orderNumber: 'ORD-0006',
      totalPrice: 13.5,
      status: 'PENDING',
      createdAt: '2026-07-02T00:00:00.000Z',
    })
  })
})
