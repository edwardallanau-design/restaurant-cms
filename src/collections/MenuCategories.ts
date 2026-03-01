import type { CollectionConfig } from 'payload'
import { safeRevalidateTag } from '../lib/revalidate.ts'
import { CACHE_TAGS } from '../lib/cache.ts'

export const MenuCategories: CollectionConfig = {
  slug: 'menu-categories',
  admin: {
    useAsTitle: 'name',
    group: 'Menu',
    defaultColumns: ['name', 'slug', 'order', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Category Name',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      unique: true,
      admin: {
        description: 'URL-safe identifier. Auto-generated from name if left blank.',
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            if (value) return value
            if (data?.name) {
              return (data.name as string)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Optional short description shown above the category on the menu page.',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display Order',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first.',
        position: 'sidebar',
      },
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
