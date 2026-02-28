import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'

export const HeroSection: GlobalConfig = {
  slug: 'hero-section',
  label: 'Home Hero',
  admin: {
    group: 'Settings',
    description: 'Content for the full-screen hero banner on the home page.',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Heading',
      required: true,
      admin: {
        placeholder: 'e.g. Taste the Difference',
      },
    },
    {
      name: 'subheading',
      type: 'textarea',
      label: 'Subheading',
      admin: {
        placeholder: 'e.g. Fresh ingredients, inspired by tradition.',
        rows: 2,
      },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Background Image',
      required: true,
      admin: {
        description: 'Full-width hero image. Recommended: at least 1920 × 1080 px.',
      },
    },
    {
      name: 'backgroundVideo',
      type: 'text',
      label: 'Background Video URL',
      admin: {
        description:
          'Optional video URL (MP4). If set, the video plays muted/looped instead of the image.',
      },
    },
    {
      name: 'primaryCta',
      type: 'group',
      label: 'Primary CTA Button',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'text',
              type: 'text',
              label: 'Button Text',
              admin: { width: '50%', placeholder: 'View Menu' },
            },
            {
              name: 'link',
              type: 'text',
              label: 'Button Link',
              admin: { width: '50%', placeholder: '/menu' },
            },
          ],
        },
      ],
    },
    {
      name: 'secondaryCta',
      type: 'group',
      label: 'Secondary CTA Button (Optional)',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'text',
              type: 'text',
              label: 'Button Text',
              admin: { width: '50%', placeholder: 'Make a Reservation' },
            },
            {
              name: 'link',
              type: 'text',
              label: 'Button Link',
              admin: { width: '50%', placeholder: '/contact' },
            },
          ],
        },
      ],
    },
    {
      name: 'overlay',
      type: 'group',
      label: 'Overlay Options',
      admin: {
        description: 'Controls the dark overlay on top of the hero image for text readability.',
      },
      fields: [
        {
          name: 'opacity',
          type: 'number',
          label: 'Overlay Opacity (0–100)',
          defaultValue: 50,
          min: 0,
          max: 100,
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      () => {
        revalidateTag(CACHE_TAGS.hero)
      },
    ],
  },
}
