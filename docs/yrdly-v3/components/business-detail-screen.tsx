"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Star, MapPin, Clock, Phone, MessageCircle, Share2, Heart } from "lucide-react"
import type { Business, CatalogItem } from "@/lib/types"
import { useState } from "react"

interface BusinessDetailScreenProps {
  business: Business
  onBack: () => void
  onMessageOwner: (business: Business) => void
  onViewCatalogItem: (item: CatalogItem) => void
}

export function BusinessDetailScreen({
  business,
  onBack,
  onMessageOwner,
  onViewCatalogItem,
}: BusinessDetailScreenProps) {
  const [activeTab, setActiveTab] = useState("catalog")

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with cover image */}
      <div className="relative">
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
          <img
            src={business.coverImage || "/placeholder.svg"}
            alt={business.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm hover:bg-background">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm hover:bg-background">
            <Heart className="w-5 h-5" />
          </Button>
        </div>

        {/* Business logo */}
        <div className="absolute -bottom-12 left-4">
          <div className="w-24 h-24 rounded-2xl bg-background border-4 border-background yrdly-shadow-lg overflow-hidden">
            <img src={business.logo || "/placeholder.svg"} alt={business.name} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Business info */}
      <div className="p-4 pt-16 space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
              <Badge variant="outline" className="mt-1">
                {business.category}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{business.rating}</span>
              <span className="text-sm text-muted-foreground">({business.reviewCount} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{business.hours}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm">{business.location}</span>
            <span className="text-sm">• {business.distance}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onMessageOwner(business)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
          <TabsTrigger value="catalog" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Catalog
          </TabsTrigger>
          <TabsTrigger value="about" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
            About
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Reviews
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="catalog" className="p-4 mt-0">
            <div className="grid grid-cols-2 gap-3">
              {business.catalog.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onViewCatalogItem(item)}
                >
                  <div className="relative aspect-square bg-muted">
                    <img
                      src={item.images[0] || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="font-semibold text-sm text-foreground truncate">{item.title}</h4>
                    <p className="text-lg font-bold text-primary">₦{item.price.toLocaleString()}</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about" className="p-4 mt-0 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">About</h3>
              <p className="text-muted-foreground">{business.description}</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{business.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{business.location}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Business Owner</h3>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={business.ownerAvatar || "/placeholder.svg"} />
                  <AvatarFallback>{business.ownerName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{business.ownerName}</p>
                  <p className="text-sm text-muted-foreground">Owner</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="p-4 mt-0 space-y-4">
            {/* Sample reviews */}
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">John Doe</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">5.0</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Great service and quality products! Highly recommend this business to everyone in the neighborhood.
                  </p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback>SA</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">Sarah Adams</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">4.5</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Very professional and friendly staff. The prices are reasonable and the quality is excellent.
                  </p>
                  <p className="text-xs text-muted-foreground">1 week ago</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
