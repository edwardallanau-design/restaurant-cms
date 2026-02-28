import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/env'
import { CACHE_TAGS, type CacheTag } from '@/lib/cache'

/**
 * On-demand ISR revalidation endpoint.
 * Called by Payload afterChange hooks (same process) or external webhooks.
 *
 * POST /api/revalidate
 * Headers: { Authorization: Bearer <REVALIDATION_SECRET> }
 * Body: { tag?: CacheTag } — omit to revalidate all tags
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { tag?: string }

    if (body.tag && Object.values(CACHE_TAGS).includes(body.tag as CacheTag)) {
      revalidateTag(body.tag)
      return NextResponse.json({ revalidated: true, tag: body.tag })
    }

    // No specific tag — revalidate everything
    Object.values(CACHE_TAGS).forEach(revalidateTag)
    return NextResponse.json({ revalidated: true, tags: Object.values(CACHE_TAGS) })
  } catch (err) {
    console.error('[revalidate] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
