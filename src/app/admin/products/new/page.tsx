import { ProductForm } from '@/components/admin/ProductForm'

export default function NewProductPage() {
  return (
    <main className="p-6 lg:p-8">
      <ProductForm mode="new" />
    </main>
  )
}
