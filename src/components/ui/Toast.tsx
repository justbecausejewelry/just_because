'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'wishlist' | 'error' | 'info'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3000)
    return () => window.clearTimeout(timer)
  }, [onClose])

  const bgColors = {
    success: '#1A1014',
    wishlist: '#E8C4D0',
    error: '#A85C6A',
    info: '#FDF8F2',
  }

  const textColors = {
    success: '#FBF5F0',
    wishlist: '#6B2D44',
    error: '#FBF5F0',
    info: '#1A1014',
  }

  const icons = {
    success: '✓',
    wishlist: '♡',
    error: '✕',
    info: 'i',
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: bgColors[type],
        color: textColors[type],
        padding: '14px 20px',
        borderRadius: '2px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        fontFamily: 'var(--font-inter)',
        zIndex: 9999,
        boxShadow: '0 4px 20px rgba(26,16,20,0.15)',
        maxWidth: '320px',
        animation: 'slideUp 0.3s ease',
      }}
    >
      <span style={{ fontSize: '16px' }}>{icons[type]}</span>
      {message}
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: '16px',
          marginLeft: '8px',
          opacity: 0.7,
          padding: 0,
        }}
      >
        x
      </button>
    </div>
  )
}
