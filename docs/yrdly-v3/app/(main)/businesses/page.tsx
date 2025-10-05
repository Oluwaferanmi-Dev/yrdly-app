"use client"

import { useState } from "react"
import { BusinessesScreen } from "@/components/businesses-screen"
import { CreateBusinessModal } from "@/components/create-business-modal"
import { useRouter } from "next/navigation"

export default function BusinessesPage() {
  const router = useRouter()
  const [showCreateBusinessModal, setShowCreateBusinessModal] = useState(false)

  const handleVisitBusiness = (business: any) => {
    router.push(`/businesses/${business.id}`)
  }

  return (
    <>
      <BusinessesScreen
        onCreateBusiness={() => setShowCreateBusinessModal(true)}
        onVisitBusiness={handleVisitBusiness}
      />
      <CreateBusinessModal open={showCreateBusinessModal} onOpenChange={setShowCreateBusinessModal} />
    </>
  )
}
