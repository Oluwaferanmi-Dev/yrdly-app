"use client"

import { LocationSettingsScreen } from "@/components/location-settings-screen"
import { useRouter } from "next/navigation"

export default function LocationSettingsPage() {
  const router = useRouter()

  return <LocationSettingsScreen onBack={() => router.push("/settings")} />
}
