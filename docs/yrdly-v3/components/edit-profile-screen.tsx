"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Camera, Save } from "lucide-react"

interface EditProfileScreenProps {
  onBack: () => void
}

export function EditProfileScreen({ onBack }: EditProfileScreenProps) {
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+234 801 234 5678",
    bio: "Community enthusiast and event organizer. Love bringing neighbors together through art, food, and fun activities. Always happy to help with local initiatives and connect with fellow residents.",
    interests: "Art & Culture, Community Events, Gardening, Photography, Cooking, Local Business",
  })

  const handleSave = () => {
    // Handle save profile
    onBack()
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">Edit Profile</h2>
        </div>
        <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Profile Photo */}
      <Card className="p-6 yrdly-shadow">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src="/diverse-user-avatars.png" />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">JD</AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 p-0 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Click to change profile photo</p>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6 space-y-4 yrdly-shadow">
        <h3 className="font-semibold text-foreground">Personal Information</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Full Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-background border-border focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="bg-background border-border focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Phone Number</label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-background border-border focus:border-primary"
          />
        </div>
      </Card>

      {/* About */}
      <Card className="p-6 space-y-4 yrdly-shadow">
        <h3 className="font-semibold text-foreground">About</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Bio</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="bg-background border-border focus:border-primary resize-none"
          />
          <p className="text-xs text-muted-foreground">{formData.bio.length}/500 characters</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Interests</label>
          <Input
            value={formData.interests}
            onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
            placeholder="Separate interests with commas"
            className="bg-background border-border focus:border-primary"
          />
          <p className="text-xs text-muted-foreground">Add interests to help neighbors find common ground</p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 border-border bg-transparent">
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
          Save Changes
        </Button>
      </div>
    </div>
  )
}
