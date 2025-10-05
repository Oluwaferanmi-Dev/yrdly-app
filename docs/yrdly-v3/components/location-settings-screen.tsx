"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, MapPin, Navigation, Save } from "lucide-react"

interface LocationSettingsScreenProps {
  onBack: () => void
}

export function LocationSettingsScreen({ onBack }: LocationSettingsScreenProps) {
  const [locationData, setLocationData] = useState({
    address: "123 Main Street",
    city: "Victoria Island",
    state: "Lagos",
    country: "Nigeria",
    zipCode: "101241",
  })

  const [locationSettings, setLocationSettings] = useState({
    shareLocation: true,
    autoDetect: false,
    showOnMap: true,
    visibleToNeighbors: true,
  })

  const handleSave = () => {
    // Handle save location settings
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
          <h2 className="text-2xl font-bold text-foreground">Location Settings</h2>
        </div>
        <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Current Location */}
      <Card className="p-6 yrdly-shadow">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Current Location</h3>
            <p className="text-sm text-muted-foreground">Victoria Island, Lagos, Nigeria</p>
            <Button variant="link" className="p-0 h-auto text-primary mt-2">
              <Navigation className="w-4 h-4 mr-1" />
              Use Current Location
            </Button>
          </div>
        </div>
      </Card>

      {/* Address Information */}
      <Card className="p-6 space-y-4 yrdly-shadow">
        <h3 className="font-semibold text-foreground">Address Information</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Street Address</label>
          <Input
            value={locationData.address}
            onChange={(e) => setLocationData({ ...locationData, address: e.target.value })}
            className="bg-background border-border focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">City</label>
            <Input
              value={locationData.city}
              onChange={(e) => setLocationData({ ...locationData, city: e.target.value })}
              className="bg-background border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">State</label>
            <Input
              value={locationData.state}
              onChange={(e) => setLocationData({ ...locationData, state: e.target.value })}
              className="bg-background border-border focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Country</label>
            <Input
              value={locationData.country}
              onChange={(e) => setLocationData({ ...locationData, country: e.target.value })}
              className="bg-background border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Zip Code</label>
            <Input
              value={locationData.zipCode}
              onChange={(e) => setLocationData({ ...locationData, zipCode: e.target.value })}
              className="bg-background border-border focus:border-primary"
            />
          </div>
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card className="p-6 space-y-4 yrdly-shadow">
        <h3 className="font-semibold text-foreground">Privacy Settings</h3>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium text-foreground">Share Location</p>
            <p className="text-sm text-muted-foreground">Allow Yrdly to access your location</p>
          </div>
          <Switch
            checked={locationSettings.shareLocation}
            onCheckedChange={(checked) => setLocationSettings({ ...locationSettings, shareLocation: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium text-foreground">Auto-Detect Location</p>
            <p className="text-sm text-muted-foreground">Automatically update your location</p>
          </div>
          <Switch
            checked={locationSettings.autoDetect}
            onCheckedChange={(checked) => setLocationSettings({ ...locationSettings, autoDetect: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium text-foreground">Show on Map</p>
            <p className="text-sm text-muted-foreground">Display your location on the community map</p>
          </div>
          <Switch
            checked={locationSettings.showOnMap}
            onCheckedChange={(checked) => setLocationSettings({ ...locationSettings, showOnMap: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium text-foreground">Visible to Neighbors</p>
            <p className="text-sm text-muted-foreground">Let neighbors see your general area</p>
          </div>
          <Switch
            checked={locationSettings.visibleToNeighbors}
            onCheckedChange={(checked) => setLocationSettings({ ...locationSettings, visibleToNeighbors: checked })}
          />
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-primary/5 border-primary/20 yrdly-shadow">
        <p className="text-sm text-foreground leading-relaxed">
          <strong>Note:</strong> Your exact address is never shared publicly. Neighbors will only see your general
          neighborhood area to help connect with people nearby.
        </p>
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
