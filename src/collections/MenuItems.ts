import type { CollectionConfig } from 'payload'
import { safeRevalidateTag } from '../lib/revalidate.ts'
import { CACHE_TAGS } from '../lib/cache.ts'

export const MenuItems: CollectionConfig = {
  slug: 'menu-items',
  admin: {
    useAsTitle: 'name',
    group: 'Menu',
    defaultColumns: ['name', 'category', 'price', 'available', 'featured', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    // ── Core info ─────────────────────────────────────────────────────────────
    {
      name: 'name',
      type: 'text',
      label: 'Item Name',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'Auto-generated from name.',
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
      name: 'category',
      type: 'relationship',
      relationTo: 'menu-categories',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
    },
    {
      name: 'price',
      type: 'number',
      label: 'Price (USD)',
      required: true,
      min: 0,
      admin: {
        description: 'Enter the price in dollars (e.g. 12.99).',
      },
    },
    // ── Media ─────────────────────────────────────────────────────────────────
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Photo',
    },
    // ── Flags ─────────────────────────────────────────────────────────────────
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Featured',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show this item in the "Featured Dishes" section on the home page.',
      },
    },
    {
      name: 'available',
      type: 'checkbox',
      label: 'Available',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Uncheck to hide this item from the menu without deleting it.',
      },
    },
    {
      name: 'dietaryFlags',
      type: 'select',
      label: 'Dietary Flags',
      hasMany: true,
      options: [
        { label: 'Vegetarian', value: 'vegetarian' },
        { label: 'Vegan', value: 'vegan' },
        { label: 'Gluten-Free', value: 'gluten-free' },
        { label: 'Spicy', value: 'spicy' },
        { label: 'Contains Nuts', value: 'contains-nuts' },
        { label: 'Dairy-Free', value: 'dairy-free' },
        { label: "Chef's Special", value: 'chefs-special' },
      ],
    },
    // ── Sorting ───────────────────────────────────────────────────────────────
    {
      name: 'order',
      type: 'number',
      label: 'Display Order',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers appear first within the category.',
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
