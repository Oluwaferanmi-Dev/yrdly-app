"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Heart, Share2, MessageCircle, Star } from "lucide-react"
import type { CatalogItem, Business } from "@/lib/types"
import { useState } from "react"

interface CatalogItemDetailScreenProps {
  item: CatalogItem
  business: Business
  onBack: () => void
  onMessageOwner: (business: Business, item: CatalogItem) => void
}

export function CatalogItemDetailScreen({ item, business, onBack, onMessageOwner }: CatalogItemDetailScreenProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Image carousel */}
        <div className="relative">
          <div className="relative aspect-square bg-muted overflow-hidden">
            <img
              src={item.images[currentImageIndex] || "/placeholder.svg"}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            {!item.inStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>

          {/* Image indicators */}
          {item.images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
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
          )}
        </div>

        {/* Item details */}
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-foreground flex-1">{item.title}</h1>
              <Badge variant="outline">{item.category}</Badge>
            </div>
            <p className="text-3xl font-bold text-primary">₦{item.price.toLocaleString()}</p>
          </div>

          {/* Business info */}
          <div className="border-t border-b border-border py-4">
            <p className="text-sm text-muted-foreground mb-3">Sold by</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={business.logo || "/placeholder.svg"}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{business.name}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{business.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">• {business.distance}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="border-t border-border p-4 bg-background">
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => onMessageOwner(business, item)}
          disabled={!item.inStock}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {item.inStock ? "Message About This Item" : "Item Out of Stock"}
        </Button>
      </div>
    </div>
  )
}
