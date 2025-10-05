"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Star, MapPin, Clock, Plus, Search, Phone } from "lucide-react"
import type { Business } from "@/lib/types"

interface BusinessesScreenProps {
  onCreateBusiness: () => void
  onVisitBusiness: (business: Business) => void
}

export function BusinessesScreen({ onCreateBusiness, onVisitBusiness }: BusinessesScreenProps) {
  const sampleBusinesses: Business[] = [
    {
      id: "1",
      name: "Tech Corner",
      description: "Latest gadgets and tech accessories for all your electronic needs",
      category: "Electronics",
      coverImage: "/electronics-store-interior.png",
      logo: "/abstract-tech-logo.png",
      rating: 4.5,
      reviewCount: 89,
      hours: "Open until 9 PM",
      phone: "+234 801 234 5678",
      location: "Lekki Phase 1, Lagos",
      distance: "0.3 km away",
      ownerId: "owner1",
      ownerName: "Chidi Okafor",
      ownerAvatar: "/placeholder.svg?height=40&width=40",
      catalog: [
        {
          id: "c1",
          businessId: "1",
          title: "Wireless Earbuds",
          description: "Premium wireless earbuds with noise cancellation",
          price: 25000,
          images: ["/wireless-earbuds.png"],
          category: "Audio",
          inStock: true,
        },
        {
          id: "c2",
          businessId: "1",
          title: "Phone Case",
          description: "Durable protective case for smartphones",
          price: 5000,
          images: ["/colorful-phone-case-display.png"],
          category: "Accessories",
          inStock: true,
        },
      ],
    },
    {
      id: "2",
      name: "Green Fitness",
      description: "Modern gym with personal trainers and state-of-the-art equipment",
      category: "Health & Fitness",
      coverImage: "/gym-interior.png",
      logo: "/fitness-logo.png",
      rating: 4.9,
      reviewCount: 156,
      hours: "Open 24/7",
      phone: "+234 802 345 6789",
      location: "Victoria Island, Lagos",
      distance: "0.5 km away",
      ownerId: "owner2",
      ownerName: "Amaka Johnson",
      ownerAvatar: "/placeholder.svg?height=40&width=40",
      catalog: [
        {
          id: "c3",
          businessId: "2",
          title: "Monthly Membership",
          description: "Full access to all gym facilities and group classes",
          price: 15000,
          images: ["/gym-membership-benefits.png"],
          category: "Membership",
          inStock: true,
        },
        {
          id: "c4",
          businessId: "2",
          title: "Personal Training (10 sessions)",
          description: "One-on-one training with certified personal trainers",
          price: 50000,
          images: ["/personal-training-session.png"],
          category: "Training",
          inStock: true,
        },
      ],
    },
    {
      id: "3",
      name: "Bella's Salon",
      description: "Professional hair and beauty services with experienced stylists",
      category: "Beauty",
      coverImage: "/beauty-salon.png",
      logo: "/salon-logo.png",
      rating: 4.7,
      reviewCount: 203,
      hours: "Open until 8 PM",
      phone: "+234 803 456 7890",
      location: "Ikeja GRA, Lagos",
      distance: "0.8 km away",
      ownerId: "owner3",
      ownerName: "Bella Adeyemi",
      ownerAvatar: "/placeholder.svg?height=40&width=40",
      catalog: [
        {
          id: "c5",
          businessId: "3",
          title: "Hair Styling",
          description: "Professional hair styling and treatment",
          price: 8000,
          images: ["/diverse-hair-styling.png"],
          category: "Hair",
          inStock: true,
        },
        {
          id: "c6",
          businessId: "3",
          title: "Manicure & Pedicure",
          description: "Complete nail care and beautification",
          price: 6000,
          images: ["/manicure.png"],
          category: "Nails",
          inStock: true,
        },
      ],
    },
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Local businesses</h2>
            <p className="text-muted-foreground">Discover and support businesses in your neighborhood</p>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 yrdly-shadow"
            onClick={onCreateBusiness}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your Business
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search businesses..." className="pl-10 bg-card border-border focus:border-primary" />
        </div>
      </div>

      {/* Featured Business */}
      <Card className="p-0 overflow-hidden yrdly-shadow-lg border-0">
        <div className="relative h-32 yrdly-gradient"></div>
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-xl font-bold text-foreground">23</h4>
              <p className="text-muted-foreground">Retail & Shopping</p>
            </div>
            <Badge className="bg-primary text-primary-foreground">Featured</Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">4.8</span>
              <span className="text-sm text-muted-foreground">(124 reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Open until 10 PM</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm">Lekki Phase 1, Lekki 106104, Lagos, Nigeria</span>
          </div>

          <p className="text-sm text-muted-foreground">Your one-stop shop for quality clothing and accessories</p>

          <div className="flex gap-2">
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Visit Store</Button>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
          </div>
        </div>
      </Card>

      {/* Business Categories */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Categories</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 yrdly-shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-lg">🍽️</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Food & Dining</h4>
                <p className="text-sm text-muted-foreground">12 businesses</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 yrdly-shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <span className="text-lg">🛍️</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Retail</h4>
                <p className="text-sm text-muted-foreground">8 businesses</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 yrdly-shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-lg">💪</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Health & Fitness</h4>
                <p className="text-sm text-muted-foreground">5 businesses</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 yrdly-shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <span className="text-lg">✂️</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Beauty</h4>
                <p className="text-sm text-muted-foreground">7 businesses</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Nearby Businesses */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Nearby Businesses</h3>

        {sampleBusinesses.map((business) => (
          <Card key={business.id} className="p-4 yrdly-shadow">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={business.logo || "/placeholder.svg"}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-foreground truncate">{business.name}</h4>
                  <Badge variant="outline" className="text-primary border-primary bg-primary/10 flex-shrink-0">
                    {business.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{business.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{business.distance}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{business.description}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => onVisitBusiness(business)}
                  >
                    Visit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                  >
                    Call
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
