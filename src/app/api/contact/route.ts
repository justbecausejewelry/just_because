import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getResendClient } from '@/lib/email/resend'
import { EMAIL_SENDERS } from '@/lib/email/senders'

const subjectOptions = [
  'General Inquiry',
  'Order Support',
  'Custom Ring Builder',
  'Returns & Exchanges',
  'Sizing Help',
  'Other',
] as const

const contactSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  subject: z.enum(subjectOptions),
  message: z.string().trim().min(20).max(5000),
})

type RateLimitEntry = {
  count: number
  resetAt: number
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 3
const CONTACT_TO_EMAIL = 'support@justbecausejewelry.com'
const rateLimitStore = new Map<string, RateLimitEntry>()

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = request.headers.get('x-real-ip')?.trim()
  return forwardedFor || realIp || 'local'
}

function checkRateLimit(ip: string) {
  const now = Date.now()
  const current = rateLimitStore.get(ip)

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return false
  }

  rateLimitStore.set(ip, { ...current, count: current.count + 1 })
  return true
}

async function sendContactNotification(data: z.infer<typeof contactSchema>) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.log('[contact] RESEND_API_KEY is not configured; logging contact form submission only')
    console.log('[contact] local contact submission:', data)
    return { delivered: false, id: null }
  }

  console.log('[contact] sending email notification to:', CONTACT_TO_EMAIL)

  const { data: sentEmail, error } = await getResendClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL || EMAIL_SENDERS.support,
    to: CONTACT_TO_EMAIL,
    replyTo: data.email,
    subject: `Contact form: ${data.subject}`,
    text: [
      `Name: ${data.firstName} ${data.lastName}`,
      `Email: ${data.email}`,
      `Subject: ${data.subject}`,
      '',
      data.message,
    ].join('\n'),
  })

  if (error) {
    console.error('[contact] Resend returned an error:', error)
    throw new Error(error.message || 'Resend email send failed')
  }

  console.log('[contact] email notification sent; id:', sentEmail?.id || 'unknown')
  return { delivered: true, id: sentEmail?.id || null }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  console.log('[contact] POST /api/contact hit from IP:', ip)

  if (!checkRateLimit(ip)) {
    console.warn('[contact] rate limit exceeded for IP:', ip)
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 },
    )
  }

  const rawBody = await request.json().catch((error: unknown) => {
    console.error('[contact] failed to parse JSON body:', error)
    return null
  })
  console.log('[contact] form data received:', rawBody)

  const parsed = contactSchema.safeParse(rawBody)

  if (!parsed.success) {
    console.warn('[contact] validation failed:', parsed.error.flatten())
    return NextResponse.json(
      { error: 'First name, last name, valid email, subject, and a message of at least 20 characters are required.' },
      { status: 400 },
    )
  }

  try {
    console.log('[contact] validated contact submission; preparing email send')
    const result = await sendContactNotification(parsed.data)
    console.log('[contact] contact submission completed:', result)
    return NextResponse.json({
      success: true,
      delivered: result.delivered,
      message: result.delivered
        ? 'Thank you. Your message was sent, and we will be in touch within 24 hours.'
        : 'Thank you. Your message was received locally. Email sending is not configured.',
    })
  } catch (error) {
    console.error('[contact] contact notification failed:', error)
    return NextResponse.json(
      { error: 'Message could not be sent. Please try again or email support@justbecausejewelry.com.' },
      { status: 500 },
    )
  }
}
