'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProductForm } from '@/components/admin/ProductForm'
import { adminFetch } from '@/lib/adminSession'

type ProductPayload = {
  product?: Record<string, unknown>
  error?: string
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>()
  const [product, setProduct] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const response = await adminFetch(`/api/admin/products/${params.id}`)
      const payload = (await response.json()) as ProductPayload
      if (!response.ok || !payload.product) {
        setError(payload.error || 'Product not found.')
        return
      }
      setProduct(payload.product)
    }
    void load()
  }, [params.id])

  if (error) {
    return <main className="p-6 lg:p-8" style={{ color: '#A85C6A', fontFamily: 'var(--font-inter)' }}>{error}</main>
  }

  if (!product) {
    return <main className="p-6 lg:p-8" style={{ color: '#B8A090', fontFamily: 'var(--font-inter)' }}>Loading product...</main>
  }

  return (
    <main className="p-6 lg:p-8">
      <ProductForm mode="edit" product={product} />
    </main>
  )
}
