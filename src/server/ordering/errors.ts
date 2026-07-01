export type DomainErrorCode =
  | 'EMPTY_ORDER'
  | 'ITEM_INACTIVE'
  | 'INVALID_MODIFIER_SELECTION'
  | 'OPTION_INACTIVE'
  | 'REQUIRED_MODIFIER_MISSING'
  | 'INVALID_QUANTITY'

export class DomainError extends Error {
  code: DomainErrorCode

  constructor(code: DomainErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  EMPTY_ORDER: 422,
  ITEM_INACTIVE: 422,
  INVALID_MODIFIER_SELECTION: 422,
  OPTION_INACTIVE: 422,
  REQUIRED_MODIFIER_MISSING: 422,
  INVALID_QUANTITY: 422,
}

export function toErrorResponse(error: DomainError): Response {
  return Response.json(
    { error: { code: error.code, message: error.message, details: [] } },
    { status: STATUS_BY_CODE[error.code] },
  )
}
