"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Settings, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProfileDropdownProps {
  onClose: () => void
  onAction: (action: string) => void
}

export function ProfileDropdown({ onClose, onAction }: ProfileDropdownProps) {
  const router = useRouter()

  const handleLogout = () => {
    console.log("[v0] User logged out")
    // Clear any auth tokens/session data here
    router.push("/login")
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute top-16 right-4 w-64 bg-card border border-border rounded-lg yrdly-shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src="/placeholder.svg?key=profile" />
              <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">John Doe</h3>
              <p className="text-sm text-muted-foreground">john.doe@example.com</p>
            </div>
          </div>
        </div>

        <div className="p-2">
          <Button variant="ghost" className="w-full justify-start" onClick={() => onAction("profile")}>
            <User className="w-4 h-4 mr-3" />
            Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => onAction("settings")}>
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Button>
          <div className="border-t border-border my-2"></div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
