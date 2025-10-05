"use client"

import { ProfileScreen } from "@/components/profile-screen"
import { useRouter, useParams } from "next/navigation"
import { mockUsers } from "@/lib/mock-data"

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const user = mockUsers.find((u) => u.id === userId)

  return <ProfileScreen onBack={() => router.back()} user={user} isOwnProfile={false} />
}
