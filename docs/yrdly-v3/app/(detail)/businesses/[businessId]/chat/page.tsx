"use client"

import { BusinessChatScreen } from "@/components/business-chat-screen"
import { useRouter, useParams } from "next/navigation"
import { businesses } from "@/lib/mock-data"

export default function BusinessChatPage() {
  const router = useRouter()
  const params = useParams()
  const businessId = params.businessId as string

  const business = businesses.find((b) => b.id === businessId)

  if (!business) {
    return <div className="p-4">Business not found</div>
  }

  return <BusinessChatScreen business={business} onBack={() => router.push(`/businesses/${businessId}`)} />
}
