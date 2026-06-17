import { getMetalLabel } from '@/config/productOptions'
import { resend, resendFromEmail } from '@/lib/email/resend'

const BRAND = {
  pearl: '#FBF5F0',
  ivory: '#FDF8F2',
  petal: '#FCF0F4',
  gold: '#C9A961',
  goldTint: '#EDD9AF',
  noir: '#1A1014',
  taupe: '#B8A090',
}

const DEFAULT_FROM = 'Just Because <admin@justbecausejewelry.com>'
const ADMIN_EMAIL = 'admin@justbecausejewelry.com'
const SITE_URL = 'https://justbecausejewelry.com'

export type OrderConfirmationAddress = {
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
}

export type OrderConfirmationOrder = {
  id: string
  orderNumber?: string | null
  order_number?: string | null
  createdAt?: string | Date | null
  created_at?: string | Date | null
  estimatedDelivery?: string | Date | null
  subtotal?: number | null
  discount?: number | null
  discountAmount?: number | null
  shipping?: number | null
  shippingAmount?: number | null
  shippingCost?: number | null
  taxAmount?: number | null
  total?: number | null
  paymentMethod?: string | null
  paymentStatus?: string | null
  shippingAddress?: OrderConfirmationAddress | null
}

export type OrderConfirmationCustomer = {
  fullName: string
  email: string
  firstName?: string | null
}

export type OrderConfirmationItem = {
  title?: string | null
  productTitle?: string | null
  name?: string | null
  variants?: Record<string, string | number | null | undefined> | null
  selectedMetal?: string | null
  selectedCarat?: number | null
  selectedShape?: string | null
  selectedColor?: string | null
  selectedClarity?: string | null
  ringSize?: string | null
  engraving?: string | null
  quantity: number
  price_at_add?: number | null
  unitPrice?: number | null
  totalPrice?: number | null
  image_url?: string | null
  productImage?: string | null
}

