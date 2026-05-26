'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'

export default function ChatButton() {
  const router = useRouter()
  const [showTooltip, setShowTooltip] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const visibleTimer = window.setTimeout(() => setIsVisible(true), 2000)
    const showTimer = window.setTimeout(() => setShowTooltip(true), 4000)
    const hideTimer = window.setTimeout(() => setShowTooltip(false), 8000)

    return () => {
      window.clearTimeout(visibleTimer)
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  const handleClick = async () => {
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (user) {
      router.push('/account/messages/new')
    } else {
      router.push('/login?redirect=/account/messages/new')
    }
  }

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
      }}
    >
      {showTooltip && (
        <div
          style={{
            background: '#1A1014',
            color: '#FBF5F0',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'var(--font-inter)',
            maxWidth: '200px',
            lineHeight: 1.5,
            position: 'relative',
            boxShadow: '0 4px 20px rgba(26,16,20,0.2)',
            animation: 'slideUpFade 0.4s ease',
          }}
        >
          Have a question about our diamonds? *
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              right: '22px',
              width: '12px',
              height: '12px',
              background: '#1A1014',
              transform: 'rotate(45deg)',
              borderRadius: '2px',
            }}
          />
        </div>
      )}

      <button
        onClick={handleClick}
        aria-label="Chat with us"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1A1014, #2A1E24)',
          border: '1.5px solid #C9A961',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(26,16,20,0.25), 0 0 0 0 rgba(201,169,97,0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          animation: 'chatPulse 3s ease-in-out infinite',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = 'scale(1.1)'
          event.currentTarget.style.boxShadow = '0 6px 28px rgba(26,16,20,0.3)'
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = 'scale(1)'
          event.currentTarget.style.boxShadow = '0 4px 20px rgba(26,16,20,0.25)'
        }}
      >
        <MessageCircle size={23} color="#C9A961" strokeWidth={1.5} />
      </button>
    </div>
  )
}
