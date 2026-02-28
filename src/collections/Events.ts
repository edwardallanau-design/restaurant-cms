import type { CollectionConfig } from 'payload'
import { safeRevalidateTag } from '../lib/revalidate.ts'
import { CACHE_TAGS } from '../lib/cache.ts'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'date', 'status', 'featured', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Event Title',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'Auto-generated from title.',
      },
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            if (value) return value
            if (data?.title) {
              return (data.title as string)
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
      type: 'richText',
      label: 'Description',
    },
    {
      name: 'date',
      type: 'date',
      label: 'Event Date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      label: 'End Date / Time',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Leave blank for single-day events.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Event Image',
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Featured',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Pin this event to the top of the events page.',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    afterChange: [
      () => {
        safeRevalidateTag(CACHE_TAGS.events)
      },
    ],
    afterDelete: [
      () => {
        safeRevalidateTag(CACHE_TAGS.events)
      },
    ],
  },
}
