"use client"

import { Button } from "@/components/ui/button"
import { X, Heart, MessageCircle, Calendar, UserPlus } from "lucide-react"

interface NotificationsPanelProps {
  onClose: () => void
}

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex">
      <div className="w-full max-w-sm mx-auto bg-card">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-primary">
              Mark all as read
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <Heart className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Feranmi Oyelowo</span> liked your post about the art festival
              </p>
              <p className="text-xs text-muted-foreground">2 minutes ago</p>
            </div>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Opiah David</span> commented on your dining set listing
              </p>
              <p className="text-xs text-muted-foreground">1 hour ago</p>
            </div>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Reminder: <span className="font-semibold">Community Art Festival</span> starts in 2 hours
              </p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Caleb Oyelowo</span> sent you a friend request
              </p>
              <p className="text-xs text-muted-foreground">1 day ago</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <Heart className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Boluwatife Lasisi</span> and{" "}
                <span className="font-semibold">2 others</span> liked your welcome post
              </p>
              <p className="text-xs text-muted-foreground">2 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
