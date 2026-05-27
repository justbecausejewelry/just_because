import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customerId')

  if (!customerId) {
    return NextResponse.json({ error: 'customerId required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('Conversation')
    .select('*')
    .eq('customerId', customerId)
    .order('updatedAt', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ conversations: data || [] })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    customerId?: string
    customerEmail?: string
    customerName?: string
    subject?: string
    message?: string
    productId?: string | null
    productSlug?: string | null
    productTitle?: string | null
    productImage?: string | null
    conversationType?: 'general' | 'product'
  }
  const {
    customerId,
    customerEmail,
    customerName,
    subject,
    message,
    productId,
    productSlug,
    productTitle,
    productImage,
    conversationType = 'general',
  } = body

  if (!customerId || !subject || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: conversation, error: convError } = await supabase
    .from('Conversation')
    .insert({
      customerId,
      customerEmail,
      customerName,
      subject,
      status: 'open',
      isReadByAdmin: false,
      isReadByCustomer: true,
      productId: productId || null,
      productSlug: productSlug || null,
      productTitle: productTitle || null,
      productImage: productImage || null,
      conversationType,
    })
    .select()
    .single()

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 500 })
  }

  const { error: msgError } = await supabase
    .from('ConversationMessage')
    .insert({
      conversationId: conversation.id,
      senderType: 'customer',
      senderName: customerName || customerEmail || 'Customer',
      content: message,
    })

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  return NextResponse.json({ conversation })
}
