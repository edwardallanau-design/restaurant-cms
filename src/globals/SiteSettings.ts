import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
    description: 'Restaurant contact information, hours, and global SEO defaults.',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    // ── Branding ──────────────────────────────────────────────────────────────
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
    // ── Contact ───────────────────────────────────────────────────────────────
    {
      name: 'contact',
      type: 'group',
      label: 'Contact Information',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'phone',
              type: 'text',
              label: 'Phone Number',
              admin: { width: '50%' },
            },
            {
              name: 'email',
              type: 'email',
              label: 'Public Email',
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'address',
          type: 'group',
          label: 'Address',
          fields: [
            {
              name: 'street',
              type: 'text',
              label: 'Street',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'city',
                  type: 'text',
                  label: 'City',
                  admin: { width: '40%' },
                },
                {
                  name: 'state',
                  type: 'text',
                  label: 'State',
                  admin: { width: '20%' },
                },
                {
                  name: 'zip',
                  type: 'text',
                  label: 'ZIP Code',
                  admin: { width: '20%' },
                },
                {
                  name: 'country',
                  type: 'text',
                  label: 'Country',
                  defaultValue: 'USA',
                  admin: { width: '20%' },
                },
              ],
            },
          ],
        },
        {
          name: 'googleMapsEmbedUrl',
          type: 'text',
          label: 'Google Maps Embed URL',
          admin: {
            description:
              'Paste the embed URL from Google Maps (Share → Embed a map → Copy HTML, extract the src URL).',
          },
        },
      ],
    },
    // ── Hours ─────────────────────────────────────────────────────────────────
    {
      name: 'hours',
      type: 'array',
      label: 'Opening Hours',
      admin: {
        description: 'Add one row per day or day range (e.g. "Mon–Fri").',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'day',
              type: 'text',
              label: 'Day(s)',
              required: true,
              admin: { width: '30%', placeholder: 'e.g. Monday–Friday' },
            },
            {
              name: 'openTime',
              type: 'text',
              label: 'Opens',
              admin: { width: '25%', placeholder: 'e.g. 11:00 AM' },
            },
            {
              name: 'closeTime',
              type: 'text',
              label: 'Closes',
              admin: { width: '25%', placeholder: 'e.g. 10:00 PM' },
            },
            {
              name: 'closed',
              type: 'checkbox',
              label: 'Closed',
              defaultValue: false,
              admin: { width: '20%' },
            },
          ],
        },
      ],
    },
    // ── Social Links ──────────────────────────────────────────────────────────
    {
      name: 'socialLinks',
      type: 'group',
      label: 'Social Media Links',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'instagram',
              type: 'text',
              label: 'Instagram URL',
              admin: { width: '33%' },
            },
            {
              name: 'facebook',
              type: 'text',
              label: 'Facebook URL',
              admin: { width: '33%' },
            },
            {
              name: 'tiktok',
              type: 'text',
              label: 'TikTok URL',
              admin: { width: '33%' },
            },
          ],
        },
      ],
    },
    // ── Default SEO ───────────────────────────────────────────────────────────
    {
      name: 'seo',
      type: 'group',
      label: 'Default SEO',
      admin: {
        description:
          'Fallback metadata used when a page does not have its own SEO fields.',
      },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          label: 'Default Meta Title',
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Default Meta Description',
          admin: {
            description: 'Aim for 120–160 characters.',
          },
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Default OG Image',
          admin: {
            description: 'Recommended size: 1200 × 630 px.',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      () => {
        revalidateTag(CACHE_TAGS.settings)
      },
    ],
  },
}
