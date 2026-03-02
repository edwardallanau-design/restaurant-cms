'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { GalleryImage, Media } from '@/payload-types'

interface GalleryGridProps {
  images: GalleryImage[]
}

export function GalleryGrid({ images }: GalleryGridProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  function openLightbox(idx: number) {
    setLightbox(idx)
  }

  function closeLightbox() {
    setLightbox(null)
  }

  function prev() {
    setLightbox((i) => (i === null ? null : (i - 1 + images.length) % images.length))
  }

  function next() {
    setLightbox((i) => (i === null ? null : (i + 1) % images.length))
  }

  return (
    <>
      {/* Masonry-ish grid */}
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
        {images.map((galleryItem, idx) => {
          const image = typeof galleryItem.image === 'object' ? (galleryItem.image as Media) : null
          return (
            <button
              key={galleryItem.id}
              className="group mb-4 w-full break-inside-avoid overflow-hidden rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={() => openLightbox(idx)}
              aria-label={`View photo ${idx + 1}${galleryItem.caption ? `: ${galleryItem.caption}` : ''}`}
            >
              <div className="relative overflow-hidden rounded-card bg-gray-100">
                {image?.url ? (
                  <Image
                    src={image.sizes?.card?.url ?? image.url}
                    alt={image.alt ?? galleryItem.caption ?? `Gallery photo ${idx + 1}`}
                    width={600}
                    height={400}
                    className="w-full transition duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  />
                ) : (
                  <div className="aspect-square bg-primary-50" />
                )}

                {/* Caption overlay */}
                {galleryItem.caption && (
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="px-3 pb-3 text-xs font-medium text-white">
                      {galleryItem.caption}
                    </p>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          {/* Previous */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/25"
            onClick={(e) => { e.stopPropagation(); prev() }}
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Image */}
          <div
            className="relative max-h-[85vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const galleryItem = images[lightbox]
              if (!galleryItem) return null
              const image = typeof galleryItem.image === 'object' ? (galleryItem.image as Media) : null
              return image?.url ? (
                <>
                  <Image
                    src={image.url}
                    alt={image.alt ?? galleryItem.caption ?? 'Gallery image'}
                    width={1200}
                    height={800}
                    className="max-h-[85vh] rounded-lg object-contain"
                    priority
                  />
                  {galleryItem.caption && (
                    <p className="mt-2 text-center text-sm text-white/70">{galleryItem.caption}</p>
                  )}
                </>
              ) : null
            })()}
          </div>

          {/* Next */}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/25"
            onClick={(e) => { e.stopPropagation(); next() }}
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Close */}
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/25"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/50">
            {lightbox + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  )
}
