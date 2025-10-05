"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Star,
  Edit,
  Share,
  MessageCircle,
  Heart,
  ShoppingBag,
  Briefcase,
  CalendarDays,
} from "lucide-react"
import type { User, Post, MarketplaceItem, Business } from "@/lib/types"

interface ProfileScreenProps {
  onBack: () => void
  user?: User
  isOwnProfile?: boolean
}

export function ProfileScreen({ onBack, user, isOwnProfile = true }: ProfileScreenProps) {
  const profileData = user || {
    id: "currentUser",
    name: "John Doe",
    avatar: "/diverse-user-avatars.png",
    initials: "JD",
    location: "Victoria Island, Lagos",
    joinDate: "March 2024",
    bio: "Community enthusiast and event organizer. Love bringing neighbors together through art, food, and fun activities. Always happy to help with local initiatives and connect with fellow residents.",
    interests: ["Art & Culture", "Community Events", "Gardening", "Photography", "Cooking", "Local Business"],
    stats: {
      neighbors: 24,
      events: 8,
      rating: 4.9,
    },
    isFriend: false,
    isOnline: true,
  }

  const userPosts: Post[] = [
    {
      id: "1",
      userId: profileData.id,
      userName: profileData.name,
      userAvatar: profileData.avatar,
      content: "Excited to announce our community art festival! 🎨",
      timestamp: "2 hours ago",
      likes: 24,
      type: "event",
      comments: [],
    },
  ]

  const userItems: MarketplaceItem[] = [
    {
      id: "1",
      title: "Vintage Dining Table",
      description: "Beautiful vintage dining table with 4 chairs",
      price: 45000,
      condition: "good",
      category: "Furniture",
      images: ["/vintage-furniture-collection.png"],
      sellerId: profileData.id,
      sellerName: profileData.name,
      sellerAvatar: profileData.avatar,
      sellerRating: 4.9,
      location: profileData.location,
      distance: "0.5 km away",
      postedDate: "2 days ago",
      views: 45,
      isFavorite: false,
    },
  ]

  const userBusinesses: Business[] = [
    {
      id: "1",
      name: "Tech Haven Electronics",
      description: "Your one-stop shop for all electronics",
      category: "Electronics",
      coverImage: "/electronics-store-interior.png",
      logo: "/abstract-tech-logo.png",
      rating: 4.8,
      reviewCount: 124,
      hours: "Mon-Sat: 9AM-8PM",
      phone: "+234 123 456 7890",
      location: profileData.location,
      distance: "0.3 km away",
      ownerId: profileData.id,
      ownerName: profileData.name,
      ownerAvatar: profileData.avatar,
      catalog: [],
    },
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Profile</h2>
      </div>

      {/* Profile Header */}
      <Card className="p-6 yrdly-shadow">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profileData.avatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {profileData.initials}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">{profileData.name}</h3>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{profileData.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Joined {profileData.joinDate}</span>
            </div>
          </div>

          {isOwnProfile && (
            <div className="flex items-center gap-4">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" className="border-border bg-transparent">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center yrdly-shadow">
          <div className="space-y-2">
            <Users className="w-6 h-6 mx-auto text-primary" />
            <p className="text-2xl font-bold text-foreground">{profileData.stats.neighbors}</p>
            <p className="text-sm text-muted-foreground">Neighbors</p>
          </div>
        </Card>

        <Card className="p-4 text-center yrdly-shadow">
          <div className="space-y-2">
            <Calendar className="w-6 h-6 mx-auto text-accent" />
            <p className="text-2xl font-bold text-foreground">{profileData.stats.events}</p>
            <p className="text-sm text-muted-foreground">Events</p>
          </div>
        </Card>

        <Card className="p-4 text-center yrdly-shadow">
          <div className="space-y-2">
            <Star className="w-6 h-6 mx-auto text-yellow-500" />
            <p className="text-2xl font-bold text-foreground">{profileData.stats.rating}</p>
            <p className="text-sm text-muted-foreground">Rating</p>
          </div>
        </Card>
      </div>

      {/* About */}
      <Card className="p-6 yrdly-shadow">
        <h4 className="font-semibold text-foreground mb-3">About</h4>
        <p className="text-muted-foreground leading-relaxed">{profileData.bio}</p>
      </Card>

      {/* Interests */}
      <Card className="p-6 yrdly-shadow">
        <h4 className="font-semibold text-foreground mb-3">Interests</h4>
        <div className="flex flex-wrap gap-2">
          {profileData.interests.map((interest, index) => (
            <Badge key={index} className="bg-primary/10 text-primary hover:bg-primary/20">
              {interest}
            </Badge>
          ))}
        </div>
      </Card>

      {isOwnProfile && (
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
            <TabsTrigger
              value="posts"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Heart className="w-4 h-4 mr-1" />
              Posts
            </TabsTrigger>
            <TabsTrigger
              value="items"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ShoppingBag className="w-4 h-4 mr-1" />
              Items
            </TabsTrigger>
            <TabsTrigger
              value="businesses"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Briefcase className="w-4 h-4 mr-1" />
              Business
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <CalendarDays className="w-4 h-4 mr-1" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-3 mt-4">
            {userPosts.map((post) => (
              <Card key={post.id} className="p-4 yrdly-shadow">
                <p className="text-foreground mb-2">{post.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {post.likes}
                  </span>
                  <span>{post.timestamp}</span>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="items" className="space-y-3 mt-4">
            {userItems.map((item) => (
              <Card key={item.id} className="p-4 yrdly-shadow">
                <div className="flex gap-3">
                  <img
                    src={item.images[0] || "/placeholder.svg"}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                    <p className="text-accent font-bold">₦{item.price.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{item.postedDate}</p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="businesses" className="space-y-3 mt-4">
            {userBusinesses.map((business) => (
              <Card key={business.id} className="p-4 yrdly-shadow">
                <div className="flex gap-3">
                  <img
                    src={business.logo || "/placeholder.svg"}
                    alt={business.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{business.name}</h4>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-foreground">{business.rating}</span>
                      <span className="text-muted-foreground">({business.reviewCount})</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{business.category}</p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="events" className="space-y-3 mt-4">
            <div className="text-center py-8">
              <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No events posted yet</p>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {!isOwnProfile && (
        <div className="flex gap-3">
          {profileData.isFriend ? (
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
          ) : (
            <>
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                <Users className="w-4 h-4 mr-2" />
                Add Friend
              </Button>
              <Button variant="outline" className="flex-1 border-border bg-transparent">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
