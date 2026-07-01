import type { CollectionConfig } from 'payload'
import { safeRevalidateTag } from '../lib/revalidate.ts'
import { CACHE_TAGS } from '../lib/cache.ts'

export const ModifierOptions: CollectionConfig = {
  slug: 'modifier-options',
  admin: {
    useAsTitle: 'label',
    group: 'Menu',
    defaultColumns: ['label', 'modifier', 'priceAdjustment', 'active', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'modifier',
      type: 'relationship',
      relationTo: 'modifiers',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'label',
      type: 'text',
      label: 'Option Label',
      required: true,
      admin: {
        description: 'e.g. "Large"',
      },
    },
    {
      name: 'priceAdjustment',
      type: 'number',
      label: 'Price Adjustment (USD)',
      defaultValue: 0,
      admin: {
        description: 'Added to the base item price. Use a negative number for a discount.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Uncheck to hide this option without deleting it.',
      },
    },
  ],
  indexes: [
    {
      fields: ['restaurant', 'modifier'],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        await safeRevalidateTag(CACHE_TAGS.menu)
      },
    ],
    afterDelete: [
      async () => {
        await safeRevalidateTag(CACHE_TAGS.menu)
      },
    ],
  },
}
