"use client"

import { ChatScreen } from "@/components/chat-screen"
import { useRouter, useParams } from "next/navigation"

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const chatId = params.chatId as string

  const contact = {
    name: "Sarah Johnson",
    avatar: "/diverse-user-avatars.png",
    initials: "SJ",
  }

  return (
    <ChatScreen
      contactName={contact.name}
      contactAvatar={contact.avatar}
      contactInitials={contact.initials}
      onBack={() => router.push("/messages")}
    />
  )
}
