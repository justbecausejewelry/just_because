import { NextRequest, NextResponse } from 'next/server'

type EmailPayload = {
  to?: string
  subject?: string
  html?: string
}

export async function POST(request: NextRequest) {
  const body = await request.json() as EmailPayload

  if (!body.to || !body.subject || !body.html) {
    return NextResponse.json({ error: 'to, subject, and html are required' }, { status: 400 })
  }

  console.log('Prototype email notification', {
    to: body.to,
    subject: body.subject,
    html: body.html,
  })

  return NextResponse.json({ ok: true })
}

