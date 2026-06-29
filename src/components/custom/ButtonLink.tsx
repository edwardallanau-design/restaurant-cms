import React from 'react'
import Link, { type LinkProps } from 'next/link'
import { Button } from '@/components/ui/button'

type ButtonLinkProps = Omit<React.ComponentProps<typeof Button>, 'asChild'> &
  Pick<LinkProps, 'href'> & { children: React.ReactNode }

export function ButtonLink({ href, children, ...props }: ButtonLinkProps) {
  return (
    <Button asChild {...props}>
      <Link href={href}>{children}</Link>
    </Button>
  )
}
