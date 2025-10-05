"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Heart, Share2, MapPin, Eye, Star, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react"
import type { MarketplaceItem } from "@/lib/types"

interface ItemDetailScreenProps {
  item: MarketplaceItem
  onBack: () => void
  onMessageSeller: (item: MarketplaceItem) => void
}

export function ItemDetailScreen({ item, onBack, onMessageSeller }: ItemDetailScreenProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(item.isFavorite)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % item.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length)
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "new":
        return "bg-green-500 text-white"
      case "like-new":
        return "bg-blue-500 text-white"
      case "good":
        return "bg-primary text-primary-foreground"
      case "fair":
        return "bg-yellow-500 text-white"
      case "free":
        return "bg-green-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="font-semibold text-foreground">Item Details</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsFavorite(!isFavorite)}>
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Image Carousel */}
        <div className="relative bg-muted">
          <img
            src={item.images[currentImageIndex] || "/placeholder.svg"}
            alt={item.title}
            className="w-full aspect-square object-cover"
          />

          {/* Image Navigation */}
          {item.images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={prevImage}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={nextImage}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {item.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex ? "bg-white w-6" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Item Info */}
        <div className="p-4 space-y-4">
          {/* Price and Condition */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground mb-2">{item.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-3xl font-bold text-primary">
                  {item.condition === "free" ? "FREE" : `₦${item.price.toLocaleString()}`}
                </span>
                <Badge className={getConditionColor(item.condition)}>
                  {item.condition === "free" ? "Free" : item.condition.replace("-", " ")}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{item.views} views</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{item.distance}</span>
            </div>
          </div>

          {/* Seller Info */}
          <Card className="p-4 yrdly-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={item.sellerAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {item.sellerName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{item.sellerName}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">{item.sellerRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="flex-shrink-0 bg-transparent">
                View Profile
              </Button>
            </div>
          </Card>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{item.description}</p>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Category</span>
                <p className="font-medium text-foreground">{item.category}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Condition</span>
                <p className="font-medium text-foreground capitalize">{item.condition.replace("-", " ")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Location</span>
                <p className="font-medium text-foreground">{item.location}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Posted</span>
                <p className="font-medium text-foreground">{item.postedDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border bg-card space-y-2">
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 yrdly-shadow"
          size="lg"
          onClick={() => onMessageSeller(item)}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Message Seller
        </Button>
        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" variant="outline">
          {item.condition === "free" ? "Claim Item" : "Make Offer"}
        </Button>
      </div>
    </div>
  )
}
