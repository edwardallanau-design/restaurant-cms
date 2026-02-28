import type { SerializedEditorState, SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'

interface RichTextProps {
  content: SerializedEditorState | null | undefined
  className?: string
}

/**
 * Renders Payload Lexical rich text JSON as HTML.
 * Handles the most common node types used in restaurant content.
 */
export function RichText({ content, className = '' }: RichTextProps) {
  if (!content?.root?.children) return null

  return (
    <div className={`prose prose-stone max-w-none ${className}`}>
      {content.root.children.map((node, i) => (
        <RichTextNode key={i} node={node} />
      ))}
    </div>
  )
}

function RichTextNode({ node }: { node: SerializedLexicalNode }) {
  const n = node as SerializedLexicalNode & {
    type: string
    tag?: string
    children?: SerializedLexicalNode[]
    text?: string
    format?: number
    version?: number
    listType?: string
    url?: string
    newTab?: boolean
  }

  switch (n.type) {
    case 'paragraph':
      return (
        <p>
          {n.children?.map((child, i) => (
            <RichTextNode key={i} node={child} />
          ))}
        </p>
      )

    case 'heading': {
      const Tag = (n.tag ?? 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return (
        <Tag>
          {n.children?.map((child, i) => (
            <RichTextNode key={i} node={child} />
          ))}
        </Tag>
      )
    }

    case 'text': {
      let el: React.ReactNode = n.text ?? ''
      // Lexical format flags: 1=bold, 2=italic, 4=strikethrough, 8=underline, 16=code, 32=subscript, 64=superscript
      const fmt = n.format ?? 0
      if (fmt & 16) el = <code>{el}</code>
      if (fmt & 4) el = <s>{el}</s>
      if (fmt & 8) el = <u>{el}</u>
      if (fmt & 1) el = <strong>{el}</strong>
      if (fmt & 2) el = <em>{el}</em>
      if (fmt & 32) el = <sub>{el}</sub>
      if (fmt & 64) el = <sup>{el}</sup>
      return <>{el}</>
    }

    case 'link':
      return (
        <a
          href={n.url ?? '#'}
          target={n.newTab ? '_blank' : undefined}
          rel={n.newTab ? 'noopener noreferrer' : undefined}
        >
          {n.children?.map((child, i) => (
            <RichTextNode key={i} node={child} />
          ))}
        </a>
      )

    case 'list':
      return n.listType === 'number' ? (
        <ol>
          {n.children?.map((child, i) => (
            <RichTextNode key={i} node={child} />
          ))}
        </ol>
      ) : (
        <ul>
          {n.children?.map((child, i) => (
            <RichTextNode key={i} node={child} />
          ))}
        </ul>
      )

    case 'listitem':
      return (
        <li>
          {n.children?.map((child, i) => (
            <RichTextNode key={i} node={child} />
          ))}
        </li>
      )

    case 'quote':
      return (
        <blockquote>
          {n.children?.map((child, i) => (
            <RichTextNode key={i} node={child} />
          ))}
        </blockquote>
      )

    case 'linebreak':
      return <br />

    default:
      return null
  }
}
