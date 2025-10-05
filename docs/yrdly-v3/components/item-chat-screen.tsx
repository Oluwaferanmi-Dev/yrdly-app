"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Smile, MoreVertical } from "lucide-react"
import type { MarketplaceItem, ItemMessage } from "@/lib/types"

interface ItemChatScreenProps {
  item: MarketplaceItem
  onBack: () => void
}

export function ItemChatScreen({ item, onBack }: ItemChatScreenProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ItemMessage[]>([
    {
      id: "1",
      itemId: item.id,
      senderId: "current-user",
      senderName: "You",
      senderAvatar: "/placeholder.svg?key=currentuser",
      content: "Hi! Is this item still available?",
      timestamp: "10:30 AM",
      isRead: true,
    },
    {
      id: "2",
      itemId: item.id,
      senderId: item.sellerId,
      senderName: item.sellerName,
      senderAvatar: item.sellerAvatar,
      content: "Yes, it's still available! Would you like to come see it?",
      timestamp: "10:32 AM",
      isRead: true,
    },
  ])

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage: ItemMessage = {
      id: Date.now().toString(),
      itemId: item.id,
      senderId: "current-user",
      senderName: "You",
      senderAvatar: "/placeholder.svg?key=currentuser",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isRead: false,
    }

    setMessages([...messages, newMessage])
    setMessage("")
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={item.sellerAvatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {item.sellerName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{item.sellerName}</h3>
            <p className="text-xs text-muted-foreground">Active now</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="flex-shrink-0">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Item Preview Card */}
      <div className="p-4 border-b border-border bg-muted/30">
        <Card className="p-3 yrdly-shadow">
          <div className="flex gap-3">
            <img
              src={item.images[0] || "/placeholder.svg"}
              alt={item.title}
              className="w-16 h-16 rounded object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground truncate">{item.title}</h4>
              <p className="text-lg font-bold text-primary">
                {item.condition === "free" ? "FREE" : `₦${item.price.toLocaleString()}`}
              </p>
              <Badge variant="secondary" className="text-xs">
                {item.condition === "free" ? "Free" : item.condition.replace("-", " ")}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isCurrentUser = msg.senderId === "current-user"
          return (
            <div key={msg.id} className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
              {!isCurrentUser && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={msg.senderAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {msg.senderName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`flex flex-col gap-1 max-w-[75%] ${isCurrentUser ? "items-end" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isCurrentUser
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card text-foreground rounded-tl-sm yrdly-shadow"
                  }`}
                >
                  <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                </div>
                <span className="text-xs text-muted-foreground px-2">{msg.timestamp}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Smile className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 bg-background border-border focus:border-primary"
          />
          <Button
            size="icon"
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
