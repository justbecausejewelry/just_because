import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ConversationParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: ConversationParams) {
  const { id } = await params
  const viewer = new URL(request.url).searchParams.get('viewer')

  const { data: conversation, error } = await supabase
    .from('Conversation')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  const { data: messages, error: messageError } = await supabase
    .from('ConversationMessage')
    .select('*')
    .eq('conversationId', id)
    .order('createdAt', { ascending: true })

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 })
  }

  await supabase
    .from('Conversation')
    .update(viewer === 'admin' ? { isReadByAdmin: true } : { isReadByCustomer: true })
    .eq('id', id)

  return NextResponse.json({ conversation, messages: messages || [] })
}

export async function POST(request: NextRequest, { params }: ConversationParams) {
  const { id } = await params
  const body = (await request.json()) as {
    content?: string
    senderType?: 'admin' | 'customer'
    senderName?: string
  }
  const { content, senderType, senderName } = body

  if (!content || !senderType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error: msgError } = await supabase
    .from('ConversationMessage')
    .insert({
      conversationId: id,
      senderType,
      senderName: senderName || (senderType === 'admin' ? 'Just Because Team' : 'Customer'),
      content,
    })

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from('Conversation')
    .update({
      updatedAt: new Date().toISOString(),
      status: senderType === 'admin' ? 'replied' : 'open',
      isReadByAdmin: senderType === 'admin',
      isReadByCustomer: senderType === 'admin' ? false : true,
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, { params }: ConversationParams) {
  const { id } = await params
  const body = (await request.json()) as {
    status?: 'open' | 'replied' | 'resolved'
    isReadByAdmin?: boolean
    isReadByCustomer?: boolean
  }

  const updates: Record<string, string | boolean> = {
    updatedAt: new Date().toISOString(),
  }

  if (body.status) updates.status = body.status
  if (typeof body.isReadByAdmin === 'boolean') updates.isReadByAdmin = body.isReadByAdmin
  if (typeof body.isReadByCustomer === 'boolean') updates.isReadByCustomer = body.isReadByCustomer

  const { error } = await supabase
    .from('Conversation')
    .update(updates)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
