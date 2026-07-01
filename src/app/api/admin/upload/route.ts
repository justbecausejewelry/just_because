import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server/security'

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const formData = await request.formData()
  const file = formData.get('file')
  const slug = String(formData.get('slug') || 'draft')
  const bucket = String(formData.get('bucket') || 'product-images')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 })
  }

  const isVideo = bucket === 'product-videos'
  const isRingSetting = bucket === 'ring-settings'
  const bucketName = isVideo ? 'product-videos' : isRingSetting ? 'ring-settings' : 'product-images'

  await auth.admin.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024,
    allowedMimeTypes: isVideo
      ? ['video/mp4', 'video/quicktime', 'video/webm']
      : ['image/png', 'image/jpeg', 'image/webp'],
  })

  const folder = isRingSetting ? 'settings' : 'products'
  const path = `${folder}/${safeName(slug)}/${Date.now()}-${safeName(file.name)}`
  const { error } = await auth.admin.storage
    .from(bucketName)
    .upload(path, file, { upsert: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = auth.admin.storage.from(bucketName).getPublicUrl(path)

  return NextResponse.json({ publicUrl, path })
}
