"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Search, Filter, Navigation, Layers } from "lucide-react"

export function MapScreen() {
  return (
    <div className="h-screen relative">
      {/* Map Container */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Interactive Map</h3>
            <p className="text-muted-foreground">Google Maps integration would go here</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Badge className="bg-primary text-primary-foreground">Events</Badge>
            <Badge className="bg-accent text-accent-foreground">Businesses</Badge>
            <Badge className="bg-green-500 text-white">Posts</Badge>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search locations..." className="pl-10 bg-card/95 backdrop-blur-sm border-border" />
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-20 right-4 z-10 space-y-2">
        <Button size="icon" className="bg-card/95 backdrop-blur-sm border border-border text-foreground hover:bg-card">
          <Filter className="w-4 h-4" />
        </Button>
        <Button size="icon" className="bg-card/95 backdrop-blur-sm border border-border text-foreground hover:bg-card">
          <Layers className="w-4 h-4" />
        </Button>
        <Button size="icon" className="bg-card/95 backdrop-blur-sm border border-border text-foreground hover:bg-card">
          <Navigation className="w-4 h-4" />
        </Button>
      </div>

      {/* Location Info Card */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <Card className="p-4 yrdly-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">Your Neighborhood</h4>
              <p className="text-sm text-muted-foreground">Lekki Phase 1, Lagos, Nigeria</p>
            </div>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Explore
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
