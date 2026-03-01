/**
 * Cache tag constants used across data-fetching functions and Payload afterChange hooks.
 * Centralising them here prevents magic strings and makes invalidation easy to trace.
 */
export const CACHE_TAGS = {
  menu: 'menu',
  gallery: 'gallery',
  events: 'events',
  settings: 'site-settings',
  hero: 'hero',
  media: 'media',
  content: 'page-content',
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]
