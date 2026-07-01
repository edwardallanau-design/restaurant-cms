import config from '@payload-config'
import { getPayload } from 'payload'

async function seed() {
  const payload = await getPayload({ config })

  // Ensure pilot restaurant exists (created in migration; this is a guard)
  const pilotResult = await payload.find({
    collection: 'restaurants',
    where: { slug: { equals: 'pilot' } },
    limit: 1,
  })
  if (pilotResult.docs.length === 0) {
    throw new Error('Pilot restaurant not found. Run `npm run migrate` first.')
  }
  const pilot = pilotResult.docs[0]!

  // Create decoy restaurant if missing
  const decoyResult = await payload.find({
    collection: 'restaurants',
    where: { slug: { equals: 'decoy' } },
    limit: 1,
  })
  let decoy = decoyResult.docs[0]
  if (!decoy) {
    decoy = await payload.create({
      collection: 'restaurants',
      data: { name: 'Decoy Café', slug: 'decoy', active: true },
    })
    console.log('Created decoy restaurant:', decoy.id)
  }

  // Seed pilot site settings if missing
  const pilotSettings = await payload.find({
    collection: 'tenant-site-settings',
    where: { restaurant: { equals: pilot.id } },
    limit: 1,
  })
  if (pilotSettings.docs.length === 0) {
    await payload.create({
      collection: 'tenant-site-settings',
      data: {
        restaurant: pilot.id,
        restaurantName: 'Pilot Café',
        tagline: 'Fresh ingredients, inspired by tradition.',
        contact: { phone: '(555) 000-0001', email: 'hello@pilot.example' },
        hours: [
          { day: 'Monday–Friday', openTime: '11:00 AM', closeTime: '10:00 PM', closed: false },
          { day: 'Saturday–Sunday', openTime: '10:00 AM', closeTime: '11:00 PM', closed: false },
        ],
      },
    })
    console.log('Seeded pilot site settings')
  }

  // Seed pilot hero section if missing
  const pilotHero = await payload.find({
    collection: 'tenant-hero-sections',
    where: { restaurant: { equals: pilot.id } },
    limit: 1,
  })
  if (pilotHero.docs.length === 0) {
    // backgroundImage is required — skip if no media exists yet
    console.log('Skipped pilot hero section (no media — add via admin after seeding)')
  }

  // Seed pilot page content if missing
  const pilotContent = await payload.find({
    collection: 'tenant-page-content',
    where: { restaurant: { equals: pilot.id } },
    limit: 1,
  })
  if (pilotContent.docs.length === 0) {
    await payload.create({
      collection: 'tenant-page-content',
      data: {
        restaurant: pilot.id,
        home: { eyebrow: 'Our Selection', headerTitle: 'Featured Dishes' },
        menu: { eyebrow: 'What We Offer', headerTitle: 'Our Menu' },
        gallery: { eyebrow: 'A Visual Story', headerTitle: 'Gallery' },
        events: { eyebrow: "What's Coming Up", headerTitle: 'Events & Specials' },
        contact: { eyebrow: 'Find Us', headerTitle: 'Contact & Location' },
        about: {
          eyebrow: 'Who We Are',
          headerTitle: 'About Us',
          ctaHeading: 'Come Visit Us',
          ctaSubtext: "We'd love to welcome you.",
          ctaPrimaryText: 'View Our Menu',
          ctaSecondaryText: 'Contact Us',
        },
      },
    })
    console.log('Seeded pilot page content')
  }

  // Seed decoy site settings if missing (different from pilot — proves isolation)
  const decoySettings = await payload.find({
    collection: 'tenant-site-settings',
    where: { restaurant: { equals: decoy.id } },
    limit: 1,
  })
  if (decoySettings.docs.length === 0) {
    await payload.create({
      collection: 'tenant-site-settings',
      data: {
        restaurant: decoy.id,
        restaurantName: 'Decoy Café',
        tagline: 'Not the pilot — isolation test only.',
        contact: { phone: '(555) 000-0002', email: 'hello@decoy.example' },
      },
    })
    console.log('Seeded decoy site settings')
  }

  // Seed decoy page content if missing
  const decoyContent = await payload.find({
    collection: 'tenant-page-content',
    where: { restaurant: { equals: decoy.id } },
    limit: 1,
  })
  if (decoyContent.docs.length === 0) {
    await payload.create({
      collection: 'tenant-page-content',
      data: {
        restaurant: decoy.id,
        home: { eyebrow: 'Decoy Selection', headerTitle: 'Decoy Dishes' },
        menu: { eyebrow: 'Decoy Menu', headerTitle: 'Decoy Menu' },
      },
    })
    console.log('Seeded decoy page content')
  }

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
