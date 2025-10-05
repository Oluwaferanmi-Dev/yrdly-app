"use client"

import type React from "react"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { SearchDialog } from "@/components/search-dialog"
import { NotificationsPanel } from "@/components/notifications-panel"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Button } from "@/components/ui/button"
import { Home, Users, ShoppingCart, Calendar, Briefcase, Search, Map, MessageCircle, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Suspense } from "react"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const handleProfileAction = (action: string) => {
    setShowProfile(false)
    if (action === "profile") {
      router.push("/profile")
    } else if (action === "settings") {
      router.push("/settings")
    }
  }

  // Check if we're on the home page
  const isHomePage = pathname === "/"

  return (
    <>
      {/* Fixed Header */}
      <Suspense fallback={<div>Loading...</div>}>
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-border z-50">
          <div className="flex items-center justify-between p-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full yrdly-gradient flex items-center justify-center">
                <span className="text-white font-bold text-sm">Y</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">Yrdly</h1>
            </Link>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isHomePage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSearch(true)}
                >
                  <Search className="w-5 h-5" />
                </Button>
              )}
              <Link href="/map">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Map className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground relative">
                  <MessageCircle className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">3</span>
                  </div>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground relative"
                onClick={() => setShowNotifications(true)}
              >
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </Button>
              <Button variant="ghost" size="sm" className="p-0" onClick={() => setShowProfile(!showProfile)}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/diverse-user-avatars.png" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">JD</AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </Suspense>

      {/* Screen Content */}
      <div className="pt-20 pb-20">{children}</div>

      {/* Fixed Bottom Navigation */}
      <Suspense fallback={<div>Loading...</div>}>
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-t border-border z-50">
          <div className="flex items-center justify-around py-3">
            <Link href="/" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col gap-1 w-full ${pathname === "/" ? "text-primary" : "text-muted-foreground"}`}
              >
                <Home className="w-5 h-5" />
                <span className="text-xs">Home</span>
              </Button>
            </Link>
            <Link href="/community" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col gap-1 w-full ${pathname === "/community" ? "text-primary" : "text-muted-foreground"}`}
              >
                <Users className="w-5 h-5" />
                <span className="text-xs">Community</span>
              </Button>
            </Link>
            <Link href="/marketplace" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col gap-1 w-full ${pathname === "/marketplace" ? "text-primary" : "text-muted-foreground"}`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-xs">Market</span>
              </Button>
            </Link>
            <Link href="/events" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col gap-1 w-full ${pathname === "/events" ? "text-primary" : "text-muted-foreground"}`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-xs">Events</span>
              </Button>
            </Link>
            <Link href="/businesses" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col gap-1 w-full ${pathname === "/businesses" ? "text-primary" : "text-muted-foreground"}`}
              >
                <Briefcase className="w-5 h-5" />
                <span className="text-xs">Businesses</span>
              </Button>
            </Link>
          </div>
        </div>
      </Suspense>

      {/* Modals */}
      {showSearch && <SearchDialog onClose={() => setShowSearch(false)} />}
      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
      {showProfile && <ProfileDropdown onClose={() => setShowProfile(false)} onAction={handleProfileAction} />}
    </>
  )
}
