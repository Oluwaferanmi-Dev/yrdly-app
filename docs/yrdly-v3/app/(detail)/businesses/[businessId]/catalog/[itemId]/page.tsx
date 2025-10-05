"use client"

import { CatalogItemDetailScreen } from "@/components/catalog-item-detail-screen"
import { useRouter, useParams } from "next/navigation"
import { businesses } from "@/lib/mock-data"

export default function CatalogItemDetailPage() {
  const router = useRouter()
  const params = useParams()
  const businessId = params.businessId as string
  const itemId = params.itemId as string

  const business = businesses.find((b) => b.id === businessId)
  const item = business?.catalog.find((i) => i.id === itemId)

  if (!business || !item) {
    return <div className="p-4">Item not found</div>
  }

  const handleMessageOwner = (business: any, item: any) => {
    router.push(`/businesses/${businessId}/catalog/${itemId}/chat`)
  }

  return (
    <CatalogItemDetailScreen
      item={item}
      business={business}
      onBack={() => router.push(`/businesses/${businessId}`)}
      onMessageOwner={handleMessageOwner}
    />
  )
}
