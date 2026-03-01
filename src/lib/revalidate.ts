/**
 * Safe wrapper around next/cache revalidateTag.
 * No-ops gracefully when called outside the Next.js runtime
 * (e.g. during `payload generate:types` or migration scripts).
 */
export async function safeRevalidateTag(tag: string): Promise<void> {
  try {
    const { revalidateTag } = await import('next/cache')
    revalidateTag(tag)
  } catch {
    // Outside Next.js runtime — silently skip
  }
}
