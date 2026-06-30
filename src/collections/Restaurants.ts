import type { CollectionConfig } from 'payload'

export const Restaurants: CollectionConfig = {
  slug: 'restaurants',
  admin: {
    useAsTitle: 'name',
    group: 'Platform',
    defaultColumns: ['name', 'slug', 'active', 'updatedAt'],
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
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'URL-safe identifier used in /r/<slug> diner routes. Lowercase, hyphens only.',
      },
      hooks: {
        beforeValidate: [
          ({ value }) =>
            typeof value === 'string' ? value.toLowerCase().trim() : value,
        ],
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Inactive restaurants resolve to 404 on diner routes.',
      },
    },
  ],
}
