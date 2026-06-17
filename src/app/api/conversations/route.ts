import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthedUserOrGuest } from '@/lib/auth/getAuthedUserOrGuest'
import { checkRateLimit, rateLimitResponse } from '@/lib/server/rateLimit'
import { requireUser } from '@/lib/server/security'

const createConversationSchema = z.object({
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(5000),
  customerName: z.string().trim().max(160).optional(),
  productId: z.string().trim().max(120).nullable().optional(),
  productSlug: z.string().trim().max(180).nullable().optional(),
  productTitle: z.string().trim().max(180).nullable().optional(),
  productImage: z.string().trim().max(1000).nullable().optional(),
  conversationType: z.enum(['general', 'product']).optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error
  const identity = await getAuthedUserOrGuest(request)
  if (!identity.authed) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
  }

  const { data, error } = await auth.admin
    .from('Conversation')
    .select('*')
    .eq('customerId', auth.user.id)
    .order('updatedAt', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ conversations: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error
  const identity = await getAuthedUserOrGuest(request)
  if (!identity.authed) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
  }

  const limit = checkRateLimit({
    key: `support:${auth.user.id}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  })
  if (!limit.ok) return rateLimitResponse(limit.resetAt)

  const parsed = createConversationSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid conversation payload' }, { status: 400 })
  }

  const customerName = identity.name || identity.email || 'Customer'
  const { data: conversation, error: convError } = await auth.admin
    .from('Conversation')
    .insert({
      customerId: auth.user.id,
      customerEmail: identity.email,
      customerName,
      subject: parsed.data.subject,
      status: 'open',
      isReadByAdmin: false,
      isReadByCustomer: true,
      productId: parsed.data.productId || null,
      productSlug: parsed.data.productSlug || null,
      productTitle: parsed.data.productTitle || null,
      productImage: parsed.data.productImage || null,
      conversationType: parsed.data.conversationType || 'general',
    })
    .select()
    .single()

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 500 })
  }

  const { error: msgError } = await auth.admin
    .from('ConversationMessage')
    .insert({
      conversationId: conversation.id,
      senderType: 'customer',
      senderName: customerName,
      content: parsed.data.message,
    })

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  return NextResponse.json({ conversation })
}
