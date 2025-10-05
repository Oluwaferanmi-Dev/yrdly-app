"use client"

import { HomeScreen } from "@/components/home-screen"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  const handleViewProfile = (user: any) => {
    router.push(`/profile/${user.id}`)
  }

  return <HomeScreen onViewProfile={handleViewProfile} />
}
