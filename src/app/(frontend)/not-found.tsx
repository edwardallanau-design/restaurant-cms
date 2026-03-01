import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-serif text-6xl font-bold text-primary-900">404</h1>
      <p className="text-xl text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-4 rounded-button bg-primary-600 px-6 py-3 font-medium text-white transition hover:bg-primary-700"
      >
        Back to Home
      </Link>
    </div>
  )
}
