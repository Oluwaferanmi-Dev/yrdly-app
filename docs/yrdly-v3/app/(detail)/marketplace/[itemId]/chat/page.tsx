"use client"

import { ItemChatScreen } from "@/components/item-chat-screen"
import { useRouter, useParams } from "next/navigation"
import { marketplaceItems } from "@/lib/mock-data"

export default function ItemChatPage() {
  const router = useRouter()
  const params = useParams()
  const itemId = params.itemId as string

  const item = marketplaceItems.find((i) => i.id === itemId)

  if (!item) {
    return <div className="p-4">Item not found</div>
  }

  return <ItemChatScreen item={item} onBack={() => router.push(`/marketplace/${itemId}`)} />
}
