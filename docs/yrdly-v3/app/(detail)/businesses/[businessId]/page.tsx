"use client"

import { BusinessDetailScreen } from "@/components/business-detail-screen"
import { useRouter, useParams } from "next/navigation"
import { businesses } from "@/lib/mock-data"

export default function BusinessDetailPage() {
  const router = useRouter()
  const params = useParams()
  const businessId = params.businessId as string

  const business = businesses.find((b) => b.id === businessId)

  if (!business) {
    return <div className="p-4">Business not found</div>
  }

  const handleMessageOwner = (business: any, item?: any) => {
    if (item) {
      router.push(`/businesses/${businessId}/catalog/${item.id}/chat`)
    } else {
      router.push(`/businesses/${businessId}/chat`)
    }
  }

  const handleViewCatalogItem = (item: any) => {
    router.push(`/businesses/${businessId}/catalog/${item.id}`)
  }

  return (
    <BusinessDetailScreen
      business={business}
      onBack={() => router.push("/businesses")}
      onMessageOwner={handleMessageOwner}
      onViewCatalogItem={handleViewCatalogItem}
    />
  )
}
