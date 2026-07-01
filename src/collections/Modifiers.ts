import type { CollectionConfig } from 'payload'

export const Modifiers: CollectionConfig = {
  slug: 'modifiers',
  admin: {
    useAsTitle: 'name',
    group: 'Menu',
    defaultColumns: ['name', 'menuItem', 'type', 'required', 'active', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'menuItem',
      type: 'relationship',
      relationTo: 'menu-items',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'name',
      type: 'text',
      label: 'Modifier Name',
      required: true,
      admin: {
        description: 'e.g. "Size"',
      },
    },
    {
      name: 'type',
      type: 'select',
      label: 'Selection Type',
      required: true,
      options: [
        { label: 'Single-select', value: 'single' },
        { label: 'Multi-select', value: 'multi' },
      ],
    },
    {
      name: 'required',
      type: 'checkbox',
      label: 'Required',
      defaultValue: false,
      admin: {
        description: 'If checked, the diner must choose at least one option at checkout.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Uncheck to hide this modifier without deleting it.',
      },
    },
  ],
  indexes: [
    {
      fields: ['restaurant', 'menuItem'],
    },
  ],
}