export type SendOrderConfirmationEmailInput = {
  order: OrderConfirmationOrder
  customer: OrderConfirmationCustomer
  items: OrderConfirmationItem[]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function cleanEnvSecret(value?: string) {
  return value?.replace(/^[\s\u00a0\ufeff\u00c2]+/, '').trim()
}

function normalizeOrderNumber(order: OrderConfirmationOrder) {
  const value = order.orderNumber || order.order_number || order.id
  return value.startsWith('JB-') ? value : `JB-${value}`
}

function formatCurrency(value?: number | null) {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(numeric)
}

function formatDate(value?: string | Date | null) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return 'Today'

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function customerFirstName(customer: OrderConfirmationCustomer) {
  const first = customer.firstName?.trim()
  if (first) return first
  return customer.fullName.trim().split(/\s+/)[0] || 'there'
}

function addressFullName(customer: OrderConfirmationCustomer, address?: OrderConfirmationAddress | null) {
  const fromAddress = address?.fullName?.trim()
  if (fromAddress) return fromAddress

  const joined = `${address?.firstName || ''} ${address?.lastName || ''}`.trim()
  return joined || customer.fullName
}

function itemTitle(item: OrderConfirmationItem) {
  return item.title || item.productTitle || item.name || 'Just Because piece'
}

function itemUnitPrice(item: OrderConfirmationItem) {
  return item.price_at_add ?? item.unitPrice ?? 0
}

function itemLinePrice(item: OrderConfirmationItem) {
  return item.totalPrice ?? itemUnitPrice(item) * item.quantity
}

function orderSubtotal(order: OrderConfirmationOrder, items: OrderConfirmationItem[]) {
  if (typeof order.subtotal === 'number') return order.subtotal
  return items.reduce((sum, item) => sum + itemLinePrice(item), 0)
}

function orderDiscount(order: OrderConfirmationOrder) {
  return order.discountAmount ?? order.discount ?? 0
}

function orderShipping(order: OrderConfirmationOrder) {
  return order.shippingAmount ?? order.shipping ?? order.shippingCost ?? 0
}

function orderTotal(order: OrderConfirmationOrder, items: OrderConfirmationItem[]) {
  if (typeof order.total === 'number') return order.total
  return orderSubtotal(order, items) - orderDiscount(order) + orderShipping(order) + (order.taxAmount || 0)
}

function paymentLabel(order: OrderConfirmationOrder) {
  if (order.paymentMethod && order.paymentMethod !== 'pending') {
    return order.paymentMethod
  }
  return order.paymentStatus === 'paid' ? 'Paid' : 'Paid'
}

function brandLogoHtml() {
  return `
    <div style="text-align:center;margin:0 0 24px;line-height:1;">
      <span style="font-family:Georgia,serif;font-style:italic;font-size:28px;color:${BRAND.gold};letter-spacing:1px;line-height:1;">just</span><br style="line-height:1;" /><span style="font-family:Arial,sans-serif;font-size:10px;color:${BRAND.gold};letter-spacing:5px;font-variant:small-caps;text-transform:uppercase;line-height:1;">&#9472;&#9472; BECAUSE &#9472;&#9472;</span>
    </div>
  `
}

function variantRows(item: OrderConfirmationItem) {
  const explicitVariants = item.variants
    ? Object.entries(item.variants).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    : []

  const variants = explicitVariants.length
    ? explicitVariants.map(([label, value]) => [label, String(value)] as const)
    : [
        ['Metal', getMetalLabel(item.selectedMetal)],
        ['Carat', item.selectedCarat ? `${item.selectedCarat} ct` : null],
        ['Shape', item.selectedShape],
        ['Color', item.selectedColor],
        ['Clarity', item.selectedClarity],
        ['Size', item.ringSize],
        ['Engraving', item.engraving ? `"${item.engraving}"` : null],
      ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '') as [string, string][]

  return variants.map(([label, value]) => `${escapeHtml(label)}: ${escapeHtml(value)}`).join('<br />')
}

function renderItems(items: OrderConfirmationItem[]) {
  return items.map((item) => {
    const safeTitle = escapeHtml(itemTitle(item))
    const variants = variantRows(item)
    const quantity = Number.isFinite(item.quantity) ? item.quantity : 1
    const linePrice = formatCurrency(itemLinePrice(item))

    return `
      <tr>
        <td width="62%" style="width:62%;padding:18px 0;border-bottom:1px solid ${BRAND.goldTint};vertical-align:top;word-break:break-word;">
          <p style="margin:0 0 6px;color:${BRAND.noir};font-family:Georgia,serif;font-size:17px;line-height:1.35;">${safeTitle}</p>
          ${variants ? `<p style="margin:0;color:${BRAND.taupe};font-family:Arial,sans-serif;font-size:12px;line-height:1.7;">${variants}</p>` : ''}
        </td>
        <td width="13%" align="center" style="width:13%;padding:18px 6px;border-bottom:1px solid ${BRAND.goldTint};vertical-align:top;color:${BRAND.noir};font-family:Arial,sans-serif;font-size:13px;">${quantity}</td>
        <td width="25%" align="right" style="width:25%;padding:18px 0;border-bottom:1px solid ${BRAND.goldTint};vertical-align:top;color:${BRAND.noir};font-family:Arial,sans-serif;font-size:13px;word-break:break-word;">${escapeHtml(linePrice)}</td>
      </tr>
    `
  }).join('')
}

function renderShippingAddress(customer: OrderConfirmationCustomer, address?: OrderConfirmationAddress | null) {
  if (!address) {
    return `<p style="margin:0;color:${BRAND.taupe};font-family:Arial,sans-serif;font-size:13px;line-height:1.7;">Your shipping address is saved with your order.</p>`
  }

  const lines = [
    addressFullName(customer, address),
    address.addressLine1,
    address.addressLine2,
    `${address.city || ''}${address.city && address.state ? ', ' : ''}${address.state || ''}${address.zipCode ? ` ${address.zipCode}` : ''}`,
    address.country,
  ].filter((line): line is string => Boolean(line?.trim()))

  return lines.map((line) => `<p style="margin:0;color:${BRAND.noir};font-family:Arial,sans-serif;font-size:13px;line-height:1.7;">${escapeHtml(line)}</p>`).join('')
}

function summaryRow(label: string, value: string, color = BRAND.noir, weight = '400') {
  return `
    <tr>
      <td width="48%" style="width:48%;padding:5px 8px 5px 0;color:${BRAND.taupe};font-family:Arial,sans-serif;font-size:13px;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(label)}</td>
      <td width="52%" align="right" style="width:52%;padding:5px 0;color:${color};font-family:Arial,sans-serif;font-size:13px;font-weight:${weight};word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(value)}</td>
    </tr>
  `
}

export function buildOrderConfirmationEmailHtml({ order, customer, items }: SendOrderConfirmationEmailInput) {
  const orderNumber = normalizeOrderNumber(order)
  const safeFirstName = escapeHtml(customerFirstName(customer))
  const subtotal = orderSubtotal(order, items)
  const discount = orderDiscount(order)
  const shipping = orderShipping(order)
  const total = orderTotal(order, items)
  const estimatedDelivery = order.estimatedDelivery ? formatDate(order.estimatedDelivery) : '5-7 business days'
  const orderDate = formatDate(order.createdAt || order.created_at)
  const trackUrl = `${SITE_URL}/account/orders`
  const invoiceUrl = `${SITE_URL}/account/orders/${encodeURIComponent(order.id)}/invoice`

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Your Just Because order</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.pearl};color:${BRAND.noir};font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:${BRAND.pearl};margin:0;padding:32px 12px;table-layout:fixed;">
      <tr>
        <td align="center">
          <div style="max-width:600px;width:100%;width:min(600px, calc(100vw - 24px));margin:0 auto;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:${BRAND.ivory};border:1px solid ${BRAND.goldTint};border-collapse:collapse;table-layout:fixed;word-break:break-word;overflow-wrap:anywhere;box-sizing:border-box;">
            <tr>
              <td align="center" style="padding:34px 28px 22px;border-bottom:1px solid ${BRAND.goldTint};background:${BRAND.pearl};">
                ${brandLogoHtml()}
                <p style="margin:14px 0 0;color:${BRAND.taupe};font-family:Georgia,serif;font-size:15px;font-style:italic;">A reason, in itself.</p>
              </td>
            </tr>

            <tr>
              <td style="padding:38px 28px 12px;">
                <h1 style="margin:0;color:${BRAND.noir};font-family:Georgia,serif;font-size:32px;font-weight:400;line-height:1.2;">Thank you, ${safeFirstName}.</h1>
                <p style="margin:14px 0 0;color:${BRAND.taupe};font-family:Arial,sans-serif;font-size:15px;line-height:1.7;">Your order has been received and is being prepared with care.</p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.pearl};border:1px solid ${BRAND.goldTint};border-collapse:collapse;">
                  <tr>
                    <td style="padding:22px;">
                      <p style="margin:0 0 12px;color:${BRAND.gold};font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;">Order Summary</p>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;table-layout:fixed;">
                        ${summaryRow('Order Number', `#${orderNumber}`)}
                        ${summaryRow('Order Date', orderDate)}
                        ${summaryRow('Estimated Delivery', estimatedDelivery)}
                        ${summaryRow('Payment', paymentLabel(order))}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 28px 4px;">
                <p style="margin:0 0 12px;color:${BRAND.gold};font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;">Order Items</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;table-layout:fixed;">
                  <tr>
                    <th width="62%" align="left" style="width:62%;padding:0 0 10px;border-bottom:1px solid ${BRAND.goldTint};color:${BRAND.taupe};font-family:Arial,sans-serif;font-size:11px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;">Piece</th>
                    <th width="13%" align="center" style="width:13%;padding:0 6px 10px;border-bottom:1px solid ${BRAND.goldTint};color:${BRAND.taupe};font-family:Arial,sans-serif;font-size:11px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;">Qty</th>
                    <th width="25%" align="right" style="width:25%;padding:0 0 10px;border-bottom:1px solid ${BRAND.goldTint};color:${BRAND.taupe};font-family:Arial,sans-serif;font-size:11px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;">Price</th>
                  </tr>
                  ${renderItems(items)}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:6px 28px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;table-layout:fixed;">
                  ${summaryRow('Subtotal', formatCurrency(subtotal))}
                  ${discount > 0 ? summaryRow('Discount', `-${formatCurrency(discount)}`) : ''}
                  ${summaryRow('Shipping', shipping > 0 ? formatCurrency(shipping) : 'Free')}
                  ${order.taxAmount ? summaryRow('Tax', formatCurrency(order.taxAmount)) : ''}
                  <tr>
                    <td style="padding:14px 0 0;color:${BRAND.noir};font-family:Arial,sans-serif;font-size:14px;border-top:1px solid ${BRAND.goldTint};">Total</td>
                    <td align="right" style="padding:14px 0 0;color:${BRAND.gold};font-family:Arial,sans-serif;font-size:18px;font-weight:500;border-top:1px solid ${BRAND.goldTint};">${escapeHtml(formatCurrency(total))}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.pearl};border:1px solid ${BRAND.goldTint};border-collapse:collapse;">
                  <tr>
                    <td style="padding:22px;">
                      <p style="margin:0 0 12px;color:${BRAND.gold};font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;">Shipping Address</p>
                      ${renderShippingAddress(customer, order.shippingAddress)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 32px;">
                <h2 style="margin:0 0 12px;color:${BRAND.noir};font-family:Georgia,serif;font-size:23px;font-weight:400;">What happens next</h2>
                <p style="margin:0 0 18px;color:${BRAND.taupe};font-family:Arial,sans-serif;font-size:14px;line-height:1.7;">You'll receive a shipping confirmation with tracking once your order ships.</p>
                <a href="${trackUrl}" style="display:inline-block;padding:12px 24px;background:${BRAND.noir};color:${BRAND.pearl};font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.16em;text-decoration:none;text-transform:uppercase;">Track Order</a>
                <p style="margin:18px 0 0;color:${BRAND.gold};font-family:Arial,sans-serif;font-size:12px;line-height:1.7;">
                  <a href="${invoiceUrl}" style="color:${BRAND.gold};text-decoration:none;">Download Invoice (PDF)</a>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 34px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.petal};border:1px solid ${BRAND.goldTint};border-collapse:collapse;">
                  <tr>
                    <td style="padding:22px;">
                      <h2 style="margin:0 0 10px;color:${BRAND.noir};font-family:Georgia,serif;font-size:22px;font-weight:400;">Need help?</h2>
                      <p style="margin:0 0 12px;color:${BRAND.taupe};font-family:Arial,sans-serif;font-size:13px;line-height:1.7;">Questions? Reply to this email or visit our Help Center.</p>
                      <p style="margin:0;color:${BRAND.gold};font-family:Arial,sans-serif;font-size:12px;line-height:1.7;">
                        <a href="${SITE_URL}/contact" style="color:${BRAND.gold};text-decoration:none;">Contact Us</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:28px;background:${BRAND.noir};">
                <p style="margin:0 0 10px;color:${BRAND.pearl};font-family:Georgia,serif;font-size:16px;word-break:break-word;overflow-wrap:anywhere;">Just Because Jewelry &middot; justbecausejewelry.com</p>
                <p style="margin:0 0 18px;color:${BRAND.gold};font-family:Arial,sans-serif;font-size:12px;">
                  <a href="${SITE_URL}" style="color:${BRAND.gold};text-decoration:none;">Instagram</a>
                  <span style="color:${BRAND.taupe};"> &middot; </span>
                  <a href="${SITE_URL}" style="color:${BRAND.gold};text-decoration:none;">Pinterest</a>
                  <span style="color:${BRAND.taupe};"> &middot; </span>
                  <a href="${SITE_URL}" style="color:${BRAND.gold};text-decoration:none;">TikTok</a>
                </p>
                <p style="margin:0 0 8px;color:${BRAND.taupe};font-family:Arial,sans-serif;font-size:11px;line-height:1.6;">You're receiving this because you placed an order with us.</p>
                <p style="margin:0;color:${BRAND.taupe};font-family:Arial,sans-serif;font-size:11px;line-height:1.6;">&copy; 2025 Just Because Jewelry. All rights reserved.</p>
              </td>
            </tr>
          </table>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function buildAdminText({ order, customer, items }: SendOrderConfirmationEmailInput) {
  const orderNumber = normalizeOrderNumber(order)
  const itemLines = items.map((item) => {
    const variants = variantRows(item).replace(/<br \/>/g, '; ').replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    return `- ${itemTitle(item)} x${item.quantity}${variants ? ` (${variants})` : ''}: ${formatCurrency(itemLinePrice(item))}`
  }).join('\n')

  return [
    'New order received:',
    `Customer: ${customer.fullName} (${customer.email})`,
    'Items:',
    itemLines,
    `Total: ${formatCurrency(orderTotal(order, items))}`,
    `View in admin: ${SITE_URL}/admin/orders/${order.id}`,
  ].join('\n')
}

async function postResendEmail(payload: { to: string; subject: string; html?: string; text?: string }) {
  const from = cleanEnvSecret(resendFromEmail) || DEFAULT_FROM
  const { data, error } = payload.html
    ? await resend.emails.send({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      })
    : await resend.emails.send({
        from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text || '',
      })

  if (error) {
    throw new Error(error.message || 'Resend returned an email error')
  }

  console.log('[resend] email accepted:', {
    to: payload.to,
    subject: payload.subject,
    id: data?.id || 'unknown',
  })
}

export async function sendOrderConfirmationEmail(input: SendOrderConfirmationEmailInput) {
  await postResendEmail({
    to: input.customer.email,
    subject: `Your Just Because order #${normalizeOrderNumber(input.order)}`,
    html: buildOrderConfirmationEmailHtml(input),
  })
}

export async function sendAdminOrderNotificationEmail(input: SendOrderConfirmationEmailInput) {
  await postResendEmail({
    to: ADMIN_EMAIL,
    subject: `New Order #${normalizeOrderNumber(input.order)} \u2014 ${formatCurrency(orderTotal(input.order, input.items))}`,
    text: buildAdminText(input),
  })
}
