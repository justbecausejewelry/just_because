'use server'

import { returnReasonLabel } from '@/lib/returnEligibility'
import { resend, resendFromEmail } from '@/lib/email/resend'

type ReturnEmailType = 'requested' | 'approved' | 'rejected' | 'refunded'

type ReturnEmailInput = {
  customerEmail: string
  customerName: string
  orderNumber: string
  returnId: string
  reason: string
  authorizationNumber?: string
  rejectionReason?: string
  refundAmount?: number
  type: ReturnEmailType
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatCurrency(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

async function postEmail(payload: { to: string; subject: string; html: string }) {
  const result = await resend.emails.send({
    from: resendFromEmail,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  console.log('[resend] return email accepted:', {
    id: result.data?.id,
    to: payload.to,
    subject: payload.subject,
  })
}

export async function sendReturnRequestEmail({
  customerEmail,
  customerName,
  orderNumber,
  returnId,
  reason,
  authorizationNumber,
  rejectionReason,
  refundAmount,
  type,
}: ReturnEmailInput) {
  const teamEmail = process.env.NOTIFICATION_EMAIL || 'team@justbecausejewelry.com'
  const safeCustomerEmail = escapeHtml(customerEmail)
  const safeCustomerName = escapeHtml(customerName || customerEmail)
  const safeOrderNumber = escapeHtml(orderNumber)
  const safeReturnId = escapeHtml(returnId)
  const safeReason = escapeHtml(returnReasonLabel(reason))
  const safeAuthorizationNumber = escapeHtml(authorizationNumber || '')
  const safeRejectionReason = escapeHtml(rejectionReason || '')
  const safeRefundAmount = escapeHtml(formatCurrency(refundAmount))

  const subjects: Record<ReturnEmailType, string> = {
    requested: `New Return Request - Order ${orderNumber}`,
    approved: `Your Return Has Been Approved - Order ${orderNumber}`,
    rejected: `Update on Your Return Request - Order ${orderNumber}`,
    refunded: `Your Refund Has Been Processed - Order ${orderNumber}`,
  }

  if (type === 'requested') {
    await postEmail({
      to: teamEmail,
      subject: subjects.requested,
      html: `
        <h2>New Return Request</h2>
        <p><strong>Customer:</strong> ${safeCustomerName}</p>
        <p><strong>Email:</strong> ${safeCustomerEmail}</p>
        <p><strong>Order:</strong> ${safeOrderNumber}</p>
        <p><strong>Reason:</strong> ${safeReason}</p>
        <p><strong>Return ID:</strong> ${safeReturnId}</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/returns">Review in Admin Panel</a></p>
      `,
    })
  }

  const customerMessages: Record<ReturnEmailType, string> = {
    requested: `
      <h2>We received your return request</h2>
      <p>Hi ${safeCustomerName},</p>
      <p>We have received your return request for Order ${safeOrderNumber}.</p>
      <p>Our team will review your request within 1-2 business days and send return instructions.</p>
      <p><strong>Return Reference:</strong> ${safeReturnId}</p>
      <p>Questions? Email us at team@justbecausejewelry.com.</p>
    `,
    approved: `
      <h2>Your return has been approved</h2>
      <p>Hi ${safeCustomerName},</p>
      <p>Your return request for Order ${safeOrderNumber} has been approved.</p>
      <p><strong>Authorization Number:</strong> ${safeAuthorizationNumber}</p>
      <p>Please include this number with your return shipment and ship your item within 7 days.</p>
    `,
    rejected: `
      <h2>Update on your return request</h2>
      <p>Hi ${safeCustomerName},</p>
      <p>We are unable to process your return for Order ${safeOrderNumber} at this time.</p>
      ${safeRejectionReason ? `<p><strong>Reason:</strong> ${safeRejectionReason}</p>` : ''}
      <p>Please contact us at team@justbecausejewelry.com if you have any questions.</p>
    `,
    refunded: `
      <h2>Your refund has been processed</h2>
      <p>Hi ${safeCustomerName},</p>
      <p>Your refund for Order ${safeOrderNumber} has been processed.</p>
      ${safeRefundAmount ? `<p><strong>Refund amount:</strong> ${safeRefundAmount}</p>` : ''}
      <p>Please allow 5-10 business days for the refund to appear on your statement.</p>
    `,
  }

  await postEmail({
    to: customerEmail,
    subject: subjects[type],
    html: customerMessages[type],
  })
}
