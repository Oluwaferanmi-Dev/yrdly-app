"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MessageCircle, Store, Users, ShoppingBag } from "lucide-react"
import type { Conversation } from "@/lib/types"
import Link from "next/link"

interface MessagesScreenProps {
  onOpenChat?: (conversation: Conversation) => void
}

export function MessagesScreen({ onOpenChat }: MessagesScreenProps) {
  const [activeTab, setActiveTab] = useState<"all" | "friends" | "marketplace" | "businesses">("friends")
  const [searchQuery, setSearchQuery] = useState("")

  const allConversations: Conversation[] = [
    {
      id: "1",
      type: "friend",
      participantId: "user1",
      participantName: "Feranmi Oyelowo",
      participantAvatar: "/placeholder.svg?key=fo123",
      lastMessage: "Thanks for organizing the art festival! 🎨",
      timestamp: "2m ago",
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: "2",
      type: "marketplace",
      participantId: "user2",
      participantName: "Opiah David",
      participantAvatar: "/placeholder.svg?key=od456",
      lastMessage: "Is the dining set still available?",
      timestamp: "1h ago",
      unreadCount: 0,
      isOnline: false,
      context: {
        itemId: "item1",
        itemTitle: "Vintage Dining Set",
        itemImage: "/placeholder.svg?height=100&width=100",
        itemPrice: 45000,
      },
    },
    {
      id: "3",
      type: "friend",
      participantId: "user3",
      participantName: "Boluwatife Lasisi",
      participantAvatar: "/placeholder.svg?key=bl789",
      lastMessage: "Welcome to the neighborhood! 👋",
      timestamp: "3h ago",
      unreadCount: 0,
      isOnline: true,
    },
    {
      id: "4",
      type: "business",
      participantId: "business1",
      participantName: "Sarah's Bakery",
      participantAvatar: "/placeholder.svg?key=bakery",
      lastMessage: "Your order is ready for pickup!",
      timestamp: "5h ago",
      unreadCount: 1,
      isOnline: true,
      context: {
        businessId: "biz1",
        businessName: "Sarah's Bakery",
        businessLogo: "/placeholder.svg?height=100&width=100",
      },
    },
    {
      id: "5",
      type: "marketplace",
      participantId: "user4",
      participantName: "Caleb Oyelowo",
      participantAvatar: "/placeholder.svg?key=co012",
      lastMessage: "Can we meet tomorrow at 3pm?",
      timestamp: "1d ago",
      unreadCount: 0,
      isOnline: false,
      context: {
        itemId: "item2",
        itemTitle: "Mountain Bike",
        itemImage: "/placeholder.svg?height=100&width=100",
        itemPrice: 85000,
      },
    },
    {
      id: "6",
      type: "business",
      participantId: "business2",
      participantName: "Green Thumb Garden Center",
      participantAvatar: "/placeholder.svg?key=garden",
      lastMessage: "We have new plants in stock!",
      timestamp: "2d ago",
      unreadCount: 0,
      isOnline: false,
      context: {
        businessId: "biz2",
        businessName: "Green Thumb Garden Center",
        businessLogo: "/placeholder.svg?height=100&width=100",
      },
    },
  ]

  const filteredConversations = allConversations.filter((conv) => {
    const matchesTab =
      activeTab === "all" ||
      conv.type === activeTab.slice(0, -1) ||
      (activeTab === "friends" && conv.type === "friend") ||
      (activeTab === "marketplace" && conv.type === "marketplace") ||
      (activeTab === "businesses" && conv.type === "business")

    const matchesSearch =
      searchQuery === "" ||
      conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesTab && matchesSearch
  })

  const unreadCounts = {
    all: allConversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
    friends: allConversations.filter((c) => c.type === "friend").reduce((sum, conv) => sum + conv.unreadCount, 0),
    marketplace: allConversations
      .filter((c) => c.type === "marketplace")
      .reduce((sum, conv) => sum + conv.unreadCount, 0),
    businesses: allConversations.filter((c) => c.type === "business").reduce((sum, conv) => sum + conv.unreadCount, 0),
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 space-y-4 border-b border-border bg-card">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Messages</h2>
          <p className="text-sm text-muted-foreground">Stay connected with your community</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border focus:border-primary"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="friends" className="text-xs relative">
              <Users className="w-4 h-4 mr-1" />
              Friends
              {unreadCounts.friends > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                  {unreadCounts.friends}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="text-xs relative">
              <ShoppingBag className="w-4 h-4 mr-1" />
              Market
              {unreadCounts.marketplace > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                  {unreadCounts.marketplace}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="businesses" className="text-xs relative">
              <Store className="w-4 h-4 mr-1" />
              Business
              {unreadCounts.businesses > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                  {unreadCounts.businesses}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs relative">
              All
              {unreadCounts.all > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                  {unreadCounts.all}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No conversations yet</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No conversations match your search"
                : "Start chatting with neighbors, sellers, or businesses"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <Link key={conversation.id} href={`/messages/${conversation.id}`}>
              <Card className="p-4 yrdly-shadow hover:shadow-lg transition-all cursor-pointer hover:border-primary/50">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conversation.participantAvatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {conversation.participantName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                    <div className="absolute -top-1 -right-1">
                      {conversation.type === "marketplace" && (
                        <div className="w-5 h-5 bg-accent text-accent-foreground rounded-full flex items-center justify-center">
                          <ShoppingBag className="w-3 h-3" />
                        </div>
                      )}
                      {conversation.type === "business" && (
                        <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                          <Store className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-foreground truncate">{conversation.participantName}</h4>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{conversation.timestamp}</span>
                    </div>

                    {conversation.context &&
                      (conversation.type === "marketplace" || conversation.type === "business") && (
                        <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-lg">
                          <img
                            src={
                              conversation.context.itemImage || conversation.context.businessLogo || "/placeholder.svg"
                            }
                            alt=""
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {conversation.context.itemTitle || conversation.context.businessName}
                            </p>
                            {conversation.context.itemPrice && (
                              <p className="text-xs font-semibold text-primary">
                                ₦{conversation.context.itemPrice.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                  </div>

                  {/* Unread badge */}
                  {conversation.unreadCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground flex-shrink-0">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
