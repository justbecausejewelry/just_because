import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { getMetalLabel } from '@/config/productOptions'
import { requireUser } from '@/lib/server/security'

type ShippingAddress = {
  firstName?: string | null
  lastName?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
}

type InvoiceItem = {
  productTitle?: string | null
  selectedMetal?: string | null
  selectedCarat?: number | null
  selectedShape?: string | null
  selectedColor?: string | null
  selectedClarity?: string | null
  ringSize?: string | null
  engraving?: string | null
  quantity?: number | null
  unitPrice?: number | null
  totalPrice?: number | null
}

type InvoiceOrder = {
  id: string
  userId?: string | null
  orderNumber: string
  customerName?: string | null
  customerEmail: string
  shippingAddress?: ShippingAddress | null
  subtotal?: number | null
  discountAmount?: number | null
  shippingAmount?: number | null
  taxAmount?: number | null
  total?: number | null
  createdAt: string
  OrderItem?: InvoiceItem[]
}

type DrawTextOptions = {
  font: PDFFont
  size: number
  x: number
  y: number
  color?: ReturnType<typeof rgb>
}

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN = 48
const NOIR = rgb(0.1, 0.06, 0.08)
const MUTED = rgb(0.45, 0.4, 0.38)
const BORDER = rgb(0.84, 0.75, 0.58)
const GOLD = rgb(0.79, 0.66, 0.38)

function formatCurrency(value?: number | null) {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(numeric)
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function productTitle(item: InvoiceItem) {
  return item.productTitle || 'Just Because piece'
}

function itemTotal(item: InvoiceItem) {
  return item.totalPrice ?? (item.unitPrice || 0) * (item.quantity || 1)
}

function variantSummary(item: InvoiceItem) {
  return [
    getMetalLabel(item.selectedMetal),
    item.selectedCarat ? `${item.selectedCarat} ct` : null,
    item.selectedShape,
    item.selectedColor,
    item.selectedClarity,
    item.ringSize ? `Size ${item.ringSize}` : null,
    item.engraving ? `Engraving: ${item.engraving}` : null,
  ].filter(Boolean).join(' / ')
}

function shippingLines(order: InvoiceOrder) {
  const address = order.shippingAddress
  if (!address) return ['Shipping address on file']

  const name = [address.firstName, address.lastName].filter(Boolean).join(' ') || order.customerName || order.customerEmail
  const cityLine = `${address.city || ''}${address.city && address.state ? ', ' : ''}${address.state || ''}${address.zipCode ? ` ${address.zipCode}` : ''}`.trim()

  return [
    name,
    address.addressLine1,
    address.addressLine2,
    cityLine,
    address.country,
  ].filter((line): line is string => Boolean(line?.trim()))
}

function safeFilename(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, '')
}

function drawText(page: PDFPage, text: string, options: DrawTextOptions) {
  page.drawText(text, {
    font: options.font,
    size: options.size,
    x: options.x,
    y: options.y,
    color: options.color || NOIR,
  })
}

function drawRightText(page: PDFPage, text: string, options: DrawTextOptions) {
  const width = options.font.widthOfTextAtSize(text, options.size)
  drawText(page, text, { ...options, x: options.x - width })
}

function fitText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`
}

function drawDivider(page: PDFPage, y: number) {
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.6,
    color: BORDER,
  })
}

function drawLogo(page: PDFPage, fonts: { serifItalic: PDFFont; sans: PDFFont }) {
  drawText(page, 'just', {
    font: fonts.serifItalic,
    size: 28,
    x: MARGIN,
    y: PAGE_HEIGHT - 74,
    color: GOLD,
  })
  drawText(page, '-- BECAUSE --', {
    font: fonts.sans,
    size: 10,
    x: MARGIN + 2,
    y: PAGE_HEIGHT - 88,
    color: GOLD,
  })
}

function drawOrderDetails(page: PDFPage, order: InvoiceOrder, fonts: { sans: PDFFont; bold: PDFFont }) {
  let y = PAGE_HEIGHT - 144
  const leftX = MARGIN
  const rightX = 330

  drawText(page, 'ORDER DETAILS', { font: fonts.bold, size: 10, x: leftX, y, color: MUTED })
  drawText(page, 'CUSTOMER', { font: fonts.bold, size: 10, x: rightX, y, color: MUTED })
  y -= 22

  drawText(page, `Order #: ${order.orderNumber}`, { font: fonts.sans, size: 10, x: leftX, y })
  drawText(page, fitText(order.customerName || order.customerEmail, 34), { font: fonts.sans, size: 10, x: rightX, y })
  y -= 16

  drawText(page, `Date: ${formatDate(order.createdAt)}`, { font: fonts.sans, size: 10, x: leftX, y })
  drawText(page, fitText(order.customerEmail, 34), { font: fonts.sans, size: 10, x: rightX, y })
  y -= 28

  drawText(page, 'SHIPPING ADDRESS', { font: fonts.bold, size: 10, x: leftX, y, color: MUTED })
  y -= 16
  shippingLines(order).slice(0, 5).forEach((line) => {
    drawText(page, fitText(line, 72), { font: fonts.sans, size: 10, x: leftX, y })
    y -= 14
  })

  return y - 16
}

