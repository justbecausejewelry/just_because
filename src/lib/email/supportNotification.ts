import { getResendClient } from '@/lib/email/resend'
import { EMAIL_SENDERS, SUPPORT_INBOX } from '@/lib/email/senders'

type SupportNotificationInput = {
  conversationId: string
  customerName: string
  customerEmail: string
  subject: string
  message: string
  productTitle?: string | null
  productSlug?: string | null
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function sendSupportNotificationEmail(input: SupportNotificationInput) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://justbecausejewelry.com'
  const adminUrl = `${siteUrl}/admin/support/${encodeURIComponent(input.conversationId)}`
  const productUrl = input.productSlug ? `${siteUrl}/products/${encodeURIComponent(input.productSlug)}` : null
  const safeCustomerName = escapeHtml(input.customerName || input.customerEmail)
  const safeCustomerEmail = escapeHtml(input.customerEmail)
  const safeSubject = escapeHtml(input.subject)
  const safeMessage = escapeHtml(input.message)
  const safeProductTitle = input.productTitle ? escapeHtml(input.productTitle) : ''

  console.log('[email] sending support notification to:', SUPPORT_INBOX)

  const { data, error } = await getResendClient().emails.send({
    from: EMAIL_SENDERS.support,
    to: SUPPORT_INBOX,
    replyTo: input.customerEmail,
    subject: `New support message: ${input.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #FBF5F0; padding: 28px;">
        <div style="max-width: 620px; margin: 0 auto; background: #FDF8F2; border: 1px solid #EDD9AF; padding: 28px;">
          <p style="color: #C9A961; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 12px;">Support Message</p>
          <h1 style="color: #1A1014; font-family: Georgia, serif; font-weight: 400; margin: 0 0 18px;">${safeSubject}</h1>
          <p style="color: #1A1014; margin: 0 0 8px;"><strong>Customer:</strong> ${safeCustomerName}</p>
          <p style="color: #1A1014; margin: 0 0 18px;"><strong>Email:</strong> ${safeCustomerEmail}</p>
          ${safeProductTitle ? `<p style="color: #1A1014; margin: 0 0 18px;"><strong>Product:</strong> ${productUrl ? `<a href="${productUrl}" style="color:#C9A961;">${safeProductTitle}</a>` : safeProductTitle}</p>` : ''}
          <div style="background: #FBF5F0; border: 1px solid #EDD9AF; color: #1A1014; line-height: 1.6; padding: 18px; white-space: pre-wrap;">${safeMessage}</div>
          <p style="margin: 22px 0 0;">
            <a href="${adminUrl}" style="background:#1A1014;color:#FBF5F0;display:inline-block;padding:12px 18px;text-decoration:none;">Open in admin</a>
          </p>
        </div>
      </div>
    `,
    text: [
      `New support message: ${input.subject}`,
      `Customer: ${input.customerName} (${input.customerEmail})`,
      input.productTitle ? `Product: ${input.productTitle}` : '',
      '',
      input.message,
      '',
      `Open in admin: ${adminUrl}`,
    ].filter(Boolean).join('\n'),
  })

  if (error) {
    console.error('[email] support email FAILED:', error)
    throw new Error(error.message || 'Support notification failed')
  }

  console.log('[email] support email sent, id:', data?.id || 'unknown')
}
