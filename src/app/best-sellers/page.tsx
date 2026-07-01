import { ProductCollectionPage } from '@/components/products/ProductCollectionPage'

export default function BestSellersPage() {
  return (
    <ProductCollectionPage
      title="Best Sellers"
      subtitle="Loved by everyone. For good reason."
      query="bestSeller=true&limit=120"
      emptyTitle="No best sellers yet"
      emptyText="Mark products as best sellers in admin and they will appear here."
    />
  )
}
