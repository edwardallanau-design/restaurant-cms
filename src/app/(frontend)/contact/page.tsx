import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { getPayload } from '@/lib/payload'
import { CACHE_TAGS } from '@/lib/cache'
import { Container } from '@/components/custom/Container'
import { Section } from '@/components/custom/Section'
import { ContactForm } from '@/components/contact/ContactForm'

export const metadata: Metadata = {
  title: 'Contact & Location',
  description: 'Find us, check our opening hours, or drop us a message.',
}

const getContactData = unstable_cache(
  async () => {
    const payload = await getPayload()
    return payload.findGlobal({ slug: 'site-settings', depth: 0 })
  },
  ['contact-page'],
  { tags: [CACHE_TAGS.settings], revalidate: 300 },
)

export default async function ContactPage() {
  const settings = await getContactData()
  const { contact, hours, restaurantName } = settings

  return (
    <>
      {/* Header */}
      <div className="bg-primary-900 pb-20 pt-32 text-center text-white">
        <Container>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-300">
            Find Us
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">Contact & Location</h1>
        </Container>
      </div>

      <Section className="bg-white">
        <Container>
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Left — info + hours */}
            <div className="space-y-10">
              {/* Contact info */}
              <div>
                <h2 className="mb-6 font-serif text-2xl font-bold text-gray-900">
                  Get in Touch
                </h2>
                <dl className="space-y-4 text-sm text-gray-600">
                  {contact?.address && (
                    <div className="flex gap-4">
                      <dt className="shrink-0">
                        <LocationIcon className="h-5 w-5 text-primary-500" />
                        <span className="sr-only">Address</span>
                      </dt>
                      <dd>
                        {contact.address.street && <div>{contact.address.street}</div>}
                        <div>
                          {[contact.address.city, contact.address.state, contact.address.zip]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </dd>
                    </div>
                  )}
                  {contact?.phone && (
                    <div className="flex gap-4">
                      <dt className="shrink-0">
                        <PhoneIcon className="h-5 w-5 text-primary-500" />
                        <span className="sr-only">Phone</span>
                      </dt>
                      <dd>
                        <a href={`tel:${contact.phone}`} className="hover:text-primary-600 transition-colors">
                          {contact.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {contact?.email && (
                    <div className="flex gap-4">
                      <dt className="shrink-0">
                        <EmailIcon className="h-5 w-5 text-primary-500" />
                        <span className="sr-only">Email</span>
                      </dt>
                      <dd>
                        <a href={`mailto:${contact.email}`} className="hover:text-primary-600 transition-colors">
                          {contact.email}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Hours */}
              {hours && hours.length > 0 && (
                <div>
                  <h2 className="mb-6 font-serif text-2xl font-bold text-gray-900">
                    Opening Hours
                  </h2>
                  <dl className="divide-y divide-gray-100 rounded-card ring-1 ring-gray-100 overflow-hidden">
                    {hours.map((h, i) => (
                      <div key={i} className="flex justify-between px-4 py-3 text-sm">
                        <dt className="font-medium text-gray-700">{h.day}</dt>
                        <dd className="text-gray-500">
                          {h.closed ? (
                            <span className="text-red-500">Closed</span>
                          ) : (
                            `${h.openTime ?? ''} – ${h.closeTime ?? ''}`
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            {/* Right — form */}
            <div>
              <h2 className="mb-6 font-serif text-2xl font-bold text-gray-900">
                Send a Message
              </h2>
              <ContactForm />
            </div>
          </div>
        </Container>
      </Section>

      {/* Map embed */}
      {contact?.googleMapsEmbedUrl && (
        <div className="h-80 w-full bg-gray-100 lg:h-96">
          <iframe
            src={contact.googleMapsEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${restaurantName ?? 'Restaurant'} location map`}
          />
        </div>
      )}
    </>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  )
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  )
}
