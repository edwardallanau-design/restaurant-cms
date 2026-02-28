import type { CollectionConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'

export const GalleryImages: CollectionConfig = {
  slug: 'gallery-images',
  admin: {
    useAsTitle: 'caption',
    group: 'Content',
    defaultColumns: ['image', 'caption', 'featured', 'order', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Photo',
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      admin: {
        description: 'Optional caption shown on hover.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Featured',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show in the gallery preview section on the home page.',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display Order',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers appear first.',
      },
    },
  ],
  hooks: {
    afterChange: [
      () => {
        revalidateTag(CACHE_TAGS.gallery)
        revalidateTag(CACHE_TAGS.media)
      },
    ],
    afterDelete: [
      () => {
        revalidateTag(CACHE_TAGS.gallery)
      },
    ],
  },
}
