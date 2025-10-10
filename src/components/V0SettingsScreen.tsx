"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeftIcon,
  UserIcon,
  BellIcon,
  MapPinIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  MoonIcon,
  GlobeAltIcon,
  LockClosedIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useTheme } from "@/components/ThemeProvider";
import { TawkChat } from "@/components/TawkChat";

interface V0SettingsScreenProps {
  onBack?: () => void;
}

export function V0SettingsScreen({ onBack }: V0SettingsScreenProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, profile, signOut } = useAuth();


  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    locationVisible: false,
    onlineStatus: true,
  });

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleEditProfile = () => {
    router.push("/settings/profile");
  };

  const handleLocationSettings = () => {
    router.push("/settings/location");
  };

  const handleHelp = () => {
    router.push("/help");
  };

  const handlePrivacy = () => {
    router.push("/settings/privacy");
  };

  const handleSecurity = () => {
    router.push("/settings/security");
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack} className="p-0">
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
      </div>

      {/* Profile Section */}
      <Card className="p-4 yrdly-shadow">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {profile?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{profile?.name || "User"}</h3>
            <p className="text-sm text-muted-foreground truncate">{user?.email || "user@example.com"}</p>
            <p className="text-sm text-muted-foreground truncate">
              {profile?.location ? 
                (typeof profile.location === 'string' ? profile.location : 
                 `${profile.location.lga || ''}, ${profile.location.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || 'Location not set') : 
                "Location not set"}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="flex-shrink-0" onClick={handleEditProfile}>
            <ChevronRightIcon className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {/* Account Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Account</h3>

        <Card className="yrdly-shadow">
          <Button variant="ghost" className="w-full justify-between p-4 h-auto" onClick={handleEditProfile}>
            <div className="flex items-center gap-3">
              <UserIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Edit Profile</span>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </Button>
        </Card>

        <Card className="yrdly-shadow">
          <Button variant="ghost" className="w-full justify-between p-4 h-auto" onClick={handleLocationSettings}>
            <div className="flex items-center gap-3">
              <MapPinIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Location Settings</span>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </Button>
        </Card>
      </div>


      {/* Privacy & Security */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Privacy & Security</h3>

        <Card className="p-4 space-y-4 yrdly-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <EyeIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Profile Visible</span>
            </div>
            <Switch
              checked={privacy.profileVisible}
              onCheckedChange={(checked) => setPrivacy({ ...privacy, profileVisible: checked })}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <MapPinIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Share Location</span>
            </div>
            <Switch
              checked={privacy.locationVisible}
              onCheckedChange={(checked) => setPrivacy({ ...privacy, locationVisible: checked })}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <GlobeAltIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Online Status</span>
            </div>
            <Switch
              checked={privacy.onlineStatus}
              onCheckedChange={(checked) => setPrivacy({ ...privacy, onlineStatus: checked })}
              className="cursor-pointer"
            />
          </div>
        </Card>
      </div>

      {/* Appearance */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Appearance</h3>

        <Card className="p-4 space-y-4 yrdly-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <MoonIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Dark Mode</span>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => {
                setTheme(checked ? "dark" : "light");
                // Force immediate theme update
                const root = document.documentElement;
                root.classList.remove("light", "dark");
                root.classList.add(checked ? "dark" : "light");
              }}
              className="cursor-pointer"
            />
          </div>
        </Card>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Notifications</h3>

        <Card className="yrdly-shadow">
          <Button 
            variant="ghost" 
            className="w-full justify-between p-4 h-auto" 
            onClick={() => router.push('/settings/notifications')}
          >
            <div className="flex items-center gap-3">
              <BellIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Notification Settings</span>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </Button>
        </Card>
      </div>

      {/* Support */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Support</h3>

        <Card className="yrdly-shadow">
          <Button variant="ghost" className="w-full justify-between p-4 h-auto" onClick={handleHelp}>
            <div className="flex items-center gap-3">
              <QuestionMarkCircleIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Help & Support</span>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </Button>
        </Card>
      </div>

      {/* Live Chat Support */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Live Chat</h3>
        <Card className="yrdly-shadow p-4">
          <div className="flex items-center gap-3 mb-3">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary" />
            <span className="text-foreground font-medium">Need immediate help?</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Chat with our support team in real-time. We&apos;re here to help you with any questions or issues.
          </p>
          <TawkChat />
        </Card>
      </div>

      {/* Logout */}
      <div className="pt-4">
        <Card className="yrdly-shadow">
          <Button
            variant="ghost"
            className="w-full justify-start p-4 h-auto text-red-600 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </Card>
      </div>
    </div>
  );
}
