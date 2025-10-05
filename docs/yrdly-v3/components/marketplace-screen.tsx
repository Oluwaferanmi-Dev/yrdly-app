"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Search, Plus } from "lucide-react"
import type { MarketplaceItem } from "@/lib/types"

interface MarketplaceScreenProps {
  onSellItem: () => void
  onItemClick: (item: MarketplaceItem) => void
  onMessageSeller: (item: MarketplaceItem) => void
}

export function MarketplaceScreen({ onSellItem, onItemClick, onMessageSeller }: MarketplaceScreenProps) {
  const items: MarketplaceItem[] = [
    {
      id: "1",
      title: "anime girls",
      description:
        "Beautiful anime artwork collection. High quality prints on premium paper. Perfect for collectors or as a gift for anime fans.",
      price: 10000,
      condition: "like-new",
      category: "Art & Collectibles",
      images: ["/anime-girl-artwork.jpg", "/anime-art-2.jpg", "/anime-art-3.jpg"],
      sellerId: "seller1",
      sellerName: "Feranmi Oyelowo",
      sellerAvatar: "/placeholder.svg?key=seller1",
      sellerRating: 4.8,
      location: "Ikeja, Lagos",
      distance: "2.3 km away",
      postedDate: "25 Sept 2025",
      views: 45,
      isFavorite: false,
    },
    {
      id: "2",
      title: "Ewa Agoyin",
      description:
        "Delicious hot beans with special sauce, meat and kpomo. Freshly prepared daily. Perfect for lunch or dinner. Available for delivery within the neighborhood.",
      price: 1500,
      condition: "new",
      category: "Food & Drinks",
      images: ["/ewa-agoyin-beans-with-sauce.jpg", "/nigerian-food-beans.jpg"],
      sellerId: "seller2",
      sellerName: "Opiah David",
      sellerAvatar: "/placeholder.svg?key=seller2",
      sellerRating: 4.9,
      location: "Yaba, Lagos",
      distance: "1.5 km away",
      postedDate: "25 Sept 2025",
      views: 78,
      isFavorite: false,
    },
    {
      id: "3",
      title: "Vintage Dining Set",
      description:
        "Beautiful vintage table with 4 chairs. Solid wood construction. Some wear consistent with age but still very sturdy. Great for a family dining room.",
      price: 45000,
      condition: "good",
      category: "Furniture",
      images: ["/vintage-furniture-dining-set.jpg", "/vintage-dining-table.jpg", "/vintage-chairs.jpg"],
      sellerId: "seller3",
      sellerName: "Mike Johnson",
      sellerAvatar: "/placeholder.svg?key=seller3",
      sellerRating: 4.7,
      location: "Victoria Island, Lagos",
      distance: "5.2 km away",
      postedDate: "24 Sept 2025",
      views: 123,
      isFavorite: true,
    },
    {
      id: "4",
      title: "Office Chair",
      description:
        "Good condition ergonomic office chair. Adjustable height and back support. Pick up only from my location. First come, first served!",
      price: 0,
      condition: "free",
      category: "Furniture",
      images: ["/office-chair-ergonomic.jpg", "/office-chair-side.jpg"],
      sellerId: "seller4",
      sellerName: "Adaora Smith",
      sellerAvatar: "/placeholder.svg?key=seller4",
      sellerRating: 4.6,
      location: "Surulere, Lagos",
      distance: "3.8 km away",
      postedDate: "23 Sept 2025",
      views: 234,
      isFavorite: false,
    },
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">For Sale & Free</h2>
            <p className="text-muted-foreground">Buy and sell items in your neighborhood</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 yrdly-shadow" onClick={onSellItem}>
            <Plus className="w-4 h-4 mr-2" />
            Sell Item
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search For sale & free" className="pl-10 bg-card border-border focus:border-primary" />
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="p-0 overflow-hidden yrdly-shadow">
            <div className="relative cursor-pointer" onClick={() => onItemClick(item)}>
              <img
                src={item.images[0] || "/placeholder.svg"}
                alt={item.title}
                className="w-full aspect-square object-cover"
              />
              <Badge
                className={`absolute top-2 left-2 ${
                  item.condition === "free"
                    ? "bg-green-500 text-white"
                    : item.price > 20000
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary text-primary-foreground"
                }`}
              >
                {item.condition === "free" ? "FREE" : `₦${item.price.toLocaleString()}`}
              </Badge>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-white/80 hover:bg-white">
                <Heart className={`w-4 h-4 ${item.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            </div>
            <div className="p-3 space-y-2">
              <h4 className="font-semibold text-foreground text-sm cursor-pointer" onClick={() => onItemClick(item)}>
                {item.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5 flex-shrink-0">
                  <AvatarImage src={item.sellerAvatar || "/placeholder.svg"} />
                  <AvatarFallback
                    className={`text-xs ${
                      item.condition === "free" ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {item.sellerName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">{item.sellerName}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Posted {item.postedDate}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className={`flex-1 text-xs ${
                    item.condition === "free"
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : item.price > 20000
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                  onClick={() => onItemClick(item)}
                >
                  {item.condition === "free" ? "Claim Free" : `Buy Now - ₦${item.price.toLocaleString()}`}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`${
                    item.condition === "free"
                      ? "border-green-500 text-green-500"
                      : item.price > 20000
                        ? "border-accent text-accent"
                        : "border-primary text-primary"
                  } bg-transparent`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onMessageSeller(item)
                  }}
                >
                  <MessageCircle className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pt-4">
        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
        >
          Load More Items
        </Button>
      </div>
    </div>
  )
}
