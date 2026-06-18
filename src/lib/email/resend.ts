import { Resend } from 'resend'

function cleanEnvSecret(value?: string) {
  return value?.replace(/^[\s\u00a0\ufeff\u00c2]+/, '').trim()
}

let resendClient: Resend | null = null

export function getResendClient(): Resend {
  if (resendClient) return resendClient

  const resendApiKey = cleanEnvSecret(process.env.RESEND_API_KEY)

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  resendClient = new Resend(resendApiKey)
  return resendClient
}

export const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Just Because <admin@justbecausejewelry.com>'
export const adminNotificationEmail = 'admin@justbecausejewelry.com'
