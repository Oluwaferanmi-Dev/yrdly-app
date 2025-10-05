"use client"

import { EditProfileScreen } from "@/components/edit-profile-screen"
import { useRouter } from "next/navigation"

export default function EditProfilePage() {
  const router = useRouter()

  return <EditProfileScreen onBack={() => router.push("/settings")} />
}
