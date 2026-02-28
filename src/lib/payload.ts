import config from '@payload-config'
import { getPayload as _getPayload } from 'payload'

/**
 * Returns the Payload client singleton.
 * In Next.js Server Components use this directly — it calls Payload's Local API
 * without any HTTP overhead (same Node.js process).
 *
 * @example
 * const payload = await getPayload()
 * const items = await payload.find({ collection: 'menu-items' })
 */
export const getPayload = () => _getPayload({ config })
