"use client"

import { ProfileScreen } from "@/components/profile-screen"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()

  return <ProfileScreen onBack={() => router.push("/")} isOwnProfile={true} />
}
