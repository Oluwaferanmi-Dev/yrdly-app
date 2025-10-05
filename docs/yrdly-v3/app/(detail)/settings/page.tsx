"use client"

import { SettingsScreen } from "@/components/settings-screen"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()

  return (
    <SettingsScreen
      onBack={() => router.push("/")}
      onEditProfile={() => router.push("/settings/edit-profile")}
      onLocationSettings={() => router.push("/settings/location")}
    />
  )
}
