"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-supabase-auth";

interface ProfileDropdownProps {
  onClose: () => void;
  onAction: (action: string) => void;
}

export function ProfileDropdown({ onClose, onAction }: ProfileDropdownProps) {
  const router = useRouter();
  const { signOut, user, profile } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute top-16 right-4 w-64 bg-card border border-border rounded-lg yrdly-shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">{profile?.name || "User"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email || "user@example.com"}</p>
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
  );
}
