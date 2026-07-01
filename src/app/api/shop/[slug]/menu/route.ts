import { unstable_cache } from 'next/cache'
import { getMenu } from '@/server/ordering/menu'
import { CACHE_TAGS } from '@/lib/cache'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  const { slug } = await params

  const cachedGetMenu = unstable_cache(() => getMenu(slug), ['menu', slug], {
    tags: [CACHE_TAGS.menu],
  })
  const menu = await cachedGetMenu()

  if (menu === null) {
    return Response.json(
      { error: { code: 'RESTAURANT_NOT_FOUND', message: 'Restaurant not found', details: [] } },
      { status: 404 },
    )
  }

  return Response.json(menu, { status: 200 })
}
