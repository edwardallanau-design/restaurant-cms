import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { getPayload } from '@/lib/payload'
import { CACHE_TAGS } from '@/lib/cache'
import { Container } from '@/components/custom/Container'
import { Section } from '@/components/custom/Section'
import { EventCard } from '@/components/events/EventCard'

export const metadata: Metadata = {
  title: 'Events & Specials',
  description: 'Stay up to date with our latest events, promotions, and special occasions.',
}

const getEvents = unstable_cache(
  async () => {
    const payload = await getPayload()
    const now = new Date().toISOString()
    // Upcoming + published, featured first
    const result = await payload.find({
      collection: 'events',
      where: {
        and: [
          { status: { equals: 'published' } },
          { date: { greater_than_equal: now } },
        ],
      },
      sort: ['-featured', 'date'],
      limit: 50,
      depth: 1,
    })
    return result.docs
  },
  ['events-page'],
  { tags: [CACHE_TAGS.events], revalidate: 300 },
)

export default async function EventsPage() {
  const events = await getEvents()

  const featured = events.filter((e) => e.featured)
  const regular = events.filter((e) => !e.featured)

  return (
    <>
      <div className="bg-primary-900 pb-16 pt-32 text-center text-white">
        <Container>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-300">
            What&apos;s Coming Up
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">Events & Specials</h1>
        </Container>
      </div>

      <Section className="bg-white">
        <Container>
          {events.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xl text-muted">No upcoming events right now — check back soon!</p>
            </div>
          ) : (
            <div className="space-y-16">
              {/* Featured events */}
              {featured.length > 0 && (
                <div>
                  <h2 className="mb-8 font-serif text-2xl font-bold text-gray-900">
                    Featured Events
                  </h2>
                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {featured.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular events */}
              {regular.length > 0 && (
                <div>
                  {featured.length > 0 && (
                    <h2 className="mb-8 font-serif text-2xl font-bold text-gray-900">
                      Upcoming Events
                    </h2>
                  )}
                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {regular.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
