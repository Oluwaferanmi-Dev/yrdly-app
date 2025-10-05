"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, X, DollarSign, MapPin } from "lucide-react"

interface SellItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SellItemModal({ open, onOpenChange }: SellItemModalProps) {
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
    location: "",
  })

  const handleImageUpload = () => {
    // Simulate image upload
    setImages([...images, "/diverse-products-still-life.png"])
  }

  const handleSubmit = () => {
    console.log("Selling item:", formData)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full max-w-sm mx-auto bg-white rounded-t-xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Sell an Item</h3>
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
            <p className="text-sm text-muted-foreground">Selling to neighborhood</p>
          </div>
        </div>

        {/* Images */}
        <div>
          <Label className="text-sm font-medium text-foreground">Photos</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square bg-secondary rounded-lg overflow-hidden">
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Upload ${index + 1}`}
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

        {/* Title */}
        <div>
          <Label htmlFor="title" className="text-sm font-medium text-foreground">
            Title
          </Label>
          <Input
            id="title"
            placeholder="What are you selling?"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1"
          />
        </div>

        {/* Price */}
        <div>
          <Label htmlFor="price" className="text-sm font-medium text-foreground">
            Price
          </Label>
          <div className="relative mt-1">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="price"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <Label className="text-sm font-medium text-foreground">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="furniture">Furniture</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="books">Books</SelectItem>
              <SelectItem value="sports">Sports & Recreation</SelectItem>
              <SelectItem value="home">Home & Garden</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Condition */}
        <div>
          <Label className="text-sm font-medium text-foreground">Condition</Label>
          <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="like-new">Like New</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div>
          <Label htmlFor="location" className="text-sm font-medium text-foreground">
            Location
          </Label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="location"
              placeholder="Your neighborhood"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
            placeholder="Describe your item..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 min-h-[80px] resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSubmit}>
            List Item
          </Button>
        </div>
      </div>
    </div>
  )
}
