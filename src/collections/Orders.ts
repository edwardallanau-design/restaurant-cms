import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Orders',
    defaultColumns: ['orderNumber', 'status', 'totalPrice', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: () => true,
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'sequenceNumber',
      type: 'number',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Per-café sequence value at creation time (INV-6).',
      },
    },
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: '"ORD-" + zero-padded sequenceNumber.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'PENDING',
      options: [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Confirmed', value: 'CONFIRMED' },
        { label: 'Cancelled', value: 'CANCELLED' },
      ],
    },
    {
      name: 'totalPrice',
      type: 'number',
      required: true,
      admin: {
        description: 'Server-computed total (INV-1/13). Never trust a client-sent value.',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'menuItem',
          type: 'relationship',
          relationTo: 'menu-items',
          required: true,
        },
        {
          name: 'itemName',
          type: 'text',
          required: true,
        },
        {
          name: 'unitPrice',
          type: 'number',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
        },
        {
          name: 'selectedModifiers',
          type: 'json',
        },
      ],
    },
  ],
  indexes: [
    {
      fields: ['restaurant', 'sequenceNumber'],
      unique: true,
    },
  ],
}
