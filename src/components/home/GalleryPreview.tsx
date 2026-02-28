import Image from 'next/image'
import type { GalleryImage, Media } from '@/payload-types'
import { Container } from '@/components/custom/Container'
import { Section } from '@/components/custom/Section'
import { ButtonLink } from '@/components/custom/Button'

interface GalleryPreviewProps {
  images: GalleryImage[]
}

export function GalleryPreview({ images }: GalleryPreviewProps) {
  if (!images.length) return null

  // Up to 6 images in a masonry-ish grid
  const displayImages = images.slice(0, 6)

  return (
    <Section className="bg-surface">
      <Container>
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-500">
            Our Atmosphere
          </p>
          <h2 className="font-serif text-3xl font-bold text-gray-900 sm:text-4xl">Gallery</h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
          {displayImages.map((galleryItem, idx) => {
            const image = typeof galleryItem.image === 'object' ? (galleryItem.image as Media) : null
            // First image is larger
            const isLarge = idx === 0

            return (
              <div
                key={galleryItem.id}
                className={`group relative overflow-hidden rounded-card bg-gray-100 ${
                  isLarge ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto sm:h-full' : 'aspect-square'
                }`}
              >
                {image?.url ? (
                  <Image
                    src={image.url}
                    alt={image.alt ?? galleryItem.caption ?? 'Gallery image'}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(min-width: 768px) 33vw, 50vw"
                  />
                ) : (
                  <div className="h-full bg-primary-50" />
                )}

                {/* Caption on hover */}
                {galleryItem.caption && (
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="px-4 pb-4 text-sm font-medium text-white">
                      {galleryItem.caption}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <ButtonLink href="/gallery" variant="outline">
            See All Photos
          </ButtonLink>
        </div>
      </Container>
    </Section>
  )
}
