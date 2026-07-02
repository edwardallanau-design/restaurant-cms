import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockResolveSlug = vi.fn()
const mockGetMenuItemsForValidation = vi.fn()
const mockCreateOrderForTenant = vi.fn()

vi.mock('@/server/db', () => ({
  resolveSlug: mockResolveSlug,
  getMenuItemsForValidation: mockGetMenuItemsForValidation,
  createOrderForTenant: mockCreateOrderForTenant,
}))

const { checkout } = await import('../checkout')

const RESTAURANT = { id: 7, name: 'Pilot Café', slug: 'pilot', active: true }

const CAPPUCCINO_ACTIVE = {
  id: 10,
  name: 'Cappuccino',
  price: 4.5,
  active: true,
  modifiers: [
    {
      id: 101,
      name: 'Size',
      type: 'single' as const,
      required: true,
      options: [
        { id: 201, label: 'Small', priceAdjustment: 0, active: true },
        { id: 202, label: 'Large', priceAdjustment: 1, active: true },
      ],
    },
    {
      id: 102,
      name: 'Extras',
      type: 'multi' as const,
      required: false,
      options: [
        { id: 204, label: 'Extra shot', priceAdjustment: 0.75, active: true },
        { id: 205, label: 'Syrup', priceAdjustment: 0.5, active: true },
      ],
    },
  ],
}

function baseCart() {
  return {
    items: [
      {
        menuItemId: 10,
        quantity: 2,
        selectedModifiers: [
          { modifierId: 101, optionIds: [202] },
          { modifierId: 102, optionIds: [204, 205] },
        ],
      },
    ],
  }
}

