import { describe, it, expect } from 'vitest'
import { DomainError, toErrorResponse } from '../errors'

describe('DomainError / toErrorResponse', () => {
  it('maps every domain error code to 422 with the standard envelope', async () => {
    const codes = [
      'EMPTY_ORDER',
      'ITEM_INACTIVE',
      'INVALID_MODIFIER_SELECTION',
      'OPTION_INACTIVE',
      'REQUIRED_MODIFIER_MISSING',
      'INVALID_QUANTITY',
    ] as const

    for (const code of codes) {
      const error = new DomainError(code, `${code} message`)
      const response = toErrorResponse(error)
      const body = await response.json()

      expect(response.status).toBe(422)
      expect(body).toEqual({ error: { code, message: `${code} message`, details: [] } })
    }
  })
})
