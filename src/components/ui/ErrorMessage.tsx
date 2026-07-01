import Link from 'next/link'

type ErrorMessageProps = {
  message: string
  action?: {
    label: string
    href: string
  }
}

export default function ErrorMessage({ message, action }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      style={{
        background: '#FCF0F4',
        border: '0.5px solid #E8C4D0',
        borderRadius: '4px',
        padding: '14px 16px',
        marginBottom: '14px',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '13px',
          color: '#1A1014',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {message}
      </p>
      {action ? (
        <Link
          href={action.href}
          style={{
            display: 'inline-block',
            marginTop: '8px',
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: '#C9A961',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
          }}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
