import Image from 'next/image'
import type { Media, MenuItem } from '@/payload-types'
import { cn } from '@/lib/utils'

export const DIETARY_COLORS: Record<string, string> = {
  vegetarian: 'bg-green-100 text-green-800',
  vegan: 'bg-emerald-100 text-emerald-800',
  'gluten-free': 'bg-yellow-100 text-yellow-800',
  spicy: 'bg-red-100 text-red-800',
  'contains-nuts': 'bg-orange-100 text-orange-800',
  'dairy-free': 'bg-blue-100 text-blue-800',
  'chefs-special': 'bg-primary-100 text-primary-800',
}

export function MenuItemCard({ item }: { item: MenuItem }) {
  const image = typeof item.image === 'object' ? (item.image as Media) : null

  return (
    <article className="flex gap-4 rounded-card p-4 ring-1 ring-gray-100 transition hover:shadow-sm">
      {/* Thumbnail */}
      {image?.url && (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md">
          <Image
            src={image.sizes?.thumbnail?.url ?? image.url}
            alt={image.alt ?? item.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
      )}
      <div className="flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900">{item.name}</h3>
          <span className="shrink-0 font-semibold text-primary-600">
            ${Number(item.price).toFixed(2)}
          </span>
        </div>
        {/* Dietary flags */}
        {item.dietaryFlags && item.dietaryFlags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.dietaryFlags.map((flag) => (
              <span
                key={flag}
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  DIETARY_COLORS[flag] ?? 'bg-gray-100 text-gray-600',
                )}
              >
                {flag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
