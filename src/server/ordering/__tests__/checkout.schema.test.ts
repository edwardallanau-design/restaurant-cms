import { describe, it, expect } from 'vitest'
import { cartSchema } from '../checkout.schema'

describe('cartSchema', () => {
  it('accepts a well-shaped cart', () => {
    const result = cartSchema.safeParse({
      items: [
        {
          menuItemId: 10,
          quantity: 2,
          selectedModifiers: [{ modifierId: 101, optionIds: [202] }],
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('accepts an empty items array (EMPTY_ORDER is a domain rule, not a shape rule)', () => {
    const result = cartSchema.safeParse({ items: [] })

    expect(result.success).toBe(true)
  })

  it('rejects a non-integer quantity', () => {
    const result = cartSchema.safeParse({
      items: [{ menuItemId: 10, quantity: 1.5, selectedModifiers: [] }],
    })

    expect(result.success).toBe(false)
  })

  it('accepts quantity 0 or negative (INVALID_QUANTITY is a domain rule, not a shape rule)', () => {
    const result = cartSchema.safeParse({
      items: [{ menuItemId: 10, quantity: 0, selectedModifiers: [] }],
    })

    expect(result.success).toBe(true)
  })

  it('rejects a missing menuItemId', () => {
    const result = cartSchema.safeParse({
      items: [{ quantity: 1, selectedModifiers: [] }],
    })

    expect(result.success).toBe(false)
  })

  it('rejects malformed selectedModifiers', () => {
    const result = cartSchema.safeParse({
      items: [{ menuItemId: 10, quantity: 1, selectedModifiers: [{ modifierId: 'not-a-number' }] }],
    })

    expect(result.success).toBe(false)
  })
})
