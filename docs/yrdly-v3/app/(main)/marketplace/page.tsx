"use client"

import { useState } from "react"
import { MarketplaceScreen } from "@/components/marketplace-screen"
import { SellItemModal } from "@/components/sell-item-modal"
import { useRouter } from "next/navigation"

export default function MarketplacePage() {
  const router = useRouter()
  const [showSellItemModal, setShowSellItemModal] = useState(false)

  const handleItemClick = (item: any) => {
    router.push(`/marketplace/${item.id}`)
  }

  const handleMessageSeller = (item: any) => {
    router.push(`/marketplace/${item.id}/chat`)
  }

  return (
    <>
      <MarketplaceScreen
        onSellItem={() => setShowSellItemModal(true)}
        onItemClick={handleItemClick}
        onMessageSeller={handleMessageSeller}
      />
      <SellItemModal open={showSellItemModal} onOpenChange={setShowSellItemModal} />
    </>
  )
}
