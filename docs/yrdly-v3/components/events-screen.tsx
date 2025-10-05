"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { CalendarDays, MapPin, Users, Plus, Search } from "lucide-react"

export function EventsScreen() {
  return (
    <div className="p-4 space-y-6">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Events</h2>
            <p className="text-muted-foreground">Discover events in your neighborhood</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 yrdly-shadow">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search events..." className="pl-10 bg-background border-border" />
        </div>
      </div>

      {/* Featured Event */}
      <Card className="p-0 overflow-hidden yrdly-shadow-lg border-0">
        <div className="yrdly-gradient p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-12 h-12 border-2 border-white/20">
              <AvatarImage src="/event-organizer.png" />
              <AvatarFallback className="bg-white/20 text-white">FO</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">Feranmi Oyelowo</h3>
              <p className="text-white/80 text-sm">2 days ago</p>
            </div>
            <Badge className="ml-auto bg-white/20 text-white border-white/20">Featured</Badge>
          </div>
          <h4 className="text-xl font-bold mb-2">Community Art Festival</h4>
          <p className="text-white/90 mb-4">
            Join us for a vibrant celebration of local artists and creativity in our neighborhood!
          </p>
        </div>
        <div className="p-6 bg-white space-y-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm">Victoria Island Community Center, Lagos</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <CalendarDays className="w-4 h-4 text-accent" />
            <span className="text-sm">March 15, 2024 at 2:00 PM</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">24 attending</span>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">RSVP</Button>
          </div>
        </div>
      </Card>

      {/* Upcoming Events */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Upcoming Events</h3>

        <Card className="p-4 yrdly-shadow">
          <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/fitness-instructor.png" />
              <AvatarFallback className="bg-accent text-accent-foreground">OD</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">Neighborhood Cleanup</h4>
                <Badge variant="outline" className="text-accent border-accent bg-accent/10">
                  Tomorrow
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Let's make our community beautiful together!</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Lekki Phase 1</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>12 attending</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
              >
                RSVP
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 yrdly-shadow">
          <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/diverse-yoga-instructor.png" />
              <AvatarFallback className="bg-primary text-primary-foreground">MF</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">Morning Yoga Session</h4>
                <Badge variant="outline" className="text-primary border-primary bg-primary/10">
                  Weekly
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Start your week with mindfulness and movement</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Central Park</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>8 attending</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
              >
                RSVP
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 yrdly-shadow">
          <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/book-club-host.jpg" />
              <AvatarFallback className="bg-accent text-accent-foreground">BL</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">Book Club Meeting</h4>
                <Badge variant="outline" className="text-muted-foreground border-muted-foreground">
                  Next Week
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Discussing "The Seven Husbands of Evelyn Hugo"</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Community Library</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>15 attending</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
              >
                RSVP
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
