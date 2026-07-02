import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Orders',
    defaultColumns: ['orderNumber', 'status', 'totalPrice', 'createdAt'],
  },
  // Diner checkout creates via Local API (overrideAccess default); REST create stays authed.
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
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
        readOnly: true,
      },
    },
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
        description: '"ORD-" + zero-padded sequenceNumber. Unique per-restaurant (see indexes below), not globally.',
        readOnly: true,
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
        readOnly: true,
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        readOnly: true,
        description: 'Snapshotted at checkout (INV-3). Never edit — desyncs totalPrice from items.',
      },
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
    {
      fields: ['restaurant', 'orderNumber'],
      unique: true,
    },
  ],
}
