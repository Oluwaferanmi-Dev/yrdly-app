"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, X, MapPin } from "lucide-react"
import type { User } from "@/lib/types"

interface UserSearchDialogProps {
  onClose: () => void
  onViewProfile: (user: User) => void
}

export function UserSearchDialog({ onClose, onViewProfile }: UserSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const users: User[] = [
    {
      id: "1",
      name: "Boluwatife Lasisi",
      avatar: "/placeholder.svg?key=bl123",
      initials: "BL",
      location: "Dawakin Kudu, Kano",
      joinDate: "March 2024",
      bio: "Community organizer and local business owner",
      interests: ["Community Events", "Business", "Art"],
      stats: { neighbors: 45, events: 12, rating: 4.8 },
      isFriend: false,
      isOnline: true,
    },
    {
      id: "2",
      name: "Caleb Oyelowo",
      avatar: "/placeholder.svg?key=co456",
      initials: "CO",
      location: "Lagos",
      joinDate: "February 2024",
      bio: "Software developer and tech enthusiast",
      interests: ["Technology", "Gaming", "Photography"],
      stats: { neighbors: 32, events: 8, rating: 4.9 },
      isFriend: false,
      isOnline: false,
    },
    {
      id: "3",
      name: "Adaora Mbachu",
      avatar: "/placeholder.svg?key=am789",
      initials: "AM",
      location: "Abuja",
      joinDate: "April 2024",
      bio: "Graphic designer and artist",
      interests: ["Art & Culture", "Design", "Music"],
      stats: { neighbors: 28, events: 15, rating: 5.0 },
      isFriend: true,
      isOnline: true,
    },
  ]

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="w-full max-w-2xl mx-auto bg-background rounded-t-xl sm:rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="Search for neighbors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 focus-visible:ring-0 px-0"
            autoFocus
          />
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="p-4 yrdly-shadow cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  onViewProfile(user)
                  onClose()
                }}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 flex-shrink-0">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-foreground truncate">{user.name}</h4>
                      {user.isOnline && <Badge className="bg-green-500 text-white flex-shrink-0">Online</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{user.location}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
