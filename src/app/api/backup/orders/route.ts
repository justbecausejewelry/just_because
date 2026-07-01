import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_INBOX, EMAIL_SENDERS } from '@/lib/email/senders'
import { getResendClient } from '@/lib/email/resend'
import { createServiceRoleClient, requireAdmin } from '@/lib/server/security'

type OrderItemRow = {
  id?: string | null
  productTitle?: string | null
  variantTitle?: string | null
  quantity?: number | null
  unitPrice?: number | null
  totalPrice?: number | null
  selectedMetal?: string | null
  selectedCarat?: number | null
  selectedShape?: string | null
  selectedColor?: string | null
  selectedClarity?: string | null
  ringSize?: string | null
}

type ShippingAddress = {
  addressLine1?: string | null
  addressLine2?: string | null
  line1?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  zip?: string | null
  country?: string | null
}

type OrderRow = {
  id: string
  orderNumber?: string | null
  createdAt?: string | null
  customerName?: string | null
  customerEmail?: string | null
  total?: number | null
  status?: string | null
  shippingAddress?: ShippingAddress | null
  paymentStatus?: string | null
  items?: OrderItemRow[] | null
  OrderItem?: OrderItemRow[] | null
}

type BackupStats = {
  fileDate: string
  timestamp: string
  todayOrders: number
  todayRevenue: number
  totalOrders: number
  totalRevenue: number
}

const TIME_ZONE = 'America/Chicago'
const BACKUP_TYPE = 'order_backup'
const BACKUP_SUCCESS_MESSAGE = 'Daily order backup completed'

function getServiceClient() {
  const existingClient = createServiceRoleClient()
  if (existingClient) return existingClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function cleanSecret(value?: string) {
  return value?.replace(/^[\s\u00a0\ufeff\u00c2]+/, '').trim() || ''
}

async function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const backupSecret = cleanSecret(process.env.BACKUP_SECRET_KEY)

  if (isVercelCron) return true
  if (backupSecret && authHeader === `Bearer ${backupSecret}`) return true

  const adminAuth = await requireAdmin(request)
  return !('error' in adminAuth)
}

function orderItems(order: OrderRow) {
  return Array.isArray(order.items) ? order.items : Array.isArray(order.OrderItem) ? order.OrderItem : []
}

function itemSummary(items: OrderItemRow[]) {
  if (!items.length) return ''

  return items.map((item) => {
    const details = [
      item.variantTitle,
      item.selectedMetal,
      item.selectedCarat ? `${item.selectedCarat}ct` : null,
      item.selectedShape,
      item.selectedColor,
      item.selectedClarity,
      item.ringSize ? `Size ${item.ringSize}` : null,
    ].filter(Boolean).join(' / ')
    const quantity = Number(item.quantity || 1)
    const title = item.productTitle || 'Item'
    return details ? `${quantity} x ${title} (${details})` : `${quantity} x ${title}`
  }).join('; ')
}

function shippingSummary(address?: ShippingAddress | null) {
  if (!address) return ''
  return [
    address.addressLine1 || address.line1,
    address.addressLine2 || address.line2,
    address.city,
    address.state,
    address.zipCode || address.zip,
    address.country,
  ].filter(Boolean).join(', ')
}

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? '')
  const escaped = text.replace(/"/g, '""')
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped
}

function convertToCSV(orders: OrderRow[]) {
  const headers = [
    'Order Number',
    'Date',
    'Customer Name',
    'Customer Email',
    'Items',
    'Total',
    'Status',
    'Shipping Address',
    'Payment Status',
  ]

  if (orders.length === 0) {
    return `${headers.map(csvCell).join(',')}\n${csvCell('No orders found')}`
  }

  const rows = orders.map((order) => [
    order.orderNumber || order.id,
    order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { timeZone: TIME_ZONE }) : '',
    order.customerName || '',
    order.customerEmail || '',
    itemSummary(orderItems(order)),
    Number(order.total || 0),
    order.status || '',
    shippingSummary(order.shippingAddress),
    order.paymentStatus || '',
  ])

  return [
    headers.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ].join('\n')
}

function chicagoDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone: TIME_ZONE,
    year: 'numeric',
  }).formatToParts(now)

  const year = parts.find((part) => part.type === 'year')?.value || String(now.getUTCFullYear())
  const month = parts.find((part) => part.type === 'month')?.value || '01'
  const day = parts.find((part) => part.type === 'day')?.value || '01'
  return { day, month, year }
}

