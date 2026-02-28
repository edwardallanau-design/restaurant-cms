import { type ButtonHTMLAttributes, forwardRef } from 'react'
import Link, { type LinkProps } from 'next/link'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 shadow-sm',
  secondary:
    'bg-primary-100 text-primary-900 hover:bg-primary-200 focus-visible:ring-primary-500',
  outline:
    'border border-primary-600 text-primary-700 hover:bg-primary-50 focus-visible:ring-primary-500',
  ghost: 'text-primary-700 hover:bg-primary-50 focus-visible:ring-primary-500',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-button font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

// ── Button ─────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

// ── ButtonLink ─────────────────────────────────────────────────────────────

interface ButtonLinkProps extends Omit<LinkProps, 'className'> {
  variant?: Variant
  size?: Size
  className?: string
  children: React.ReactNode
}

function ButtonLink({ className = '', variant = 'primary', size = 'md', children, ...props }: ButtonLinkProps) {
  return (
    <Link
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  )
}

export { Button, ButtonLink }
