import React from 'react'

// Payload admin does not use the public site layout (no Header/Footer)
export default function PayloadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
