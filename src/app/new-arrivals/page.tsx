import { ProductCollectionPage } from '@/components/products/ProductCollectionPage'

export default function NewArrivalsPage() {
  return (
    <ProductCollectionPage
      title="New Arrivals"
      subtitle="Just landed. Already loved."
      query="newArrival=true&sort=newest&limit=120"
      emptyTitle="No new arrivals yet"
      emptyText="Fresh pieces will appear here as soon as they are added."
    />
  )
}
