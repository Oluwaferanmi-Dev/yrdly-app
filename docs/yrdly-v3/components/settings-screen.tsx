"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  User,
  Bell,
  MapPin,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Globe,
  Lock,
  Eye,
  MessageCircle,
  Calendar,
  ShoppingCart,
} from "lucide-react"

interface SettingsScreenProps {
  onBack: () => void
  onEditProfile?: () => void
  onLocationSettings?: () => void
}

export function SettingsScreen({ onBack, onEditProfile, onLocationSettings }: SettingsScreenProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const [notifications, setNotifications] = useState({
    messages: true,
    events: true,
    marketplace: false,
    community: true,
    businesses: false,
  })

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    locationVisible: false,
    onlineStatus: true,
  })

  const handleLogout = () => {
    console.log("[v0] User logged out from settings")
    // Clear any auth tokens/session data here
    router.push("/login")
  }

  return (
    <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
      </div>

      {/* Profile Section */}
      <Card className="p-4 yrdly-shadow">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 flex-shrink-0">
            <AvatarImage src="/diverse-user-avatars.png" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">John Doe</h3>
            <p className="text-sm text-muted-foreground truncate">john.doe@example.com</p>
            <p className="text-sm text-muted-foreground truncate">Victoria Island, Lagos</p>
          </div>
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {/* Account Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Account</h3>

        <Card className="yrdly-shadow">
          <Button variant="ghost" className="w-full justify-between p-4 h-auto" onClick={onEditProfile}>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Edit Profile</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </Button>
        </Card>

        <Card className="yrdly-shadow">
          <Button variant="ghost" className="w-full justify-between p-4 h-auto" onClick={onLocationSettings}>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Location Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </Button>
        </Card>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Notifications</h3>

        <Card className="p-4 space-y-4 yrdly-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <MessageCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Messages</span>
            </div>
            <Switch
              checked={notifications.messages}
              onCheckedChange={(checked) => setNotifications({ ...notifications, messages: checked })}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Events</span>
            </div>
            <Switch
              checked={notifications.events}
              onCheckedChange={(checked) => setNotifications({ ...notifications, events: checked })}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <ShoppingCart className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Marketplace</span>
            </div>
            <Switch
              checked={notifications.marketplace}
              onCheckedChange={(checked) => setNotifications({ ...notifications, marketplace: checked })}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Bell className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Community Updates</span>
            </div>
            <Switch
              checked={notifications.community}
              onCheckedChange={(checked) => setNotifications({ ...notifications, community: checked })}
            />
          </div>
        </Card>
      </div>

      {/* Privacy & Security */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Privacy & Security</h3>

        <Card className="p-4 space-y-4 yrdly-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Eye className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Profile Visible</span>
            </div>
            <Switch
              checked={privacy.profileVisible}
              onCheckedChange={(checked) => setPrivacy({ ...privacy, profileVisible: checked })}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Share Location</span>
            </div>
            <Switch
              checked={privacy.locationVisible}
              onCheckedChange={(checked) => setPrivacy({ ...privacy, locationVisible: checked })}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Online Status</span>
            </div>
            <Switch
              checked={privacy.onlineStatus}
              onCheckedChange={(checked) => setPrivacy({ ...privacy, onlineStatus: checked })}
            />
          </div>
        </Card>

        <Card className="yrdly-shadow">
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Change Password</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </Button>
        </Card>
      </div>

      {/* Appearance */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Appearance</h3>

        <Card className="p-4 yrdly-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Moon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Dark Mode</span>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
          </div>
        </Card>
      </div>

      {/* Support */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Support</h3>

        <Card className="yrdly-shadow">
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Help & Support</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </Button>
        </Card>
      </div>

      {/* Logout */}
      <Card className="yrdly-shadow">
        <Button
          variant="ghost"
          className="w-full justify-start p-4 h-auto text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>Logout</span>
        </Button>
      </Card>
    </div>
  )
}
