import { type HTMLAttributes, forwardRef } from 'react'

interface SectionProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article' | 'aside'
  /**
   * 'default' applies section-padding (5rem top/bottom).
   * 'none' removes all padding (for hero / full-bleed sections).
   * 'sm' / 'lg' for tighter or looser variants.
   */
  padding?: 'none' | 'sm' | 'default' | 'lg'
}

const paddingMap: Record<NonNullable<SectionProps['padding']>, string> = {
  none: '',
  sm: 'py-10',
  default: 'py-20',
  lg: 'py-28',
}

/**
 * Semantic <section> wrapper with consistent vertical spacing.
 */
const Section = forwardRef<HTMLElement, SectionProps>(
  ({ as: Tag = 'section', className = '', padding = 'default', children, ...props }, ref) => {
    return (
      // @ts-expect-error – `ref` typing for polymorphic component
      <Tag ref={ref} className={`${paddingMap[padding]} ${className}`} {...props}>
        {children}
      </Tag>
    )
  },
)
Section.displayName = 'Section'

export { Section }