function chicagoStartOfDay(now: Date) {
  const { day, month, year } = chicagoDateParts(now)
  return new Date(`${year}-${month}-${day}T00:00:00-06:00`)
}

function backupDates(now: Date) {
  const { day, month, year } = chicagoDateParts(now)
  return {
    dateStr: now.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      timeZone: TIME_ZONE,
      year: 'numeric',
    }),
    fileDate: `${year}-${month}-${day}`,
    startOfDay: chicagoStartOfDay(now),
  }
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function htmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function todayOrdersHtml(todayOrders: OrderRow[]) {
  if (!todayOrders.length) {
    return `
      <div style="background:#FDF8F2;padding:20px;border:1px solid #EDD9AF;margin-bottom:24px;text-align:center;">
        <p style="color:#B8A090;font-size:14px;margin:0;">No orders today</p>
      </div>
    `
  }

  return `
    <div style="background:#FDF8F2;padding:20px;border:1px solid #EDD9AF;margin-bottom:24px;">
      <p style="font-size:11px;letter-spacing:0.1em;color:#B8A090;margin:0 0 16px;">TODAY'S ORDERS</p>
      ${todayOrders.map((order) => `
        <div style="padding:12px 0;border-bottom:1px solid #EDD9AF;display:flex;justify-content:space-between;gap:16px;">
          <div>
            <p style="font-size:13px;color:#1A1014;margin:0;">#${htmlEscape(order.orderNumber || order.id.slice(0, 8))}</p>
            <p style="font-size:12px;color:#B8A090;margin:4px 0 0;">${htmlEscape(order.customerEmail || 'No email')}</p>
          </div>
          <p style="font-size:13px;color:#1A1014;margin:0;font-weight:500;">${money(Number(order.total || 0))}</p>
        </div>
      `).join('')}
    </div>
  `
}

function backupEmailHtml({
  allOrders,
  dateStr,
  fileDate,
  stats,
  todayOrders,
}: {
  allOrders: OrderRow[]
  dateStr: string
  fileDate: string
  stats: BackupStats
  todayOrders: OrderRow[]
}) {
  const statCard = (value: string, label: string, color: string) => `
    <div style="background:#FDF8F2;padding:20px;border:1px solid #EDD9AF;text-align:center;">
      <p style="font-size:28px;color:${color};font-weight:500;margin:0;">${htmlEscape(value)}</p>
      <p style="font-size:11px;letter-spacing:0.1em;color:#B8A090;margin:4px 0 0;">${htmlEscape(label)}</p>
    </div>
  `

  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;padding:40px 20px;background:#FBF5F0;">
        <p style="font-size:11px;letter-spacing:0.2em;color:#C9A961;margin:0 0 24px;">JUST BECAUSE JEWELRY</p>
        <h1 style="font-size:24px;color:#1A1014;font-weight:400;margin:0 0 8px;">Daily Order Backup</h1>
        <p style="color:#B8A090;font-size:14px;margin:0 0 32px;">${htmlEscape(dateStr)} - Automated backup</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:32px;">
          ${statCard(String(stats.todayOrders), 'ORDERS TODAY', '#1A1014')}
          ${statCard(money(stats.todayRevenue), 'REVENUE TODAY', '#C9A961')}
          ${statCard(String(allOrders.length), 'TOTAL ORDERS', '#1A1014')}
          ${statCard(money(stats.totalRevenue), 'TOTAL REVENUE', '#C9A961')}
        </div>
        <div style="background:#FDF8F2;padding:20px;border:1px solid #EDD9AF;margin-bottom:24px;">
          <p style="font-size:13px;color:#1A1014;margin:0 0 8px;font-weight:500;">Attachments</p>
          <p style="font-size:13px;color:#B8A090;margin:0;line-height:1.7;">
            all-orders-${htmlEscape(fileDate)}.csv - Complete order history<br>
            today-orders-${htmlEscape(fileDate)}.csv - Today's orders only
          </p>
        </div>
        ${todayOrdersHtml(todayOrders)}
        <div style="text-align:center;margin-top:32px;">
          <a href="https://justbecausejewelry.com/admin/orders" style="background:#1A1014;color:#FBF5F0;text-decoration:none;padding:14px 32px;font-size:11px;letter-spacing:0.15em;display:inline-block;">VIEW ADMIN PANEL</a>
        </div>
        <p style="color:#B8A090;font-size:11px;text-align:center;margin-top:24px;line-height:1.7;">
          This is an automated backup scheduled every night at 9:00 PM CST.<br>
          Just Because Jewelry - justbecausejewelry.com
        </p>
      </body>
    </html>
  `
}

async function insertSystemLog(
  supabase: SupabaseClient,
  status: 'success' | 'failed',
  message: string,
  metadata: Record<string, string | number | boolean | null>
) {
  const { error } = await supabase.from('SystemLog').insert({
    message,
    metadata,
    status,
    type: BACKUP_TYPE,
  })

  if (error) {
    console.error('[backup-orders] failed to insert SystemLog:', error.message)
  }
}

async function sendFailureEmail(errorMessage: string) {
  try {
    await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || EMAIL_SENDERS.support,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;padding:40px;background:#FBF5F0;color:#1A1014;">
          <h2 style="color:#A85C6A;font-weight:400;">Backup Failed</h2>
          <p>The nightly order backup failed to run.</p>
          <p><strong>Error:</strong> ${htmlEscape(errorMessage)}</p>
          <p><strong>Time:</strong> ${htmlEscape(new Date().toISOString())}</p>
        </div>
      `,
      subject: 'Backup Failed - Just Because Jewelry',
      to: ADMIN_INBOX,
    })
  } catch (emailError) {
    console.error('[backup-orders] failed to send failure alert:', emailError)
  }
}

