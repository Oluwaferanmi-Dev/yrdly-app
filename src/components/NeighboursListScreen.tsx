"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, User as UserIcon, ArrowLeft, Plus, Check, X, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-supabase-auth";
import type { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useFriendshipGlobal } from "@/hooks/use-friendship-global";

const GREEN = "#388E3C";
const DARK_BG = "#15181D";
const CARD = "#1E2126";
const FONT = "Raleway, sans-serif";

interface Neighbor extends User {
  isFriend?: boolean;
  requestSent?: boolean;
  requestReceived?: boolean;
}

export function NeighboursListScreen() {
  const router = useRouter();
  const { user: currentUser, profile } = useAuth();
  const { toast } = useToast();
  const [neighbors, setNeighbors] = useState<Neighbor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeighborId, setSelectedNeighborId] = useState<string | undefined>();
  
  // Use global friendship hook for the selected neighbor
  const friendshipHook = useFriendshipGlobal(selectedNeighborId);

  useEffect(() => {
    if (!currentUser) return;
    fetchNeighbors();
  }, [currentUser]);

  const fetchNeighbors = async () => {
    try {
      setLoading(true);

      // Fetch all users except current user
      const { data: allUsers, error: usersError } = await supabase
        .from("users")
        .select("id, name, email, avatar_url, created_at, friends")
        .neq("id", currentUser?.id)
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Map users
      const mappedUsers = (allUsers || []).map((user) => ({
        ...user,
        uid: user.id,
        timestamp: user.created_at,
      })) as Neighbor[];

      setNeighbors(mappedUsers);
    } catch (error) {
      console.error("Error fetching neighbors:", error);
      toast({
        title: "Error",
        description: "Failed to load neighbors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (neighborId: string) => {
    if (!currentUser) return;
    setSelectedNeighborId(neighborId);
    
    try {
      await friendshipHook.addFriend();
    } catch {
      // Error is already handled by the hook
    }
  };

  const handleAcceptRequest = async (neighborId: string) => {
    if (!currentUser) return;
    setSelectedNeighborId(neighborId);
    
    try {
      await friendshipHook.acceptRequest();
    } catch {
      // Error is already handled by the hook
    }
  };

  const handleRejectRequest = async (neighborId: string) => {
    if (!currentUser) return;
    setSelectedNeighborId(neighborId);
    
    try {
      await friendshipHook.declineRequest();
    } catch {
      // Error is already handled by the hook
    }
  };

  const handleMessageNeighbor = async (neighborId: string) => {
    if (!currentUser) return;

    try {
      // Check if conversation already exists
      const { data: existingConversations, error: fetchError } = await supabase
        .from("conversations")
        .select("id, participant_ids")
        .contains("participant_ids", [currentUser.id])
        .contains("participant_ids", [neighborId])
        .eq("type", "friend");

      if (fetchError) {
        console.error("Error fetching conversations:", fetchError);
        return;
      }

      let conversationId: string;

      if (!existingConversations || existingConversations.length === 0) {
        // Create new friend conversation
        const sortedParticipantIds = [currentUser.id, neighborId].sort();
        const { data: newConv, error: createError } = await supabase
          .from("conversations")
          .insert({
            participant_ids: sortedParticipantIds,
            type: "friend",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (createError) throw createError;
        conversationId = newConv.id;
      } else {
        conversationId = existingConversations[0].id;
      }

      // Navigate to the conversation
      router.push(`/messages/${conversationId}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to open conversation",
        variant: "destructive",
      });
    }
  };

  const renderActionButton = (neighbor: Neighbor) => {
    // Set neighbor context before rendering
    const neighborHook = useFriendshipGlobal(neighbor.id);
    const status = neighborHook.status;
    const isLoading = neighborHook.isLoading;

    switch (status) {
      case "friends":
        return (
          <Button
            size="sm"
            onClick={() => handleMessageNeighbor(neighbor.id)}
            style={{ backgroundColor: GREEN, color: "white" }}
            disabled={isLoading}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Message
          </Button>
        );
      case "request_sent":
        return (
          <Button variant="outline" size="sm" disabled>
            <Check className="w-4 h-4 mr-1" />
            Sent
          </Button>
        );
      case "request_received":
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAcceptRequest(neighbor.id)}
              style={{ backgroundColor: GREEN, color: "white" }}
              disabled={isLoading}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRejectRequest(neighbor.id)}
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        );
      default:
        return (
          <Button
            size="sm"
            onClick={() => handleAddFriend(neighbor.id)}
            style={{ backgroundColor: GREEN, color: "white" }}
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        );
    }
  };

  return (
    <div
      className="min-h-screen p-4"
      style={{ backgroundColor: DARK_BG, fontFamily: FONT }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Neighbours</h1>
          <span
            className="text-sm font-semibold ml-auto"
            style={{ color: GREEN }}
          >
            {neighbors.length}
          </span>
        </div>

        {/* Neighbours List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="p-4 flex items-center gap-3"
                style={{ background: CARD, borderRadius: 11 }}
              >
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="w-20 h-8" />
              </div>
            ))}
          </div>
        ) : neighbors.length === 0 ? (
          <div
            className="p-8 text-center rounded-lg"
            style={{ background: CARD }}
          >
            <div className="inline-block p-4 rounded-full mb-4" style={{ backgroundColor: "rgba(56,142,60,0.1)" }}>
              <UserIcon className="w-12 h-12" style={{ color: GREEN }} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No Neighbours Yet
            </h3>
            <p className="text-sm text-gray-400">
              More people will join your community soon
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {neighbors.map((neighbor) => (
              <div
                key={neighbor.id}
                className="p-4 flex items-center gap-3 transition-all hover:opacity-80 cursor-pointer"
                style={{ background: CARD, borderRadius: 11 }}
              >
                <Avatar
                  className="w-12 h-12 cursor-pointer"
                  onClick={() => router.push(`/profile/${neighbor.id}`)}
                >
                  <AvatarImage src={neighbor.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback style={{ backgroundColor: GREEN, color: "white" }}>
                    {neighbor.name?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => router.push(`/profile/${neighbor.id}`)}
                >
                  <h3 className="font-semibold text-white truncate">
                    {neighbor.name || "Unknown User"}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">
                    {neighbor.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    Member since {new Date(neighbor.timestamp || "").getFullYear()}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {renderActionButton(neighbor)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
