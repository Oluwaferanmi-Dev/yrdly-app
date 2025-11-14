"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageCircle, Store, Users, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ActivityIndicator } from "@/components/ActivityIndicator";
import type { User } from "@/types";
import Image from "next/image";

// Helper function to deduplicate conversations
function deduplicateConversations(conversations: Conversation[]): Conversation[] {
  const seen = new Map<string, Conversation>();
  
  for (const conv of conversations) {
    let key: string;
    
    if (conv.type === 'business') {
      // For business conversations, create a unique key based on business_id and catalog_item_id
      const context = conv.context as any;
      const catalogItemId = context?.catalog_item_id || undefined;
      if (catalogItemId) {
        // Catalog item conversation - key by business_id + catalog_item_id
        key = `business:${conv.participantId}:catalog:${catalogItemId}`;
      } else {
        // General business conversation - key by business_id only
        key = `business:${conv.participantId}`;
      }
    } else if (conv.type === 'marketplace') {
      // For marketplace, key by participant and item
      const itemId = conv.context?.itemId || 'general';
      key = `marketplace:${conv.participantId}:item:${itemId}`;
    } else {
      // For friend conversations, key by participant
      key = `friend:${conv.participantId}`;
    }
    
    // If we've seen this key before, keep the one with the most recent timestamp
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, conv);
    } else {
      // Compare timestamps - keep the more recent one
      const existingDate = new Date(existing.timestamp);
      const currentDate = new Date(conv.timestamp);
      if (currentDate > existingDate) {
        seen.set(key, conv);
      }
    }
  }
  
  return Array.from(seen.values());
}

interface Conversation {
  id: string;
  type: "friend" | "marketplace" | "business";
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  context?: {
    itemId?: string;
    itemTitle?: string;
    itemImage?: string;
    itemPrice?: number;
    businessId?: string;
    businessName?: string;
    businessLogo?: string;
    catalog_item_id?: string; // For catalog item conversations
  };
}

