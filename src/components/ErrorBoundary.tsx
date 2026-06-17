'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled client error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ alignItems: 'center', background: '#FBF5F0', color: '#1A1014', display: 'flex', minHeight: '70vh', padding: '48px 24px' }}>
          <section style={{ margin: '0 auto', maxWidth: '560px', textAlign: 'center' }}>
            <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.3em', margin: '0 0 14px', textTransform: 'uppercase' }}>
              Just Because
            </p>
            <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '40px', fontWeight: 400, margin: '0 0 14px' }}>
              Something went wrong.
            </h1>
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              Please refresh the page or return to the storefront.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              style={{ background: '#1A1014', border: '0.5px solid #1A1014', color: '#FBF5F0', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.16em', marginTop: '28px', padding: '13px 22px', textTransform: 'uppercase' }}
            >
              Try Again
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