describe('checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResolveSlug.mockResolvedValue(RESTAURANT)
    mockGetMenuItemsForValidation.mockResolvedValue([CAPPUCCINO_ACTIVE])
    mockCreateOrderForTenant.mockResolvedValue({
      orderNumber: 'ORD-0042',
      totalPrice: 13.5,
      status: 'PENDING',
      createdAt: '2026-07-02T00:00:00.000Z',
    })
  })

  it('returns null when the slug does not resolve to a tenant', async () => {
    mockResolveSlug.mockResolvedValue(null)

    const result = await checkout('unknown', baseCart())

    expect(result).toBeNull()
    expect(mockGetMenuItemsForValidation).not.toHaveBeenCalled()
  })

  it('throws EMPTY_ORDER for a cart with no items', async () => {
    await expect(checkout('pilot', { items: [] })).rejects.toMatchObject({ code: 'EMPTY_ORDER' })
    expect(mockGetMenuItemsForValidation).not.toHaveBeenCalled()
  })

  it('throws ITEM_INACTIVE when the item is inactive', async () => {
    mockGetMenuItemsForValidation.mockResolvedValue([{ ...CAPPUCCINO_ACTIVE, active: false }])

    await expect(checkout('pilot', baseCart())).rejects.toMatchObject({ code: 'ITEM_INACTIVE' })
  })

  it('throws ITEM_INACTIVE when the item id is not found at all', async () => {
    mockGetMenuItemsForValidation.mockResolvedValue([])

    await expect(checkout('pilot', baseCart())).rejects.toMatchObject({ code: 'ITEM_INACTIVE' })
  })

  it('throws INVALID_MODIFIER_SELECTION when an optionId does not belong to its modifier', async () => {
    const cart = {
      items: [
        {
          menuItemId: 10,
          quantity: 1,
          selectedModifiers: [{ modifierId: 101, optionIds: [204] }],
        },
      ],
    }

    await expect(checkout('pilot', cart)).rejects.toMatchObject({ code: 'INVALID_MODIFIER_SELECTION' })
  })

  it('throws INVALID_MODIFIER_SELECTION when a modifierId does not belong to the item', async () => {
    const cart = {
      items: [{ menuItemId: 10, quantity: 1, selectedModifiers: [{ modifierId: 999, optionIds: [1] }] }],
    }

    await expect(checkout('pilot', cart)).rejects.toMatchObject({ code: 'INVALID_MODIFIER_SELECTION' })
  })

  it('throws INVALID_MODIFIER_SELECTION when the same modifierId appears twice on one line (INV-9 bypass)', async () => {
    // Two selections for the same single-select modifier, one option each, would otherwise
    // sneak two options past the single-select cardinality check since neither selection
    // alone has 2+ options.
    const cart = {
      items: [
        {
          menuItemId: 10,
          quantity: 1,
          selectedModifiers: [
            { modifierId: 101, optionIds: [201] },
            { modifierId: 101, optionIds: [202] },
          ],
        },
      ],
    }

    await expect(checkout('pilot', cart)).rejects.toMatchObject({ code: 'INVALID_MODIFIER_SELECTION' })
  })

  it('throws INVALID_MODIFIER_SELECTION when the same optionId appears twice in one selection', async () => {
    const cart = {
      items: [
        {
          menuItemId: 10,
          quantity: 1,
          selectedModifiers: [{ modifierId: 102, optionIds: [204, 204] }],
        },
      ],
    }

    await expect(checkout('pilot', cart)).rejects.toMatchObject({ code: 'INVALID_MODIFIER_SELECTION' })
  })

  it('throws OPTION_INACTIVE when a selected option is inactive', async () => {
    mockGetMenuItemsForValidation.mockResolvedValue([
      {
        ...CAPPUCCINO_ACTIVE,
        modifiers: [
          {
            ...CAPPUCCINO_ACTIVE.modifiers[0],
            options: [
              { id: 201, label: 'Small', priceAdjustment: 0, active: true },
              { id: 202, label: 'Large', priceAdjustment: 1, active: false },
            ],
          },
          CAPPUCCINO_ACTIVE.modifiers[1],
        ],
      },
    ])

    await expect(checkout('pilot', baseCart())).rejects.toMatchObject({ code: 'OPTION_INACTIVE' })
  })

  it('throws INVALID_MODIFIER_SELECTION when a single-select modifier gets 2+ options', async () => {
    const cart = {
      items: [
        {
          menuItemId: 10,
          quantity: 1,
          selectedModifiers: [
            { modifierId: 101, optionIds: [201, 202] },
            { modifierId: 102, optionIds: [] },
          ],
        },
      ],
    }

    await expect(checkout('pilot', cart)).rejects.toMatchObject({ code: 'INVALID_MODIFIER_SELECTION' })
  })

  it('throws REQUIRED_MODIFIER_MISSING when a required modifier has no selection', async () => {
    const cart = {
      items: [{ menuItemId: 10, quantity: 1, selectedModifiers: [{ modifierId: 102, optionIds: [] }] }],
    }

    await expect(checkout('pilot', cart)).rejects.toMatchObject({ code: 'REQUIRED_MODIFIER_MISSING' })
  })

  it('does not demand a required modifier that the validation view no longer contains (soft-deleted modifiers are filtered out by the db layer)', async () => {
    // getMenuItemsForValidation returns active modifiers only — a soft-deleted required
    // modifier must not brick the item (the diner cannot see or select it on the menu).
    mockGetMenuItemsForValidation.mockResolvedValue([
      { ...CAPPUCCINO_ACTIVE, modifiers: [CAPPUCCINO_ACTIVE.modifiers[1]] },
    ])
    const cart = {
      items: [{ menuItemId: 10, quantity: 1, selectedModifiers: [] }],
    }

    const result = await checkout('pilot', cart)

    expect(result).toMatchObject({ orderNumber: 'ORD-0042' })
  })

  it('throws INVALID_QUANTITY for quantity 0', async () => {
    const cart = {
      items: [
        {
          menuItemId: 10,
          quantity: 0,
          selectedModifiers: [
            { modifierId: 101, optionIds: [202] },
            { modifierId: 102, optionIds: [] },
          ],
        },
      ],
    }

    await expect(checkout('pilot', cart)).rejects.toMatchObject({ code: 'INVALID_QUANTITY' })
  })

  it('throws INVALID_QUANTITY for negative quantity', async () => {
    const cart = {
      items: [
        {
          menuItemId: 10,
          quantity: -1,
          selectedModifiers: [
            { modifierId: 101, optionIds: [202] },
            { modifierId: 102, optionIds: [] },
          ],
        },
      ],
    }

    await expect(checkout('pilot', cart)).rejects.toMatchObject({ code: 'INVALID_QUANTITY' })
  })

  it('computes the total server-side matching the worked example (2 x (4.50+1.00+0.75+0.50) = 13.50)', async () => {
    await checkout('pilot', baseCart())

    expect(mockCreateOrderForTenant).toHaveBeenCalledWith(
      7,
      [
        {
          menuItem: 10,
          itemName: 'Cappuccino',
          unitPrice: 4.5,
          quantity: 2,
          selectedModifiers: [
            { modifierName: 'Size', options: [{ label: 'Large', priceAdjustment: 1 }] },
            {
              modifierName: 'Extras',
              options: [
                { label: 'Extra shot', priceAdjustment: 0.75 },
                { label: 'Syrup', priceAdjustment: 0.5 },
              ],
            },
          ],
        },
      ],
      13.5,
    )
  })

  it('allows duplicate menuItemId as independent lines', async () => {
    const cart = {
      items: [
        { menuItemId: 10, quantity: 1, selectedModifiers: [{ modifierId: 101, optionIds: [201] }] },
        { menuItemId: 10, quantity: 1, selectedModifiers: [{ modifierId: 101, optionIds: [202] }] },
      ],
    }

    await checkout('pilot', cart)

    const items = mockCreateOrderForTenant.mock.calls[0]?.[1]
    expect(items).toHaveLength(2)
  })

  it('returns the created order result on success', async () => {
    const result = await checkout('pilot', baseCart())

    expect(result).toEqual({
      orderNumber: 'ORD-0042',
      totalPrice: 13.5,
      status: 'PENDING',
      createdAt: '2026-07-02T00:00:00.000Z',
    })
  })
})
