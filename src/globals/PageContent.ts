import type { GlobalConfig } from 'payload'
import { safeRevalidateTag } from '../lib/revalidate.ts'
import { CACHE_TAGS } from '../lib/cache.ts'

export const PageContent: GlobalConfig = {
  slug: 'page-content',
  label: 'Page Content',
  admin: {
    group: 'Settings',
    description: 'Editable static text for page headers and sections.',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    // ── Home Page ─────────────────────────────────────────────────────────────
    {
      name: 'home',
      type: 'group',
      label: 'Home Page',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              label: 'Featured Section Eyebrow',
              defaultValue: 'Our Selection',
              admin: { width: '50%', description: 'Small label shown above the Featured Dishes heading.' },
            },
            {
              name: 'headerTitle',
              type: 'text',
              label: 'Featured Section Heading',
              defaultValue: 'Featured Dishes',
              admin: { width: '50%', description: 'Main heading of the featured menu section.' },
            },
          ],
        },
      ],
    },
    // ── Menu Page ─────────────────────────────────────────────────────────────
    {
      name: 'menu',
      type: 'group',
      label: 'Menu Page',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              label: 'Eyebrow Text',
              defaultValue: 'What We Offer',
              admin: { width: '50%', description: 'Small label shown above the page title.' },
            },
            {
              name: 'headerTitle',
              type: 'text',
              label: 'Page Title',
              defaultValue: 'Our Menu',
              admin: { width: '50%', description: 'Main heading shown in the page header.' },
            },
          ],
        },
      ],
    },
    // ── Gallery Page ──────────────────────────────────────────────────────────
    {
      name: 'gallery',
      type: 'group',
      label: 'Gallery Page',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              label: 'Eyebrow Text',
              defaultValue: 'A Visual Story',
              admin: { width: '50%', description: 'Small label shown above the page title.' },
            },
            {
              name: 'headerTitle',
              type: 'text',
              label: 'Page Title',
              defaultValue: 'Gallery',
              admin: { width: '50%', description: 'Main heading shown in the page header.' },
            },
          ],
        },
      ],
    },
    // ── Events Page ───────────────────────────────────────────────────────────
    {
      name: 'events',
      type: 'group',
      label: 'Events Page',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              label: 'Eyebrow Text',
              defaultValue: "What's Coming Up",
              admin: { width: '50%', description: 'Small label shown above the page title.' },
            },
            {
              name: 'headerTitle',
              type: 'text',
              label: 'Page Title',
              defaultValue: 'Events & Specials',
              admin: { width: '50%', description: 'Main heading shown in the page header.' },
            },
          ],
        },
      ],
    },
    // ── Contact Page ──────────────────────────────────────────────────────────
    {
      name: 'contact',
      type: 'group',
      label: 'Contact Page',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              label: 'Eyebrow Text',
              defaultValue: 'Find Us',
              admin: { width: '50%', description: 'Small label shown above the page title.' },
            },
            {
              name: 'headerTitle',
              type: 'text',
              label: 'Page Title',
              defaultValue: 'Contact & Location',
              admin: { width: '50%', description: 'Main heading shown in the page header.' },
            },
          ],
        },
      ],
    },
    // ── About Page ────────────────────────────────────────────────────────────
    {
      name: 'about',
      type: 'group',
      label: 'About Page',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              label: 'Eyebrow Text',
              defaultValue: 'Who We Are',
              admin: { width: '50%', description: 'Small label shown above the page title.' },
            },
            {
              name: 'headerTitle',
              type: 'text',
              label: 'Page Title',
              defaultValue: 'About Us',
              admin: { width: '50%', description: 'Main heading shown in the page header.' },
            },
          ],
        },
        {
          name: 'tagline',
          type: 'text',
          label: 'Tagline',
          admin: { description: 'Short quote displayed prominently in the story section.' },
        },
        {
          name: 'story',
          type: 'richText',
          label: 'Story / Introduction',
          admin: {
            description: 'Paragraph(s) shown in the introduction section below the page header.',
          },
        },
        {
          name: 'storyFormatting',
          type: 'group',
          label: 'Story Section Formatting',
          admin: {
            description: 'Control the visual appearance of the story / introduction section.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'background',
                  type: 'select',
                  label: 'Background',
                  defaultValue: 'white',
                  admin: { width: '33%' },
                  options: [
                    { label: 'White', value: 'white' },
                    { label: 'Off-white (Surface)', value: 'surface' },
                    { label: 'Primary Light', value: 'primary-light' },
                  ],
                },
                {
                  name: 'textAlign',
                  type: 'select',
                  label: 'Text Alignment',
                  defaultValue: 'center',
                  admin: { width: '33%' },
                  options: [
                    { label: 'Center', value: 'center' },
                    { label: 'Left', value: 'left' },
                  ],
                },
                {
                  name: 'containerWidth',
                  type: 'select',
                  label: 'Container Width',
                  defaultValue: 'narrow',
                  admin: { width: '33%' },
                  options: [
                    { label: 'Narrow', value: 'narrow' },
                    { label: 'Default', value: 'default' },
                    { label: 'Wide', value: 'wide' },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'valuesHeading',
          type: 'text',
          label: 'Values Section Heading',
          defaultValue: 'Our Values',
        },
        {
          name: 'values',
          type: 'array',
          label: 'Values Cards',
          admin: {
            description: 'Cards shown in the values section. You can add, remove, and reorder them.',
          },
          defaultValue: [
            {
              icon: '🌿',
              title: 'Fresh & Seasonal',
              description:
                'We source the finest local and seasonal ingredients to keep every dish vibrant and full of flavour.',
            },
            {
              icon: '👨‍🍳',
              title: 'Crafted with Care',
              description:
                'Every plate is prepared by our dedicated kitchen team with time-honoured techniques and modern creativity.',
            },
            {
              icon: '🤝',
              title: 'Warm Hospitality',
              description:
                'From the moment you walk in, we treat every guest like family. Your experience is our priority.',
            },
          ],
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'icon',
                  type: 'text',
                  label: 'Icon (emoji)',
                  admin: { width: '20%', placeholder: '🌿' },
                },
                {
                  name: 'title',
                  type: 'text',
                  label: 'Title',
                  required: true,
                  admin: { width: '80%' },
                },
              ],
            },
            {
              name: 'description',
              type: 'textarea',
              label: 'Description',
              required: true,
            },
          ],
        },
        {
          name: 'ctaHeading',
          type: 'text',
          label: 'CTA Heading',
          defaultValue: 'Come Visit Us',
        },
        {
          name: 'ctaSubtext',
          type: 'text',
          label: 'CTA Subtext',
          defaultValue:
            "We'd love to welcome you. View our menu or get in touch to plan your visit.",
        },
        {
          type: 'row',
          fields: [
            {
              name: 'ctaPrimaryText',
              type: 'text',
              label: 'Primary Button Text',
              defaultValue: 'View Our Menu',
              admin: { width: '50%' },
            },
            {
              name: 'ctaSecondaryText',
              type: 'text',
              label: 'Secondary Button Text',
              defaultValue: 'Contact Us',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        await safeRevalidateTag(CACHE_TAGS.content)
      },
    ],
  },
}
