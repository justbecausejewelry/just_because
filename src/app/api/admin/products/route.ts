import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server/security'

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

function isCollectionColumn(column: string | null) {
  return ['isBestSeller', 'isNewArrival', 'isFeatured', 'isGift', 'collections'].includes(column || '')
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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if ('error' in auth) return auth.error

    const { data, error } = await auth.admin
      .from('Product')
      .select('id, sku, title, slug, productType, category, basePrice, isActive, isBestSeller, isNewArrival, isFeatured, isGift, collections, images')
      .order('createdAt', { ascending: false })

    const missingColumn = error ? getMissingColumn(error.message) : null
    if (error && isCollectionColumn(missingColumn)) {
      const fallback = await auth.admin
        .from('Product')
        .select('id, sku, title, slug, productType, category, basePrice, isActive, isFeatured, isNewArrival, images')
        .order('createdAt', { ascending: false })

      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 })
      }

      return NextResponse.json({ products: fallback.data || [], omittedColumns: [missingColumn] })
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products: data || [] })
  } catch (err) {
    console.error('[admin/products] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if ('error' in auth) return auth.error

    const body = (await request.json()) as Record<string, unknown>
    const { data, error, omittedColumns } = await writeWithSchemaRetry(body, async (saveData) =>
      await auth.admin
        .from('Product')
        .insert(saveData)
        .select('*')
        .single()
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product: data, omittedColumns })
  } catch (err) {
    console.error('[admin/products] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 }
    )
  }
}
