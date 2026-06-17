import { getCarrierLabel } from '@/lib/tracking'
import { resend, resendFromEmail } from '@/lib/email/resend'

type EmailItem = {
  productTitle?: string | null
  title?: string | null
  name?: string | null
  quantity?: number | null
  unitPrice?: number | null
  totalPrice?: number | null
  price?: number | null
}

export type ShippingEmailProps = {
  customerName: string
  orderNumber: string
  trackingNumber: string
  carrier: string
  trackingUrl: string
  estimatedDelivery?: string | null
  items?: EmailItem[]
}

export type DeliveryEmailProps = {
  customerName: string
  orderNumber: string
  items?: EmailItem[]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function itemName(item: EmailItem) {
  return item.productTitle || item.title || item.name || 'Just Because piece'
}

function itemPrice(item: EmailItem) {
  return item.totalPrice ?? (item.unitPrice || item.price || 0) * (item.quantity || 1)
}

function renderItems(items: EmailItem[] | undefined) {
  if (!items?.length) {
    return '<p style="color: #B8A090; font-size: 13px;">Your order details are available in your account.</p>'
  }

  return items.map((item) => `
    <div style="display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid #EDD9AF;">
      <span style="color: #1A1014;">${escapeHtml(itemName(item))}</span>
      <span style="color: #1A1014; font-weight: 500;">${escapeHtml(formatCurrency(itemPrice(item)))}</span>
    </div>
  `).join('')
}

function emailShell(content: string) {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background: #FBF5F0; padding: 40px 0; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #FDF8F2; padding: 40px; border: 1px solid #EDD9AF;">
          <h1 style="font-family: Georgia, serif; color: #C9A961; font-size: 28px; font-weight: 400; margin: 0 0 4px;">
            Just Because
          </h1>
          ${content}
          <p style="color: #B8A090; font-size: 13px; margin-top: 32px;">
            Questions? Email us at
            <a href="mailto:support@justbecausejewelry.com" style="color: #C9A961;">support@justbecausejewelry.com</a>
          </p>
          <p style="color: #B8A090; font-size: 12px; margin-top: 16px;">
            Copyright 2026 Just Because Jewelry. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `
}

export function shippingEmailHtml({
  customerName,
  orderNumber,
  trackingNumber,
  carrier,
  trackingUrl,
  estimatedDelivery,
  items,
}: ShippingEmailProps): string {
  const safeCustomerName = escapeHtml(customerName || 'there')
  const safeOrderNumber = escapeHtml(orderNumber)
  const safeTrackingNumber = escapeHtml(trackingNumber)
  const carrierLabel = escapeHtml(getCarrierLabel(carrier))
  const safeTrackingUrl = escapeHtml(trackingUrl)
  const safeEstimatedDelivery = estimatedDelivery ? escapeHtml(estimatedDelivery) : ''

  return emailShell(`
    <h2 style="color: #1A1014; font-family: Georgia, serif; font-size: 24px; font-weight: 400; margin: 32px 0 12px;">
      Your order is on its way
    </h2>
    <p style="color: #B8A090; font-size: 16px; line-height: 1.6; margin: 0;">
      Hi ${safeCustomerName}, your order has shipped and is headed your way.
    </p>
    <div style="background: #FBF5F0; border: 1px solid #EDD9AF; padding: 24px; margin: 24px 0;">
      <p style="color: #C9A961; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 8px;">
        Tracking Information
      </p>
      <p style="color: #1A1014; font-size: 18px; font-weight: 500; margin: 0 0 4px;">
        ${carrierLabel}
      </p>
      <p style="color: #B8A090; font-size: 16px; margin: 0 0 16px;">
        ${safeTrackingNumber}
      </p>
      ${safeEstimatedDelivery ? `
        <p style="color: #B8A090; font-size: 14px;">
          Estimated delivery: <strong style="color: #1A1014;">${safeEstimatedDelivery}</strong>
        </p>
      ` : ''}
      ${safeTrackingUrl !== '#' ? `
        <a href="${safeTrackingUrl}" style="display: inline-block; background: #1A1014; color: #FBF5F0; padding: 12px 24px; text-decoration: none; font-size: 13px; letter-spacing: 0.1em; margin-top: 16px;">
          Track Your Package
        </a>
      ` : ''}
    </div>
    <p style="color: #C9A961; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 12px;">
      Order ${safeOrderNumber}
    </p>
    ${renderItems(items)}
  `)
}

export function deliveryEmailHtml({ customerName, orderNumber, items }: DeliveryEmailProps): string {
  const safeCustomerName = escapeHtml(customerName || 'there')
  const safeOrderNumber = escapeHtml(orderNumber)

  return emailShell(`
    <h2 style="color: #1A1014; font-family: Georgia, serif; font-size: 24px; font-weight: 400; margin: 32px 0 12px;">
      Your order has been delivered
    </h2>
    <p style="color: #B8A090; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Hi ${safeCustomerName}, your Just Because order ${safeOrderNumber} has been marked delivered.
    </p>
    <p style="color: #C9A961; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 12px;">
      Order ${safeOrderNumber}
    </p>
    ${renderItems(items)}
  `)
}

async function sendTransactionalEmail(payload: { to: string; subject: string; html: string }) {
  const result = await resend.emails.send({
    from: resendFromEmail,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  console.log('[resend] shipping email accepted:', {
    id: result.data?.id,
    to: payload.to,
    subject: payload.subject,
  })
}

export async function sendShippingEmail(props: ShippingEmailProps & { to: string; siteUrl?: string }) {
  await sendTransactionalEmail({
    to: props.to,
    subject: `Your Just Because order ${props.orderNumber} has shipped`,
    html: shippingEmailHtml(props),
  })
}

export async function sendDeliveryEmail(props: DeliveryEmailProps & { to: string; siteUrl?: string }) {
  await sendTransactionalEmail({
    to: props.to,
    subject: `Your Just Because order ${props.orderNumber} has been delivered`,
    html: deliveryEmailHtml(props),
  })
}
