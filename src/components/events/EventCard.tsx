import Image from 'next/image'
import type { Event, Media } from '@/payload-types'
import { cn } from '@/lib/utils'

interface EventCardProps {
  event: Event
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function EventCard({ event }: EventCardProps) {
  const image = typeof event.image === 'object' ? (event.image as Media) : null
  const isFeatured = event.featured

  return (
    <article
      className={cn(
        'overflow-hidden rounded-card bg-white ring-1 ring-gray-100 transition hover:shadow-md',
        isFeatured && 'shadow-sm ring-primary-200',
      )}
    >
      {/* Image */}
      {image?.url && (
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          <Image
            src={image.sizes?.card?.url ?? image.url}
            alt={image.alt ?? event.title}
            fill
            className="object-cover transition duration-500 hover:scale-105"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
          {isFeatured && (
            <div className="absolute top-3 left-3 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
              Featured
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 p-6">
        {/* Date badge */}
        {event.date && (
          <time
            dateTime={event.date}
            className="text-xs font-semibold tracking-widest text-primary-500 uppercase"
          >
            {formatDate(event.date)}
            {event.endDate && ` – ${formatDate(event.endDate)}`}
          </time>
        )}

        <h3 className="font-serif text-xl font-bold text-gray-900">{event.title}</h3>
      </div>
    </article>
  )
}
