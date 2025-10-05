"use client"

import { ItemDetailScreen } from "@/components/item-detail-screen"
import { useRouter, useParams } from "next/navigation"
import { marketplaceItems } from "@/lib/mock-data"

export default function ItemDetailPage() {
  const router = useRouter()
  const params = useParams()
  const itemId = params.itemId as string

  const item = marketplaceItems.find((i) => i.id === itemId)

  if (!item) {
    return <div className="p-4">Item not found</div>
  }

  const handleMessageSeller = (item: any) => {
    router.push(`/marketplace/${item.id}/chat`)
  }

  return (
    <ItemDetailScreen item={item} onBack={() => router.push("/marketplace")} onMessageSeller={handleMessageSeller} />
  )
}
