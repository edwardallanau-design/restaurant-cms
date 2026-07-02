import { checkout } from '@/server/ordering/checkout'
import { cartSchema } from '@/server/ordering/checkout.schema'
import { DomainError, toErrorResponse } from '@/server/ordering/errors'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function POST(request: Request, { params }: RouteParams): Promise<Response> {
  const { slug } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON.', details: [] } },
      { status: 400 },
    )
  }

  const parsed = cartSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: { code: 'INVALID_BODY', message: 'Request body does not match the expected shape.', details: [] } },
      { status: 400 },
    )
  }

  try {
    const result = await checkout(slug, parsed.data)

    if (result === null) {
      return Response.json(
        { error: { code: 'RESTAURANT_NOT_FOUND', message: 'Restaurant not found', details: [] } },
        { status: 404 },
      )
    }

    return Response.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof DomainError) {
      return toErrorResponse(error)
    }
    throw error
  }
}
