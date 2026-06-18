'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Copy, Mail, MessageSquare, X } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaPinterestP, FaWhatsapp } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'

type ShareModalProps = {
  open: boolean
  onClose: () => void
  title: string
  imageUrl?: string | null
}

type ShareOption = {
  label: string
  icon: ReactNode
  href?: string
  onClick?: () => void
  mobileOnly?: boolean
}

export default function ShareModal({ open, onClose, title, imageUrl }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    if (open) {
      setCurrentUrl(window.location.href)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  const copyLink = async () => {
    if (!currentUrl) return

    await navigator.clipboard.writeText(currentUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const shareOptions = useMemo<ShareOption[]>(() => {
    const encodedUrl = encodeURIComponent(currentUrl)
    const encodedTitle = encodeURIComponent(title)
    const encodedText = encodeURIComponent(`Check out this beautiful piece from Just Because: ${title}`)
    const encodedImage = encodeURIComponent(imageUrl || '')

    return [
      {
        label: copied ? 'Copied' : 'Copy',
        icon: <Copy size={19} strokeWidth={1.45} />,
        onClick: copyLink,
      },
      {
        label: 'WhatsApp',
        icon: <FaWhatsapp size={19} />,
        href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      },
      {
        label: 'Instagram',
        icon: <FaInstagram size={19} />,
        onClick: copyLink,
      },
      {
        label: 'Facebook',
        icon: <FaFacebookF size={18} />,
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      },
      {
        label: 'X',
        icon: <FaXTwitter size={18} />,
        href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      },
      {
        label: 'Pinterest',
        icon: <FaPinterestP size={19} />,
        href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}&media=${encodedImage}`,
      },
      {
        label: 'Email',
        icon: <Mail size={19} strokeWidth={1.45} />,
        href: `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`,
      },
      {
        label: 'SMS',
        icon: <MessageSquare size={19} strokeWidth={1.45} />,
        href: `sms:?&body=${encodedText}%20${encodedUrl}`,
        mobileOnly: true,
      },
    ]
  }, [copied, currentUrl, imageUrl, title])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          aria-modal="true"
          role="dialog"
          aria-label="Share this product"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            alignItems: 'center',
            background: 'rgba(26,16,20,0.58)',
            display: 'flex',
            inset: 0,
            justifyContent: 'center',
            padding: '20px',
            position: 'fixed',
            zIndex: 800,
          }}
        >
          <button
            type="button"
            aria-label="Close share menu"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              inset: 0,
              padding: 0,
              position: 'absolute',
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            style={{
              background: '#FBF5F0',
              border: '0.5px solid #EDD9AF',
              boxShadow: '0 24px 70px rgba(26,16,20,0.2)',
              maxWidth: '430px',
              padding: '26px',
              position: 'relative',
              width: '100%',
            }}
          >
            <div style={{ alignItems: 'flex-start', display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', margin: '0 0 8px', textTransform: 'uppercase' }}>
                  Share Piece
                </p>
                <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '26px', fontWeight: 400, lineHeight: 1.15, margin: 0 }}>
                  {title}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                style={{
                  alignItems: 'center',
                  background: '#FDF8F2',
                  border: '0.5px solid #EDD9AF',
                  borderRadius: '50%',
                  color: '#1A1014',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  height: '34px',
                  justifyContent: 'center',
                  padding: 0,
                  width: '34px',
                }}
              >
                <X size={16} strokeWidth={1.45} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginTop: '24px' }}>
              {shareOptions.map((option) => {
                const content = (
                  <>
                    <span
                      style={{
                        alignItems: 'center',
                        background: '#FDF8F2',
                        border: '0.5px solid #EDD9AF',
                        borderRadius: '50%',
                        color: '#1A1014',
                        display: 'inline-flex',
                        height: '52px',
                        justifyContent: 'center',
                        transition: 'border-color 0.25s ease, color 0.25s ease, transform 0.25s ease',
                        width: '52px',
                      }}
                    >
                      {option.icon}
                    </span>
                    <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.08em', marginTop: '8px', textTransform: 'uppercase' }}>
                      {option.label}
                    </span>
                  </>
                )
                const sharedStyle = {
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  padding: 0,
                  textDecoration: 'none',
                }

                if (option.href) {
                  return (
                    <a
                      key={option.label}
                      href={option.href}
                      target={option.href.startsWith('http') ? '_blank' : undefined}
                      rel={option.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className={option.mobileOnly ? 'share-option share-option-mobile' : 'share-option'}
                      style={sharedStyle}
                    >
                      {content}
                    </a>
                  )
                }

                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={option.onClick}
                    className={option.mobileOnly ? 'share-option share-option-mobile' : 'share-option'}
                    style={sharedStyle}
                  >
                    {content}
                  </button>
                )
              })}
            </div>

            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.6, margin: '22px 0 0' }}>
              Instagram opens best from your app. We copied the link so you can paste it into a story or message.
            </p>

            <style jsx>{`
              .share-option:hover span:first-child {
                border-color: #C9A961 !important;
                color: #C9A961 !important;
                transform: translateY(-2px);
              }

              .share-option-mobile {
                display: none !important;
              }

              @media (max-width: 768px) {
                .share-option-mobile {
                  display: flex !important;
                }
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
