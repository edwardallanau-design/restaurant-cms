'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MobileNav } from './MobileNav'
import type { SiteSettings as SiteSettingsType } from '@/payload-types'
import { Container } from '@/components/ui/Container'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/events', label: 'Events' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

interface HeaderProps {
  settings: Pick<SiteSettingsType, 'restaurantName' | 'logo'>
}

export function Header({ settings }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const logo = typeof settings.logo === 'object' ? settings.logo : null

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 shadow-sm backdrop-blur-sm' : 'bg-transparent'
        }`}
      >
        <Container>
          <nav
            className="flex h-16 items-center justify-between sm:h-20"
            aria-label="Main navigation"
          >
            {/* Logo / Name */}
            <Link href="/" className="flex items-center gap-2">
              {logo?.url ? (
                <Image
                  src={logo.url}
                  alt={settings.restaurantName ?? 'Restaurant logo'}
                  width={120}
                  height={40}
                  className="h-10 w-auto object-contain"
                  priority
                />
              ) : (
                <span
                  className={`font-serif text-xl font-bold sm:text-2xl ${
                    scrolled ? 'text-primary-900' : 'text-white'
                  }`}
                >
                  {settings.restaurantName ?? 'Restaurant'}
                </span>
              )}
            </Link>

            {/* Desktop nav */}
            <ul className="hidden items-center gap-8 md:flex">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`text-sm font-medium transition-colors hover:text-primary-500 ${
                      scrolled ? 'text-gray-700' : 'text-white/90'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Mobile hamburger */}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-md md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <HamburgerIcon
                className={`h-6 w-6 ${scrolled ? 'text-gray-900' : 'text-white'}`}
              />
            </button>
          </nav>
        </Container>
      </header>

      <MobileNav
        links={NAV_LINKS}
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        restaurantName={settings.restaurantName ?? 'Restaurant'}
      />
    </>
  )
}

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}