export async function GET(request: NextRequest) {
  const authorized = await isAuthorized(request)
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 500 })
  }

  const now = new Date()

  try {
    const { dateStr, fileDate, startOfDay } = backupDates(now)

    const { data: allOrders, error: allOrdersError } = await supabase
      .from('Order')
      .select('*, items:OrderItem(*)')
      .order('createdAt', { ascending: false })

    if (allOrdersError) throw new Error(allOrdersError.message)

    const { data: todayOrders, error: todayOrdersError } = await supabase
      .from('Order')
      .select('*, items:OrderItem(*)')
      .gte('createdAt', startOfDay.toISOString())
      .order('createdAt', { ascending: false })

    if (todayOrdersError) throw new Error(todayOrdersError.message)

    const allOrderRows = (allOrders || []) as OrderRow[]
    const todayOrderRows = (todayOrders || []) as OrderRow[]
    const allOrdersCSV = convertToCSV(allOrderRows)
    const todayOrdersCSV = convertToCSV(todayOrderRows)
    const totalRevenue = allOrderRows.reduce((sum, order) => sum + Number(order.total || 0), 0)
    const todayRevenue = todayOrderRows.reduce((sum, order) => sum + Number(order.total || 0), 0)
    const stats: BackupStats = {
      fileDate,
      timestamp: now.toISOString(),
      todayOrders: todayOrderRows.length,
      todayRevenue,
      totalOrders: allOrderRows.length,
      totalRevenue,
    }

    await getResendClient().emails.send({
      attachments: [
        {
          content: Buffer.from(allOrdersCSV, 'utf8').toString('base64'),
          filename: `all-orders-${fileDate}.csv`,
        },
        {
          content: Buffer.from(todayOrdersCSV, 'utf8').toString('base64'),
          filename: `today-orders-${fileDate}.csv`,
        },
      ],
      from: process.env.RESEND_FROM_EMAIL || EMAIL_SENDERS.support,
      html: backupEmailHtml({
        allOrders: allOrderRows,
        dateStr,
        fileDate,
        stats,
        todayOrders: todayOrderRows,
      }),
      subject: `Daily Order Backup - ${dateStr} | ${todayOrderRows.length} orders today`,
      to: ADMIN_INBOX,
    })

    await insertSystemLog(supabase, 'success', BACKUP_SUCCESS_MESSAGE, {
      revenue: totalRevenue,
      todayOrders: todayOrderRows.length,
      todayRevenue,
      totalOrders: allOrderRows.length,
    })

    return NextResponse.json({
      message: 'Backup sent successfully',
      stats: {
        ...stats,
        sentTo: ADMIN_INBOX,
      },
      success: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backup failed'
    console.error('[backup-orders] failed:', error)

    await insertSystemLog(supabase, 'failed', message, {
      timestamp: now.toISOString(),
    })
    await sendFailureEmail(message)

    return NextResponse.json(
      { details: message, error: 'Backup failed' },
      { status: 500 }
    )
  }
}
