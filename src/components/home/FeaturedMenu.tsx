import Image from 'next/image'
import type { MenuItem, Media } from '@/payload-types'
import { Container } from '@/components/custom/Container'
import { Section } from '@/components/custom/Section'
import { ButtonLink } from '@/components/custom/Button'

interface FeaturedMenuProps {
  items: MenuItem[]
}

const DIETARY_LABELS: Record<string, string> = {
  vegetarian: 'V',
  vegan: 'VG',
  'gluten-free': 'GF',
  spicy: '🌶',
  'contains-nuts': 'N',
  'dairy-free': 'DF',
  'chefs-special': '★',
}

export function FeaturedMenu({ items }: FeaturedMenuProps) {
  if (!items.length) return null

  return (
    <Section className="bg-white">
      <Container>
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-500">
            Our Selection
          </p>
          <h2 className="font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            Featured Dishes
          </h2>
        </div>

        {/* Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const image = typeof item.image === 'object' ? (item.image as Media) : null
            return (
              <article
                key={item.id}
                className="group overflow-hidden rounded-card bg-surface shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  {image?.url ? (
                    <Image
                      src={image.url}
                      alt={image.alt ?? item.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-primary-50 text-primary-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-12 w-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 21H3v-1a6 6 0 0 1 12 0v1Zm0 0h6v-1a6 6 0 0 0-9-5.197M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-lg font-semibold text-gray-900">{item.name}</h3>
                    <span className="shrink-0 text-lg font-bold text-primary-600">
                      ${Number(item.price).toFixed(2)}
                    </span>
                  </div>

                  {/* Dietary flags */}
                  {item.dietaryFlags && item.dietaryFlags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.dietaryFlags.map((flag) => (
                        <span
                          key={flag}
                          title={flag}
                          className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700"
                        >
                          {DIETARY_LABELS[flag] ?? flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <ButtonLink href="/menu" variant="outline">
            View Full Menu
          </ButtonLink>
        </div>
      </Container>
    </Section>
  )
}
