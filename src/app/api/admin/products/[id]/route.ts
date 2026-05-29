import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SupabaseWriteResult = {
  data: unknown
  error: { message: string } | null
}

type SchemaRetryResult = SupabaseWriteResult & {
  omittedColumns: string[]
}

function getMissingColumn(message: string) {
  const quotedColumn = message.match(/'([^']+)' column/)
  if (quotedColumn?.[1]) {
    return quotedColumn[1]
  }

  const schemaCacheColumn = message.match(/Could not find the '([^']+)' column/)
  return schemaCacheColumn?.[1] || null
}

async function writeWithSchemaRetry(
  payload: Record<string, unknown>,
  write: (saveData: Record<string, unknown>) => Promise<SupabaseWriteResult>
): Promise<SchemaRetryResult> {
  const saveData = { ...payload }
  const omittedColumns: string[] = []

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const result = await write(saveData)

    if (!result.error) {
      return { ...result, omittedColumns }
    }

    const missingColumn = getMissingColumn(result.error.message)
    if (!missingColumn || !(missingColumn in saveData)) {
      return { ...result, omittedColumns }
    }

    delete saveData[missingColumn]
    omittedColumns.push(missingColumn)
  }

  const result = await write(saveData)
  return { ...result, omittedColumns }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data, error } = await supabase
    .from('Product')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json({ product: data })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = (await request.json()) as Record<string, unknown>
  const { data, error, omittedColumns } = await writeWithSchemaRetry(body, async (saveData) =>
    await supabase
      .from('Product')
      .update(saveData)
      .eq('id', id)
      .select('*')
      .single()
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ product: data, omittedColumns })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error } = await supabase
    .from('Product')
    .update({ isActive: false })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
