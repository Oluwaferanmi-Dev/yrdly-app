"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, X, User, Calendar, ShoppingBag, Building } from "lucide-react"

interface SearchDialogProps {
  onClose: () => void
}

export function SearchDialog({ onClose }: SearchDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex">
      <div className="w-full max-w-sm mx-auto bg-card">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search for anything..." className="pl-10" autoFocus />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Results */}
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">PEOPLE</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/placeholder.svg?key=search1" />
                  <AvatarFallback className="bg-primary text-primary-foreground">FO</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Feranmi Oyelowo</h4>
                  <p className="text-sm text-muted-foreground">Community organizer</p>
                </div>
                <Button size="sm" variant="outline">
                  <User className="w-4 h-4 mr-2" />
                  Add Friend
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">EVENTS</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Community Art Festival</h4>
                  <p className="text-sm text-muted-foreground">March 15, 2024</p>
                </div>
                <Badge className="bg-primary text-primary-foreground">Event</Badge>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">MARKETPLACE</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Vintage Dining Set</h4>
                  <p className="text-sm text-muted-foreground">₦45,000</p>
                </div>
                <Badge className="bg-accent text-accent-foreground">For Sale</Badge>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">BUSINESSES</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Building className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Tech Corner</h4>
                  <p className="text-sm text-muted-foreground">Electronics store</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Business
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