function drawItemsTable(page: PDFPage, order: InvoiceOrder, fonts: { sans: PDFFont; bold: PDFFont }) {
  let y = 510
  const columns = {
    product: MARGIN,
    variants: 190,
    qty: 372,
    unit: 430,
    total: PAGE_WIDTH - MARGIN,
  }

  drawDivider(page, y + 16)
  drawText(page, 'Product', { font: fonts.bold, size: 9, x: columns.product, y, color: MUTED })
  drawText(page, 'Variants', { font: fonts.bold, size: 9, x: columns.variants, y, color: MUTED })
  drawText(page, 'Qty', { font: fonts.bold, size: 9, x: columns.qty, y, color: MUTED })
  drawRightText(page, 'Unit Price', { font: fonts.bold, size: 9, x: columns.unit + 54, y, color: MUTED })
  drawRightText(page, 'Total', { font: fonts.bold, size: 9, x: columns.total, y, color: MUTED })
  drawDivider(page, y - 8)
  y -= 28

  const items = order.OrderItem || []
  items.slice(0, 10).forEach((item) => {
    drawText(page, fitText(productTitle(item), 24), { font: fonts.sans, size: 9, x: columns.product, y })
    drawText(page, fitText(variantSummary(item), 34), { font: fonts.sans, size: 8, x: columns.variants, y, color: MUTED })
    drawText(page, String(item.quantity || 1), { font: fonts.sans, size: 9, x: columns.qty, y })
    drawRightText(page, formatCurrency(item.unitPrice), { font: fonts.sans, size: 9, x: columns.unit + 54, y })
    drawRightText(page, formatCurrency(itemTotal(item)), { font: fonts.sans, size: 9, x: columns.total, y })
    y -= 24
  })

  drawDivider(page, y + 8)
  return y - 26
}

function drawTotals(page: PDFPage, order: InvoiceOrder, y: number, fonts: { sans: PDFFont; bold: PDFFont }) {
  const labelX = 386
  const valueX = PAGE_WIDTH - MARGIN
  const rows = [
    ['Subtotal', formatCurrency(order.subtotal)],
    ['Discount', order.discountAmount ? `-${formatCurrency(order.discountAmount)}` : formatCurrency(0)],
    ['Shipping', order.shippingAmount ? formatCurrency(order.shippingAmount) : 'Free'],
    ['Tax', formatCurrency(order.taxAmount)],
    ['TOTAL', formatCurrency(order.total)],
  ] as const

  rows.forEach(([label, value], index) => {
    const isTotal = label === 'TOTAL'
    if (isTotal) drawDivider(page, y + 10)
    drawText(page, label, { font: isTotal ? fonts.bold : fonts.sans, size: isTotal ? 11 : 10, x: labelX, y, color: isTotal ? NOIR : MUTED })
    drawRightText(page, value, { font: isTotal ? fonts.bold : fonts.sans, size: isTotal ? 12 : 10, x: valueX, y, color: isTotal ? NOIR : MUTED })
    y -= index === rows.length - 2 ? 24 : 18
  })
}

async function buildInvoicePdf(order: InvoiceOrder) {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const sans = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic)

  drawLogo(page, { serifItalic, sans })
  drawRightText(page, 'INVOICE', {
    font: bold,
    size: 24,
    x: PAGE_WIDTH - MARGIN,
    y: PAGE_HEIGHT - 76,
    color: NOIR,
  })
  drawDivider(page, PAGE_HEIGHT - 108)

  drawOrderDetails(page, order, { sans, bold })
  const totalsY = drawItemsTable(page, order, { sans, bold })
  drawTotals(page, order, totalsY, { sans, bold })

  drawDivider(page, 92)
  drawText(page, 'Just Because Jewelry - justbecausejewelry.com', {
    font: sans,
    size: 9,
    x: MARGIN,
    y: 68,
    color: MUTED,
  })
  drawRightText(page, 'Thank you for your purchase.', {
    font: sans,
    size: 9,
    x: PAGE_WIDTH - MARGIN,
    y: 68,
    color: MUTED,
  })

  return pdf.save()
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error

  const { id } = await context.params
  const email = auth.user.email?.toLowerCase()
  const { data, error } = await auth.admin
    .from('Order')
    .select('*, OrderItem(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Unable to load invoice' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const order = data as InvoiceOrder
  const ownedByUser = order.userId === auth.user.id
  const ownedByEmail = Boolean(email && order.customerEmail.toLowerCase() === email)

  if (!ownedByUser && !ownedByEmail) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const bytes = await buildInvoicePdf(order)
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const orderNumber = safeFilename(order.orderNumber || order.id)

  return new Response(body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="JustBecause-Order-${orderNumber}.pdf"`,
    },
  })
}
