"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { UserSearchDialog } from "@/components/user-search-dialog"
import { MapPin, Calendar, Heart, MessageCircle, Share, Search, Users, TrendingUp, Bell } from "lucide-react"
import type { CommunityPost, User } from "@/lib/types"

interface CommunityScreenProps {
  onViewProfile?: (user: User) => void
}

export function CommunityScreen({ onViewProfile }: CommunityScreenProps) {
  const [showUserSearch, setShowUserSearch] = useState(false)

  const communityPosts: CommunityPost[] = [
    {
      id: "1",
      type: "event",
      userId: "user1",
      userName: "Feranmi Oyelowo",
      userAvatar: "/community-organizer-meeting.png",
      title: "Community Art Festival This Weekend",
      content:
        "Join us for our annual art festival featuring local artists, live music, and food vendors. Free entry for all residents!",
      timestamp: "2 hours ago",
      likes: 45,
      comments: 12,
      location: "Victoria Island Community Center",
      metadata: {
        eventDate: "March 15, 2024 at 2:00 PM",
        eventLocation: "Victoria Island Community Center",
        category: "Arts & Culture",
      },
    },
    {
      id: "2",
      type: "announcement",
      userId: "admin",
      userName: "Community Admin",
      userAvatar: "/placeholder.svg?key=admin",
      title: "New Recycling Program Starting Next Month",
      content:
        "We're excited to announce a new community-wide recycling initiative. Collection bins will be placed at key locations starting April 1st.",
      timestamp: "5 hours ago",
      likes: 78,
      comments: 23,
      location: "Victoria Island",
    },
    {
      id: "3",
      type: "discussion",
      userId: "user3",
      userName: "Boluwatife Lasisi",
      userAvatar: "/neighbor-profile.jpg",
      title: "Best Local Coffee Shops?",
      content:
        "New to the area and looking for recommendations on the best coffee shops nearby. What are your favorites?",
      timestamp: "1 day ago",
      likes: 34,
      comments: 56,
      location: "Victoria Island",
    },
  ]

  const handleViewProfile = (user: User) => {
    if (onViewProfile) {
      onViewProfile(user)
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Page Header */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Community</h2>
          <p className="text-muted-foreground">What's happening in your neighborhood</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for neighbors..."
            className="pl-10"
            onClick={() => setShowUserSearch(true)}
            readOnly
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center yrdly-shadow">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-lg font-bold text-foreground">1,247</div>
          <div className="text-xs text-muted-foreground">Neighbors</div>
        </Card>
        <Card className="p-4 text-center yrdly-shadow">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <div className="text-lg font-bold text-foreground">89</div>
          <div className="text-xs text-muted-foreground">Active Today</div>
        </Card>
        <Card className="p-4 text-center yrdly-shadow">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
            <Bell className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-lg font-bold text-foreground">12</div>
          <div className="text-xs text-muted-foreground">New Posts</div>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Community Feed</h3>

        {communityPosts.map((post) => (
          <Card key={post.id} className="p-4 yrdly-shadow">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={post.userAvatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {post.userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground truncate">{post.userName}</h4>
                  {post.type === "event" && (
                    <Badge className="bg-primary text-primary-foreground flex-shrink-0">Event</Badge>
                  )}
                  {post.type === "announcement" && (
                    <Badge className="bg-accent text-accent-foreground flex-shrink-0">Announcement</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{post.timestamp}</p>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <h3 className="font-semibold text-foreground">{post.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{post.content}</p>

              {post.metadata?.eventDate && (
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-foreground">{post.metadata.eventDate}</span>
                  </div>
                  {post.metadata.eventLocation && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{post.metadata.eventLocation}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{post.location}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-border">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                <Heart className="w-4 h-4 mr-1" />
                <span className="text-sm">{post.likes}</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                <MessageCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">{post.comments}</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent">
                <Share className="w-4 h-4 mr-1" />
                <span className="text-sm">Share</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* User Search Dialog */}
      {showUserSearch && (
        <UserSearchDialog onClose={() => setShowUserSearch(false)} onViewProfile={handleViewProfile} />
      )}
    </div>
  )
}