interface MessagesScreenProps {
  onOpenChat?: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export function MessagesScreen({ onOpenChat, selectedConversationId }: MessagesScreenProps) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "friends" | "marketplace" | "businesses">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            *,
            messages(
              id,
              sender_id,
              is_read,
              read_by
            )
          `)
          .contains('participant_ids', [user.id])
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          return;
        }

        if (conversationsData && conversationsData.length > 0) {
        }

        // Count unread messages for each conversation
        const conversationsWithUnreadCount = await Promise.all((conversationsData || []).map(async (conv) => {
          if (conv.type === 'marketplace') {
            const { data: chatMessages, error: chatMessagesError } = await supabase
              .from('chat_messages')
              .select('sender_id, created_at')
              .eq('chat_id', conv.id)
              .order('created_at', { ascending: true });

            if (chatMessagesError) {
              console.error('Error fetching chat messages:', chatMessagesError);
              return { ...conv, unread_count: 0 };
            }

            if (!chatMessages || chatMessages.length === 0) {
              return {
                ...conv,
                unread_count: 0
              };
            }

            const lastMessage = chatMessages?.[chatMessages.length - 1];
            const lastMessageSentByUser = lastMessage?.sender_id === user.id;
            
            // If you sent the last message, consider it read
            if (lastMessageSentByUser) {
              return {
                ...conv,
                unread_count: 0
              };
            }
            
            // Count messages from others as unread
            const unreadCount = chatMessages?.filter((msg: any) => 
              msg.sender_id !== user.id
            ).length || 0;
            
            return {
              ...conv,
              unread_count: unreadCount
            };
          } else {
            const lastMessage = conv.messages?.[conv.messages.length - 1];
            const lastMessageSentByUser = lastMessage?.sender_id === user.id;
            
            // If you sent the last message, consider it read
            if (lastMessageSentByUser) {
              return {
                ...conv,
                unread_count: 0
              };
            }
            
            // Count unread messages from others
            const unreadCount = conv.messages?.filter((msg: any) => 
              msg.sender_id !== user.id && 
              (!msg.is_read || !msg.read_by?.includes(user.id))
            ).length || 0;
            
            return {
              ...conv,
              unread_count: unreadCount
            };
          }
        }));

        const transformedConversations: Conversation[] = conversationsWithUnreadCount.map(conv => {
          const otherParticipantId = conv.participant_ids?.find((id: string) => id !== user.id);
          
          if (conv.type === 'business') {
            // Extract catalog_item_id from context JSONB if present
            const contextData = conv.context as { catalog_item_id?: string; catalog_item_business_id?: string } | null;
            const catalogItemId = contextData?.catalog_item_id || undefined; // Convert null to undefined
            
            return {
              id: conv.id,
              type: conv.type as "friend" | "marketplace" | "business",
              participantId: conv.business_id || conv.id,
              participantName: conv.business_name || "Business",
              participantAvatar: conv.business_logo || "/placeholder.svg",
              lastMessage: conv.last_message_text || conv.last_message || "No messages yet",
              timestamp: new Date(conv.updated_at).toLocaleDateString(),
              unreadCount: conv.unread_count || 0,
              isOnline: false,
              context: {
                businessId: conv.business_id,
                businessName: conv.business_name,
                businessLogo: conv.business_logo,
                // Include catalog item context if present
                catalog_item_id: catalogItemId, // Store catalog item ID for deduplication
                itemId: conv.item_id,
                itemTitle: conv.item_title,
                itemImage: conv.item_image,
                itemPrice: conv.item_price
              }
            };
          }

          if (conv.type === 'marketplace') {
            return {
              id: conv.id,
              type: conv.type as "friend" | "marketplace" | "business",
              participantId: otherParticipantId || conv.id,
              participantName: "Unknown User", // We'll fetch this separately
              participantAvatar: "/placeholder.svg",
              lastMessage: conv.last_message_text || conv.last_message || "No messages yet",
              timestamp: new Date(conv.updated_at).toLocaleDateString(),
              unreadCount: conv.unread_count || 0,
              isOnline: false,
              context: {
                itemTitle: conv.item_title,
                itemImage: conv.item_image,
                itemPrice: conv.item_price
              }
            };
          }
          
          return {
            id: conv.id,
            type: conv.type as "friend" | "marketplace" | "business",
            participantId: otherParticipantId || conv.id,
            participantName: "Unknown User", // We'll fetch this separately
            participantAvatar: "/placeholder.svg",
            lastMessage: conv.last_message_text || conv.last_message || "No messages yet",
            timestamp: new Date(conv.updated_at).toLocaleDateString(),
            unreadCount: conv.unread_count || 0,
            isOnline: false, // You can implement online status later
            context: conv.context
          };
        });

        // Deduplicate conversations - especially important for business conversations
        const deduplicatedConversations = deduplicateConversations(transformedConversations);
        
        setConversations(deduplicatedConversations);
        
        const fetchParticipantDetails = async () => {
          const participantIds = transformedConversations
            .filter(conv => conv.type !== 'business')
            .map(conv => conv.participantId)
            .filter(id => id !== user.id);
          
          if (participantIds.length > 0) {
            const { data: usersData, error: usersError } = await supabase
              .from('users')
              .select('id, name, avatar_url')
              .in('id', participantIds);
            
            if (!usersError && usersData) {
              setConversations(prevConversations => 
                prevConversations.map(conv => {
                  if (conv.type === 'business') return conv;
                  
                  const participant = usersData.find(user => user.id === conv.participantId);
                  if (participant) {
                    return {
                      ...conv,
                      participantName: participant.name || "Unknown User",
                      participantAvatar: participant.avatar_url || "/placeholder.svg"
                    };
                  }
                  return conv;
                })
              );
            }
          }
        };
        
        fetchParticipantDetails();
        setLoading(false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    };

    fetchConversations();

    // Set up real-time subscription for conversations
    const channel = supabase
      .channel('conversations')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations',
        filter: `participant_ids.cs.{${user.id}}`
      }, (payload) => {
        fetchConversations(); // Refresh conversations
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `read_by.cs.{${user.id}}`
      }, (payload) => {
        // TODO: Refresh conversations to update unread counts
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (selectedConversationId && conversations.length > 0) {
      const conversation = conversations.find(conv => conv.id === selectedConversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    } else {
      setSelectedConversation(null);
    }
  }, [selectedConversationId, conversations]);

  useEffect(() => {
    if (!selectedConversationId) {
      setSelectedConversation(null);
    }
  }, [selectedConversationId]);


  const filteredConversations = useMemo(() => {
    const matchesTab = (conv: Conversation) => {
      if (activeTab === "all") return true;
      if (activeTab === "friends") {
        return conv.type !== "marketplace" && conv.type !== "business";
      }
      if (activeTab === "marketplace" && conv.type === "marketplace") return true;
      if (activeTab === "businesses" && conv.type === "business") return true;
      return false;
    };

    const matchesSearch = (conv: Conversation) => {
      if (!searchQuery) return true;
      return conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    };

    const filtered = conversations.filter(conv => matchesTab(conv) && matchesSearch(conv));
    return filtered;
  }, [conversations, activeTab, searchQuery]);

  const unreadCounts = useMemo(() => {
    return {
      all: conversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
      friends: conversations.filter(c => c.type !== "marketplace" && c.type !== "business").reduce((sum, conv) => sum + conv.unreadCount, 0),
      marketplace: conversations.filter(c => c.type === "marketplace").reduce((sum, conv) => sum + conv.unreadCount, 0),
      businesses: conversations.filter(c => c.type === "business").reduce((sum, conv) => sum + conv.unreadCount, 0),
    };
  }, [conversations]);


  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 border-b border-border bg-card">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Messages</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Stay connected with your community</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border focus:border-primary text-sm"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted h-10 sm:h-12">
            <TabsTrigger value="friends" className="text-xs sm:text-sm relative flex items-center px-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="hidden xs:inline">Friends</span>
              <span className="xs:hidden">Fr</span>
              {unreadCounts.friends > 0 && (
                <Badge className="ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                  {unreadCounts.friends}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="text-xs sm:text-sm relative flex items-center px-2">
              <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="hidden xs:inline">Market</span>
              <span className="xs:hidden">Mk</span>
              {unreadCounts.marketplace > 0 && (
                <Badge className="ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                  {unreadCounts.marketplace}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="businesses" className="text-xs sm:text-sm relative flex items-center px-2">
              <Store className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="hidden xs:inline">Business</span>
              <span className="xs:hidden">Bs</span>
              {unreadCounts.businesses > 0 && (
                <Badge className="ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                  {unreadCounts.businesses}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm relative flex items-center px-2">
              All
              {unreadCounts.all > 0 && (
                <Badge className="ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                  {unreadCounts.all}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 sm:p-8">
            <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No conversations yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {searchQuery
                ? "No conversations match your search"
                : "Start chatting with neighbors, sellers, or businesses"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <Link key={conversation.id} href={`/messages/${conversation.id}`}>
              <Card className="p-3 sm:p-4 yrdly-shadow hover:shadow-lg transition-all cursor-pointer hover:border-primary/50">
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                      <AvatarImage src={conversation.participantAvatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                        {conversation.participantName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ActivityIndicator 
                      userId={conversation.participantId} 
                      size="sm"
                      className="absolute -bottom-1 -right-1"
                    />
                    <div className="absolute -top-1 -right-1">
                      {conversation.type === "marketplace" && (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-accent text-accent-foreground rounded-full flex items-center justify-center">
                          <ShoppingBag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </div>
                      )}
                      {conversation.type === "business" && (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                          <Store className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-foreground truncate text-sm sm:text-base">{conversation.participantName}</h4>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{conversation.timestamp}</span>
                    </div>

                    {(conversation.type === "marketplace" || conversation.type === "business") && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-lg">
                        <Image
                          src={
                            conversation.type === "marketplace" 
                              ? (conversation.context?.itemImage || "/placeholder.svg")
                              : (conversation.context?.itemImage || conversation.context?.businessLogo || "/placeholder.svg")
                          }
                          alt=""
                          width={40}
                          height={40}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {conversation.type === "marketplace" 
                              ? (conversation.context?.itemTitle || "Item")
                              : (conversation.context?.itemTitle || conversation.context?.businessName || "Business")
                            }
                          </p>
                          {(conversation.type === "marketplace" || (conversation.type === "business" && conversation.context?.itemPrice)) && conversation.context?.itemPrice && (
                            <p className="text-xs font-semibold text-primary">
                              ₦{conversation.context.itemPrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                  </div>

                  {/* Unread badge */}
                  {conversation.unreadCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground flex-shrink-0 text-xs h-5 w-5 p-0 flex items-center justify-center">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

