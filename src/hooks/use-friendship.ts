"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./use-supabase-auth";
import { useToast } from "./use-toast";

export type FriendshipStatus = "friends" | "request_sent" | "request_received" | "none" | "loading";

interface UseFriendshipReturn {
  status: FriendshipStatus;
  addFriend: () => Promise<void>;
  removeFriend: () => Promise<void>;
  cancelRequest: () => Promise<void>;
  acceptRequest: () => Promise<void>;
  declineRequest: () => Promise<void>;
  refresh: () => void;
}

export function useFriendship(targetUserId: string | undefined): UseFriendshipReturn {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<FriendshipStatus>("loading");
  const [requestId, setRequestId] = useState<string | null>(null);

  const check = useCallback(async () => {
    if (!user || !targetUserId || targetUserId === user.id) return;
    setStatus("loading");

    // Check friends array first (fastest)
    const { data: me } = await supabase.from("users").select("friends").eq("id", user.id).single();
    if (me?.friends?.includes(targetUserId)) {
      setStatus("friends");
      return;
    }

    // Check pending requests (both directions)
    const { data: requests } = await supabase
      .from("friend_requests")
      .select("id, from_user_id, to_user_id, status")
      .eq("status", "pending")
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${targetUserId}),and(from_user_id.eq.${targetUserId},to_user_id.eq.${user.id})`);

    if (requests && requests.length > 0) {
      const req = requests[0];
      setRequestId(req.id);
      setStatus(req.from_user_id === user.id ? "request_sent" : "request_received");
    } else {
      setRequestId(null);
      setStatus("none");
    }
  }, [user, targetUserId]);

  useEffect(() => {
    check();
    // Refresh on profile updates
    window.addEventListener("refresh-friendship", check);
    return () => window.removeEventListener("refresh-friendship", check);
  }, [check]);

  const addFriend = useCallback(async () => {
    if (!user || !targetUserId) return;
    try {
      await supabase.from("friend_requests").insert({
        from_user_id: user.id,
        to_user_id: targetUserId,
        participant_ids: [user.id, targetUserId].sort(),
        status: "pending",
        created_at: new Date().toISOString(),
      });
      setStatus("request_sent");
      toast({ title: "Friend request sent!" });
      // Trigger notification
      try {
        const { NotificationTriggers } = await import("@/lib/notification-triggers");
        await NotificationTriggers.onFriendRequestSent(user.id, targetUserId);
      } catch { /* non-fatal */ }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not send request." });
    }
  }, [user, targetUserId, toast]);

  const removeFriend = useCallback(async () => {
    if (!user || !targetUserId) return;
    try {
      const [{ data: me }, { data: them }] = await Promise.all([
        supabase.from("users").select("friends").eq("id", user.id).single(),
        supabase.from("users").select("friends").eq("id", targetUserId).single(),
      ]);
      await Promise.all([
        supabase.from("users").update({ friends: (me?.friends || []).filter((id: string) => id !== targetUserId) }).eq("id", user.id),
        supabase.from("users").update({ friends: (them?.friends || []).filter((id: string) => id !== user.id) }).eq("id", targetUserId),
      ]);
      setStatus("none");
      toast({ title: "Friend removed." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not remove friend." });
    }
  }, [user, targetUserId, toast]);

  const cancelRequest = useCallback(async () => {
    if (!user || !targetUserId) return;
    try {
      await supabase.from("friend_requests").delete().eq("from_user_id", user.id).eq("to_user_id", targetUserId).eq("status", "pending");
      setStatus("none");
      setRequestId(null);
      toast({ title: "Request cancelled." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not cancel request." });
    }
  }, [user, targetUserId, toast]);

  const acceptRequest = useCallback(async () => {
    if (!user || !targetUserId || !requestId) return;
    try {
      await supabase.from("friend_requests").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", requestId);

      const [{ data: me }, { data: them }] = await Promise.all([
        supabase.from("users").select("friends").eq("id", user.id).single(),
        supabase.from("users").select("friends").eq("id", targetUserId).single(),
      ]);
      await Promise.all([
        supabase.from("users").update({ friends: Array.from(new Set([...(me?.friends || []), targetUserId])) }).eq("id", user.id),
        supabase.from("users").update({ friends: Array.from(new Set([...(them?.friends || []), user.id])) }).eq("id", targetUserId),
      ]);
      setStatus("friends");
      setRequestId(null);
      toast({ title: "Friend request accepted!" });
      try {
        const { NotificationTriggers } = await import("@/lib/notification-triggers");
        await NotificationTriggers.onFriendRequestAccepted(targetUserId, user.id);
      } catch { /* non-fatal */ }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not accept request." });
    }
  }, [user, targetUserId, requestId, toast]);

  const declineRequest = useCallback(async () => {
    if (!user || !targetUserId || !requestId) return;
    try {
      await supabase.from("friend_requests").delete().eq("id", requestId);
      setStatus("none");
      setRequestId(null);
      toast({ title: "Friend request declined." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not decline request." });
    }
  }, [user, targetUserId, requestId, toast]);

  return { status, addFriend, removeFriend, cancelRequest, acceptRequest, declineRequest, refresh: check };
}
