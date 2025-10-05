"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, X, MapPin, Phone, Globe, Clock } from "lucide-react"

interface CreateBusinessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateBusinessModal({ open, onOpenChange }: CreateBusinessModalProps) {
  const [logo, setLogo] = useState<string>("")
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    address: "",
    phone: "",
    website: "",
    hours: "",
    email: "",
  })

  const handleLogoUpload = () => {
    setLogo("/abstract-business-logo.png")
  }

  const handleImageUpload = () => {
    setImages([...images, "/business-meeting-diversity.png"])
  }

  const handleSubmit = () => {
    console.log("Creating business:", formData)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full max-w-sm mx-auto bg-white rounded-t-xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Add Your Business</h3>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            ✕
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="/diverse-user-avatars.png" />
            <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-foreground">John Doe</h4>
            <p className="text-sm text-muted-foreground">Adding to neighborhood</p>
          </div>
        </div>

        {/* Logo */}
        <div>
          <Label className="text-sm font-medium text-foreground">Business Logo</Label>
          <div className="mt-2">
            {logo ? (
              <div className="relative w-20 h-20 bg-secondary rounded-lg overflow-hidden">
                <img src={logo || "/placeholder.svg"} alt="Business logo" className="w-full h-full object-cover" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70"
                  onClick={() => setLogo("")}
                >
                  <X className="w-3 h-3 text-white" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-20 h-20 border-dashed border-2 border-muted-foreground/30 bg-transparent"
                onClick={handleLogoUpload}
              >
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        {/* Business Name */}
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-foreground">
            Business Name
          </Label>
          <Input
            id="name"
            placeholder="Enter business name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1"
          />
        </div>

        {/* Category */}
        <div>
          <Label className="text-sm font-medium text-foreground">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="restaurant">Restaurant & Food</SelectItem>
              <SelectItem value="retail">Retail & Shopping</SelectItem>
              <SelectItem value="services">Services</SelectItem>
              <SelectItem value="health">Health & Wellness</SelectItem>
              <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
              <SelectItem value="automotive">Automotive</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Address */}
        <div>
          <Label htmlFor="address" className="text-sm font-medium text-foreground">
            Address
          </Label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="address"
              placeholder="Business address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-foreground">
            Phone Number
          </Label>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="phone"
              placeholder="+234 xxx xxx xxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <Label htmlFor="website" className="text-sm font-medium text-foreground">
            Website (Optional)
          </Label>
          <div className="relative mt-1">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="website"
              placeholder="https://yourwebsite.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Hours */}
        <div>
          <Label htmlFor="hours" className="text-sm font-medium text-foreground">
            Business Hours
          </Label>
          <div className="relative mt-1">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="hours"
              placeholder="Mon-Fri 9AM-6PM"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-sm font-medium text-foreground">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Tell people about your business..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 min-h-[80px] resize-none"
          />
        </div>

        {/* Business Photos */}
        <div>
          <Label className="text-sm font-medium text-foreground">Business Photos</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square bg-secondary rounded-lg overflow-hidden">
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Business ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70"
                  onClick={() => setImages(images.filter((_, i) => i !== index))}
                >
                  <X className="w-3 h-3 text-white" />
                </Button>
              </div>
            ))}
            {images.length < 6 && (
              <Button
                variant="outline"
                className="aspect-square border-dashed border-2 border-muted-foreground/30 bg-transparent"
                onClick={handleImageUpload}
              >
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSubmit}>
            Add Business
          </Button>
        </div>
      </div>
    </div>
  )
}
