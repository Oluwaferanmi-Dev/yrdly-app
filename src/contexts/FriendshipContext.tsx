"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-supabase-auth";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type FriendshipStatus = "friends" | "request_sent" | "request_received" | "none";

interface FriendshipContextType {
  statuses: Record<string, FriendshipStatus>;
  updateStatus: (userId: string, status: FriendshipStatus) => void;
  getStatus: (userId: string) => FriendshipStatus;
  refreshUserStatus: (userId: string) => Promise<void>;
}

const FriendshipContext = createContext<FriendshipContextType | undefined>(undefined);

export function FriendshipProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<Record<string, FriendshipStatus>>({});
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

  const updateStatus = useCallback((userId: string, status: FriendshipStatus) => {
    setStatuses((prev) => ({
      ...prev,
      [userId]: status,
    }));
  }, []);

  const getStatus = useCallback((userId: string): FriendshipStatus => {
    return statuses[userId] || "none";
  }, [statuses]);

  const refreshUserStatus = useCallback(
    async (targetUserId: string) => {
      if (!user || targetUserId === user.id) return;

      try {
        // Check friends array first
        const { data: me } = await supabase
          .from("users")
          .select("friends")
          .eq("id", user.id)
          .single();

        if (me?.friends?.includes(targetUserId)) {
          updateStatus(targetUserId, "friends");
          return;
        }

        // Check pending requests
        const { data: requests } = await supabase
          .from("friend_requests")
          .select("id, from_user_id, to_user_id, status")
          .eq("status", "pending")
          .or(
            `and(from_user_id.eq.${user.id},to_user_id.eq.${targetUserId}),and(from_user_id.eq.${targetUserId},to_user_id.eq.${user.id})`
          );

        if (requests && requests.length > 0) {
          const req = requests[0];
          const status: FriendshipStatus =
            req.from_user_id === user.id ? "request_sent" : "request_received";
          updateStatus(targetUserId, status);
        } else {
          updateStatus(targetUserId, "none");
        }
      } catch (error) {
        console.error("Error refreshing friendship status:", error);
      }
    },
    [user, updateStatus]
  );

  // Subscribe to friend_requests changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`friend_requests:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
          filter: `or(from_user_id.eq.${user.id},to_user_id.eq.${user.id})`,
        },
        async (payload) => {
          console.log("[v0] Friendship event received:", payload);

          // Determine which user ID we need to refresh
          const record = payload.new || payload.old;
          const otherUserId =
            record.from_user_id === user.id
              ? record.to_user_id
              : record.from_user_id;

          // Refresh the status for this user
          await refreshUserStatus(otherUserId);
        }
      )
      .subscribe();

    setSubscription(channel);

    return () => {
      channel.unsubscribe();
    };
  }, [user, refreshUserStatus]);

  // Subscribe to users.friends array changes (for friend additions/removals)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`users:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id.eq.${user.id}`,
        },
        async (payload) => {
          console.log("[v0] User friends updated:", payload);

          // Re-check all statuses when friends array changes
          // This is a fallback for when friend_requests table doesn't have event
          if (payload.new && payload.new.friends) {
            // Trigger a full refresh for currently cached statuses
            const cachedUserIds = Object.keys(statuses);
            for (const userId of cachedUserIds) {
              await refreshUserStatus(userId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, statuses, refreshUserStatus]);

  return (
    <FriendshipContext.Provider value={{ statuses, updateStatus, getStatus, refreshUserStatus }}>
      {children}
    </FriendshipContext.Provider>
  );
}

export function useFriendshipContext() {
  const context = useContext(FriendshipContext);
  if (!context) {
    throw new Error("useFriendshipContext must be used within FriendshipProvider");
  }
  return context;
}
