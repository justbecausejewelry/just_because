import { Resend } from 'resend'

function cleanEnvSecret(value?: string) {
  return value?.replace(/^[\s\u00a0\ufeff\u00c2]+/, '').trim()
}

const resendApiKey = cleanEnvSecret(process.env.RESEND_API_KEY)

if (!resendApiKey) {
  throw new Error('RESEND_API_KEY missing')
}

export const resend = new Resend(resendApiKey)
export const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Just Because <admin@justbecausejewelry.com>'
export const adminNotificationEmail = 'admin@justbecausejewelry.com'
