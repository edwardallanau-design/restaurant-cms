import { type HTMLAttributes, forwardRef } from 'react'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 'default' = max-w-7xl (1280px) | 'narrow' = max-w-3xl | 'wide' = max-w-screen-2xl
   */
  size?: 'narrow' | 'default' | 'wide'
}

/**
 * Centered, horizontally-padded layout wrapper.
 */
const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className = '', size = 'default', children, ...props }, ref) => {
    const sizeClass =
      size === 'narrow'
        ? 'max-w-3xl'
        : size === 'wide'
          ? 'max-w-screen-2xl'
          : 'max-w-7xl'

    return (
      <div
        ref={ref}
        className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${sizeClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  },
)
Container.displayName = 'Container'

export { Container }
