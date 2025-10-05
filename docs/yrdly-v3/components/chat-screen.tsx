"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Phone, Video, MoreVertical, Smile } from "lucide-react"

interface ChatScreenProps {
  contactName: string
  contactAvatar: string
  contactInitials: string
  onBack: () => void
}

export function ChatScreen({ contactName, contactAvatar, contactInitials, onBack }: ChatScreenProps) {
  const [message, setMessage] = useState("")

  const messages = [
    {
      id: 1,
      text: "Hey! Thanks for organizing the art festival! 🎨",
      sender: "them",
      time: "2:30 PM",
      isRead: true,
    },
    {
      id: 2,
      text: "You're welcome! It was so much fun seeing everyone come together",
      sender: "me",
      time: "2:32 PM",
      isRead: true,
    },
    {
      id: 3,
      text: "The kids especially loved the face painting station",
      sender: "them",
      time: "2:33 PM",
      isRead: true,
    },
    {
      id: 4,
      text: "Yes! And the local artists were amazing. We should definitely do this again next year",
      sender: "me",
      time: "2:35 PM",
      isRead: true,
    },
    {
      id: 5,
      text: "I'm already thinking of ideas for next time",
      sender: "them",
      time: "2:36 PM",
      isRead: false,
    },
  ]

  const handleSend = () => {
    if (message.trim()) {
      // Handle sending message
      setMessage("")
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Chat Header */}
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white/95 backdrop-blur-sm border-b border-border z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="p-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={contactAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{contactInitials}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{contactName}</h3>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 pt-20 pb-20 px-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] ${msg.sender === "me" ? "order-2" : "order-1"}`}>
              <Card
                className={`p-3 ${
                  msg.sender === "me" ? "bg-primary text-primary-foreground ml-auto" : "bg-card text-foreground"
                } yrdly-shadow`}
              >
                <p className="text-sm">{msg.text}</p>
              </Card>
              <p className={`text-xs text-muted-foreground mt-1 ${msg.sender === "me" ? "text-right" : "text-left"}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white/95 backdrop-blur-sm border-t border-border z-50">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Smile className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                className="bg-card border-border focus:border-primary"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSend}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
