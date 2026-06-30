import type { CollectionConfig } from 'payload'
import { safeRevalidateTag } from '../lib/revalidate.ts'
import { CACHE_TAGS } from '../lib/cache.ts'

export const TenantSiteSettings: CollectionConfig = {
  slug: 'tenant-site-settings',
  admin: {
    useAsTitle: 'restaurantName',
    group: 'Settings',
    description: 'Restaurant contact information, hours, and global SEO defaults.',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'restaurantName',
          type: 'text',
          label: 'Restaurant Name',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'tagline',
          type: 'text',
          label: 'Tagline',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
    },
    {
      name: 'navigation',
      type: 'array',
      label: 'Navigation Links',
      admin: {
        description: 'Links shown in the header and footer.',
      },
      defaultValue: [
        { label: 'Home', href: '/' },
        { label: 'Menu', href: '/menu' },
        { label: 'Gallery', href: '/gallery' },
        { label: 'Events', href: '/events' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', label: 'Label', required: true, admin: { width: '50%' } },
            { name: 'href', type: 'text', label: 'Path or URL', required: true, admin: { width: '50%', placeholder: '/menu or https://...' } },
          ],
        },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      label: 'Contact Information',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'phone', type: 'text', label: 'Phone Number', admin: { width: '50%' } },
            { name: 'email', type: 'email', label: 'Public Email', admin: { width: '50%' } },
          ],
        },
        {
          name: 'address',
          type: 'group',
          label: 'Address',
          fields: [
            { name: 'street', type: 'text', label: 'Street' },
            {
              type: 'row',
              fields: [
                { name: 'city', type: 'text', label: 'City', admin: { width: '40%' } },
                { name: 'state', type: 'text', label: 'State', admin: { width: '20%' } },
                { name: 'zip', type: 'text', label: 'ZIP Code', admin: { width: '20%' } },
                { name: 'country', type: 'text', label: 'Country', defaultValue: 'USA', admin: { width: '20%' } },
              ],
            },
          ],
        },
        { name: 'googleMapsEmbedUrl', type: 'text', label: 'Google Maps Embed URL' },
      ],
    },
    {
      name: 'hours',
      type: 'array',
      label: 'Opening Hours',
      admin: { description: 'Add one row per day or day range.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'day', type: 'text', label: 'Day(s)', required: true, admin: { width: '30%', placeholder: 'Monday–Friday' } },
            { name: 'openTime', type: 'text', label: 'Opens', admin: { width: '25%', placeholder: '11:00 AM' } },
            { name: 'closeTime', type: 'text', label: 'Closes', admin: { width: '25%', placeholder: '10:00 PM' } },
            { name: 'closed', type: 'checkbox', label: 'Closed', defaultValue: false, admin: { width: '20%' } },
          ],
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'group',
      label: 'Social Media Links',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'instagram', type: 'text', label: 'Instagram URL', admin: { width: '33%' } },
            { name: 'facebook', type: 'text', label: 'Facebook URL', admin: { width: '33%' } },
            { name: 'tiktok', type: 'text', label: 'TikTok URL', admin: { width: '33%' } },
          ],
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'Default SEO',
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Default Meta Title' },
        { name: 'metaDescription', type: 'textarea', label: 'Default Meta Description' },
        { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'Default OG Image' },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        await safeRevalidateTag(CACHE_TAGS.settings)
      },
    ],
  },
}
