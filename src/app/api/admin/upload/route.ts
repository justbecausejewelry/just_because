import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file')
  const slug = String(formData.get('slug') || 'draft')
  const bucket = String(formData.get('bucket') || 'product-images')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 })
  }

  const isVideo = bucket === 'product-videos'
  const bucketName = isVideo ? 'product-videos' : 'product-images'

  await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024,
    allowedMimeTypes: isVideo
      ? ['video/mp4', 'video/quicktime', 'video/webm']
      : ['image/png', 'image/jpeg', 'image/webp'],
  })

  const path = `products/${safeName(slug)}/${Date.now()}-${safeName(file.name)}`
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(path, file, { upsert: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(path)

  return NextResponse.json({ publicUrl, path })
}
