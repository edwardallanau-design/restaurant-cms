import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFind = vi.fn()
const mockCreate = vi.fn()
const mockBeginTransaction = vi.fn()
const mockCommitTransaction = vi.fn()
const mockKillTransaction = vi.fn()

// Drizzle query-builder chain: session.db.update(table).set(...).where(...).returning(...)
const mockReturning = vi.fn()
const mockWhere = vi.fn(() => ({ returning: mockReturning }))
const mockSet = vi.fn(() => ({ where: mockWhere }))
const mockUpdate = vi.fn(() => ({ set: mockSet }))

const RESTAURANTS_TABLE = { id: 'id-col', lastOrderSequence: 'last-order-sequence-col' }

vi.mock('@/lib/payload', () => ({
  getPayload: vi.fn(() =>
    Promise.resolve({
      find: mockFind,
      create: mockCreate,
      db: {
        beginTransaction: mockBeginTransaction,
        sessions: { 'txn-1': { db: { update: mockUpdate } } },
        tables: { restaurants: RESTAURANTS_TABLE },
      },
    }),
  ),
}))

vi.mock('payload', () => ({
  commitTransaction: mockCommitTransaction,
  killTransaction: mockKillTransaction,
}))

vi.mock('@payloadcms/db-postgres', () => ({
  // Minimal stand-in for drizzle's `sql` tagged template — not executed against a real DB in
  // these unit tests, only used to build the `.set()`/`.where()` call arguments.
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
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
    mockReturning.mockResolvedValue([{ lastOrderSequence: 6 }])
    mockCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ ...data, id: 999, createdAt: '2026-07-02T00:00:00.000Z' }),
    )
    mockCommitTransaction.mockResolvedValue(undefined)
    mockKillTransaction.mockResolvedValue(undefined)
  })

  it('atomically increments the sequence via the transaction-scoped drizzle session, and creates the order with a zero-padded order number', async () => {
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

    // The increment runs on the transaction's OWN drizzle session (keyed by transactionID),
    // not the adapter's default drizzle instance — this is what makes it part of the same
    // atomic unit of work as the order create.
    expect(mockUpdate).toHaveBeenCalledWith(RESTAURANTS_TABLE)
    expect(mockSet).toHaveBeenCalledTimes(1)
    expect(mockWhere).toHaveBeenCalledTimes(1)
    expect(mockReturning).toHaveBeenCalledWith({ lastOrderSequence: RESTAURANTS_TABLE.lastOrderSequence })

    // The RETURNING value from the atomic UPDATE is used directly as the sequence number —
    // no separate read step that a concurrent transaction could race against.
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

  it('gives two concurrent-style calls distinct sequence numbers from their own RETURNING rows', async () => {
    // Simulates what Postgres row-locking guarantees: the second UPDATE only proceeds (and
    // returns its RETURNING row) after the first transaction's increment is visible, so each
    // call gets a distinct, correctly-incremented value rather than reading a stale counter.
    mockReturning.mockResolvedValueOnce([{ lastOrderSequence: 6 }]).mockResolvedValueOnce([{ lastOrderSequence: 7 }])

    const first = await createOrderForTenant(PILOT_ID, [], 0)
    const second = await createOrderForTenant(PILOT_ID, [], 0)

    expect(first.orderNumber).toBe('ORD-0006')
    expect(second.orderNumber).toBe('ORD-0007')
  })

  it('throws and does not create an order when the restaurant row is not found (empty RETURNING)', async () => {
    mockReturning.mockResolvedValue([])

    await expect(createOrderForTenant(PILOT_ID, [], 0)).rejects.toThrow(/not found for sequence increment/)
    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockKillTransaction).toHaveBeenCalledWith(expect.objectContaining({ transactionID: 'txn-1' }))
  })

  it('kills the transaction and rethrows when the order create fails', async () => {
    const createError = new Error('insert failed')
    mockCreate.mockRejectedValue(createError)

    await expect(createOrderForTenant(PILOT_ID, [], 0)).rejects.toBe(createError)

    expect(mockKillTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ transactionID: 'txn-1' }),
    )
    expect(mockCommitTransaction).not.toHaveBeenCalled()
  })

  it('kills the transaction and rethrows when no transaction session is registered for the id', async () => {
    mockBeginTransaction.mockResolvedValue('txn-missing')

    await expect(createOrderForTenant(PILOT_ID, [], 0)).rejects.toThrow(/no transaction session/)
    expect(mockKillTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ transactionID: 'txn-missing' }),
    )
  })
})
