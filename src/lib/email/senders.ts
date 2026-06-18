export const ADMIN_INBOX = 'admin@justbecausejewelry.com'
export const SUPPORT_INBOX = process.env.SUPPORT_EMAIL || ADMIN_INBOX

export const EMAIL_SENDERS = {
  orders: 'Just Because <orders@justbecausejewelry.com>',
  support: 'Just Because Support <support@justbecausejewelry.com>',
  noreply: 'Just Because <noreply@justbecausejewelry.com>',
  admin: 'Just Because Admin <admin@justbecausejewelry.com>',
} as const
