import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthedUserOrGuest } from '@/lib/auth/getAuthedUserOrGuest'
import { sendSupportNotificationEmail } from '@/lib/email/supportNotification'
import { getGeneralErrorMessage } from '@/lib/errors'
import { requireAdmin, requireUser } from '@/lib/server/security'

type ConversationParams = {
  params: Promise<{ id: string }>
}

const replySchema = z.object({
  content: z.string().trim().min(1).max(5000),
  senderType: z.enum(['admin', 'customer']),
  senderName: z.string().trim().max(160).optional(),
})

const patchSchema = z.object({
  status: z.enum(['open', 'replied', 'resolved']).optional(),
})

async function isAdminViewer(request: NextRequest) {
  return new URL(request.url).searchParams.get('viewer') === 'admin'
}

export async function GET(request: NextRequest, { params }: ConversationParams) {
  const { id } = await params
  const adminViewer = await isAdminViewer(request)
  const auth = adminViewer ? await requireAdmin(request) : await requireUser(request)
  if ('error' in auth) return auth.error

  let query = auth.admin
    .from('Conversation')
    .select('*')
    .eq('id', id)

  if (!adminViewer) {
    query = query.eq('customerId', auth.user.id)
  }

  const { data: conversation, error } = await query.maybeSingle()
  if (error || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const { data: messages, error: messageError } = await auth.admin
    .from('ConversationMessage')
    .select('*')
    .eq('conversationId', id)
    .order('createdAt', { ascending: true })

  if (messageError) {
    console.error('[conversations/id] messages load failed:', messageError)
    return NextResponse.json({ error: getGeneralErrorMessage(messageError) }, { status: 500 })
  }

  await auth.admin
    .from('Conversation')
    .update(adminViewer ? { isReadByAdmin: true } : { isReadByCustomer: true })
    .eq('id', id)

  return NextResponse.json({ conversation, messages: messages || [] })
}

export async function POST(request: NextRequest, { params }: ConversationParams) {
  const { id } = await params
  const parsed = replySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid reply payload' }, { status: 400 })
  }

  const adminReply = parsed.data.senderType === 'admin'
  const auth = adminReply ? await requireAdmin(request) : await requireUser(request)
  if ('error' in auth) return auth.error
  const identity = adminReply ? null : await getAuthedUserOrGuest(request)
  if (!adminReply && (!identity || !identity.authed)) {
    return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 })
  }

  let conversationQuery = auth.admin
    .from('Conversation')
    .select('id,customerEmail,customerName,subject,productTitle,productSlug')
    .eq('id', id)

  if (!adminReply) {
    conversationQuery = conversationQuery.eq('customerId', auth.user.id)
  }

  const { data: conversation, error: conversationError } = await conversationQuery.maybeSingle()
  if (conversationError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const senderName = adminReply
    ? 'Just Because Team'
    : identity?.authed ? identity.name || identity.email : 'Customer'

  const { error: msgError } = await auth.admin
    .from('ConversationMessage')
    .insert({
      conversationId: id,
      senderType: parsed.data.senderType,
      senderName,
      content: parsed.data.content,
    })

  if (msgError) {
    console.error('[conversations/id] reply insert failed:', msgError)
    return NextResponse.json({ error: getGeneralErrorMessage(msgError) }, { status: 500 })
  }

  const { error: updateError } = await auth.admin
    .from('Conversation')
    .update({
      updatedAt: new Date().toISOString(),
      status: adminReply ? 'replied' : 'open',
      isReadByAdmin: adminReply,
      isReadByCustomer: adminReply ? false : true,
    })
    .eq('id', id)

  if (updateError) {
    console.error('[conversations/id] conversation update failed:', updateError)
    return NextResponse.json({ error: getGeneralErrorMessage(updateError) }, { status: 500 })
  }

  if (!adminReply && identity?.authed) {
    try {
      await sendSupportNotificationEmail({
        conversationId: id,
        customerName: identity.name || identity.email,
        customerEmail: identity.email,
        subject: typeof conversation.subject === 'string' ? conversation.subject : 'Support reply',
        message: parsed.data.content,
        productTitle: typeof conversation.productTitle === 'string' ? conversation.productTitle : null,
        productSlug: typeof conversation.productSlug === 'string' ? conversation.productSlug : null,
      })
    } catch (error) {
      console.error('[support] notification email failed:', error)
    }
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, { params }: ConversationParams) {
  const { id } = await params
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !parsed.data.status) {
    return NextResponse.json({ error: 'Invalid conversation update payload' }, { status: 400 })
  }

  const { error } = await auth.admin
    .from('Conversation')
    .update({
      status: parsed.data.status,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[conversations/id] status update failed:', error)
    return NextResponse.json({ error: getGeneralErrorMessage(error) }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
