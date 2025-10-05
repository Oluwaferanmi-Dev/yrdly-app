"use client"

import { CommunityScreen } from "@/components/community-screen"
import { useRouter } from "next/navigation"

export default function CommunityPage() {
  const router = useRouter()

  const handleViewProfile = (user: any) => {
    router.push(`/profile/${user.id}`)
  }

  return <CommunityScreen onViewProfile={handleViewProfile} />
}
