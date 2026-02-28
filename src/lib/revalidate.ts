/**
 * Safe wrapper around next/cache revalidateTag.
 * No-ops gracefully when called outside the Next.js runtime
 * (e.g. during `payload generate:types` or migration scripts).
 */
export function safeRevalidateTag(tag: string): void {
  // Dynamic import avoids static resolution failures in non-Next.js contexts
  import('next/cache')
    .then(({ revalidateTag }) => revalidateTag(tag))
    .catch(() => {
      // Outside Next.js runtime — silently skip
    })
}
