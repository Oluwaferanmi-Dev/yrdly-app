"use client"

import { BusinessChatScreen } from "@/components/business-chat-screen"
import { useRouter, useParams } from "next/navigation"
import { businesses } from "@/lib/mock-data"

export default function CatalogItemChatPage() {
  const router = useRouter()
  const params = useParams()
  const businessId = params.businessId as string
  const itemId = params.itemId as string

  const business = businesses.find((b) => b.id === businessId)
  const item = business?.catalog.find((i) => i.id === itemId)

  if (!business) {
    return <div className="p-4">Business not found</div>
  }

  return (
    <BusinessChatScreen
      business={business}
      item={item}
      onBack={() => router.push(`/businesses/${businessId}/catalog/${itemId}`)}
    />
  )
}
