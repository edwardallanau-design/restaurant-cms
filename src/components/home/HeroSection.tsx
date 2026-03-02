import Image from 'next/image'
import type { HeroSection as HeroSectionType, Media } from '@/payload-types'
import { ButtonLink } from '@/components/custom/Button'
import { Container } from '@/components/custom/Container'

type HeroSectionProps = Pick<
  HeroSectionType,
  'heading' | 'subheading' | 'backgroundImage' | 'backgroundVideo' | 'primaryCta' | 'secondaryCta' | 'overlay'
>

export function HeroSection({
  heading,
  subheading,
  backgroundImage,
  backgroundVideo,
  primaryCta,
  secondaryCta,
  overlay,
}: HeroSectionProps) {
  const bgImage = typeof backgroundImage === 'object' ? (backgroundImage as Media) : null
  const overlayOpacity = (overlay?.opacity ?? 50) / 100

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Image */}
      {bgImage?.url ? (
        <Image
          src={bgImage.sizes?.hero?.url ?? bgImage.url}
          alt={bgImage.alt ?? 'Restaurant hero image'}
          fill
          className="object-cover"
          priority
          quality={90}
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-primary-900" />
      )}

      {/* Background Video (optional) */}
      {backgroundVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
        aria-hidden="true"
      />

      {/* Content */}
      <Container className="relative z-10 text-center">
        <div className="mx-auto max-w-4xl space-y-6">
          {heading && (
            <h1 className="font-serif text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              {heading}
            </h1>
          )}
          {subheading && (
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
              {subheading}
            </p>
          )}

          {/* CTAs */}
          {(primaryCta?.text || secondaryCta?.text) && (
            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
              {primaryCta?.text && primaryCta.link && (
                <ButtonLink href={primaryCta.link} size="lg">
                  {primaryCta.text}
                </ButtonLink>
              )}
              {secondaryCta?.text && secondaryCta.link && (
                <ButtonLink href={secondaryCta.link} variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  {secondaryCta.text}
                </ButtonLink>
              )}
            </div>
          )}
        </div>
      </Container>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/60">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </section>
  )
}
