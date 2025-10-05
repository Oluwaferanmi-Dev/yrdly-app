"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Smile, MoreVertical } from "lucide-react"
import type { Business, CatalogItem, BusinessMessage } from "@/lib/types"
import { useState } from "react"

interface BusinessChatScreenProps {
  business: Business
  item?: CatalogItem
  onBack: () => void
}

export function BusinessChatScreen({ business, item, onBack }: BusinessChatScreenProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<BusinessMessage[]>([
    {
      id: "1",
      businessId: business.id,
      senderId: "user1",
      senderName: "You",
      senderAvatar: "/placeholder.svg?height=40&width=40",
      content: item ? `Hi, I'm interested in the ${item.title}` : "Hi, I have a question about your business",
      timestamp: "10:30 AM",
      isRead: true,
    },
    {
      id: "2",
      businessId: business.id,
      senderId: business.ownerId,
      senderName: business.ownerName,
      senderAvatar: business.ownerAvatar,
      content: "Hello! Thank you for your interest. How can I help you?",
      timestamp: "10:32 AM",
      isRead: true,
    },
  ])

  const handleSend = () => {
    if (!message.trim()) return

    const newMessage: BusinessMessage = {
      id: Date.now().toString(),
      businessId: business.id,
      senderId: "user1",
      senderName: "You",
      senderAvatar: "/placeholder.svg?height=40&width=40",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isRead: false,
    }

    setMessages([...messages, newMessage])
    setMessage("")
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
          <img src={business.logo || "/placeholder.svg"} alt={business.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{business.name}</h2>
          <p className="text-sm text-muted-foreground truncate">{business.category}</p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Item context (if discussing a specific item) */}
      {item && (
        <div className="p-4 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">Discussing this item:</p>
          <Card className="p-3">
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                <img
                  src={item.images[0] || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground truncate">{item.title}</h4>
                <p className="text-lg font-bold text-primary">₦{item.price.toLocaleString()}</p>
                {!item.inStock && <p className="text-xs text-destructive">Out of stock</p>}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.senderId === "user1"
          return (
            <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={msg.senderAvatar || "/placeholder.svg"} />
                <AvatarFallback>{msg.senderName[0]}</AvatarFallback>
              </Avatar>
              <div className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? "items-end" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
                <span className="text-xs text-muted-foreground px-2">{msg.timestamp}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4 bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Smile className="w-5 h-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-background border-border"
          />
          <Button
            size="icon"
            className="flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSend}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
