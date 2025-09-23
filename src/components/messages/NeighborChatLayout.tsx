"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { StorageService } from "@/lib/storage-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImagePlus, Send, MessageCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface Conversation {
  id: string;
  participant_ids: string[];
  last_message: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  image_url: string | null;
  created_at: string;
  is_read: boolean;
}

interface NeighborChatLayoutProps {
  selectedConversationId?: string;
}

export function NeighborChatLayout({ selectedConversationId }: NeighborChatLayoutProps) {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [participants, setParticipants] = useState<{ [userId: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user?.id) return;

    const loadConversations = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .contains('participant_ids', [user.id])
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error loading conversations:', error);
          return;
        }

        setConversations(data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error loading conversations:', error);
        setLoading(false);
      }
    };

    loadConversations();

    // Set up real-time subscription for conversations
    const channel = supabase
      .channel('conversations')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations',
        filter: `participant_ids.cs.{${user.id}}`
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Load participants for all conversations
  useEffect(() => {
    if (conversations.length === 0) return;

    const loadParticipants = async () => {
      const allParticipantIds = new Set<string>();
      conversations.forEach(conv => {
        conv.participant_ids.forEach(id => allParticipantIds.add(id));
      });

      const participantsData: { [userId: string]: User } = {};
      
      for (const userId of allParticipantIds) {
        if (userId === user?.id) continue; // Skip current user
        
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (userData && !error) {
            participantsData[userId] = {
              id: userData.id,
              uid: userData.id,
              name: userData.name,
              avatarUrl: userData.avatar_url || 'https://placehold.co/100x100.png',
              email: userData.email || '',
              bio: userData.bio || '',
              location: userData.location || { state: '', lga: '' },
              friends: userData.friends || [],
              blockedUsers: userData.blocked_users || [],
              notificationSettings: userData.notification_settings || {},
              isOnline: userData.is_online || false,
              lastSeen: userData.last_seen ? new Date(userData.last_seen) as any : null,
              timestamp: userData.created_at ? new Date(userData.created_at) as any : null,
            } as User;
          }
        } catch (error) {
          console.error(`Error loading user ${userId}:`, error);
        }
      }
      
      setParticipants(participantsData);
    };

    loadParticipants();
  }, [conversations, user?.id]);

  // Select conversation if ID is provided
  useEffect(() => {
    if (selectedConversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === selectedConversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [selectedConversationId, conversations]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', selectedConversation.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          return;
        }

        setMessages(data || []);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();

    // Set up real-time subscription for messages
    const channel = supabase
      .channel(`messages-${selectedConversation.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `conversation_id=eq.${selectedConversation.id}`
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((newMessage.trim() === "" && !imageFile) || !selectedConversation || !user) return;

    try {
      let imageUrl: string | null = null;
      
      // Upload image if one is selected
      if (imageFile) {
        setUploading(true);
        const { url, error: uploadError } = await StorageService.uploadChatImage(user.id, imageFile);
        if (uploadError) {
          console.error('Image upload error:', uploadError);
          throw uploadError;
        }
        imageUrl = url;
      }

      // Send message
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          sender_name: profile?.name || user.user_metadata?.name || 'Anonymous',
          content: newMessage.trim(),
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          is_read: false,
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      // Update conversation's last message
      await supabase
        .from('conversations')
        .update({
          last_message: newMessage.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedConversation.id);
      
      setNewMessage("");
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setUploading(false);
    }
  }, [newMessage, imageFile, selectedConversation, user, profile?.name]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeImagePreview = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
  }, []);

  const getOtherParticipant = (conversation: Conversation) => {
    const otherId = conversation.participant_ids.find(id => id !== user?.id);
    return otherId ? participants[otherId] : null;
  };

  const ConversationList = useMemo(() => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Conversations
        </h2>
      </div>
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length > 0 ? (
          <div className="p-2">
            {conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              if (!otherParticipant) return null;

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50",
                    selectedConversation?.id === conversation.id && "bg-muted"
                  )}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
                    <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{otherParticipant.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message || "No messages yet"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
            <p className="text-muted-foreground">
              Start a conversation with your neighbors from the Community page.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  ), [conversations, loading, selectedConversation, participants, user?.id]);

  const ChatView = useMemo(() => {
    if (!selectedConversation) {
      return (
        <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground p-8">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
            <p>Choose a conversation from the list to start chatting.</p>
          </div>
        </div>
      );
    }

    const otherParticipant = getOtherParticipant(selectedConversation);
    if (!otherParticipant) return null;

    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
            <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherParticipant.name}</h3>
            <p className="text-sm text-muted-foreground">Neighbor</p>
          </div>
        </div>
        
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.sender_id === user?.id ? "justify-end" : "justify-start"
                )}
              >
                {message.sender_id !== user?.id && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
                    <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-xs lg:max-w-md break-words",
                    message.sender_id === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border"
                  )}
                >
                  {message.image_url && (
                    <div className="relative w-48 h-48 mb-2">
                      <img
                        src={message.image_url}
                        alt="Chat image"
                        className="rounded-md object-cover w-full h-full"
                      />
                    </div>
                  )}
                  {message.content && <p>{message.content}</p>}
                  <p
                    className={cn(
                      "text-xs opacity-70 mt-1",
                      message.sender_id === user?.id ? "text-right" : "text-left"
                    )}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="pr-20"
                disabled={uploading}
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <ImagePlus className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </label>
            </div>
            <Button type="submit" disabled={(!newMessage.trim() && !imageFile) || uploading}>
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          {imagePreview && (
            <div className="mt-2 relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={removeImagePreview}
              >
                ×
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }, [selectedConversation, messages, user?.id, participants, newMessage, imageFile, imagePreview, uploading, handleSendMessage, handleImageSelect, removeImagePreview]);

  return (
    <Card className="h-full w-full flex">
      <div className="w-full md:w-1/3 border-r">
        {ConversationList}
      </div>
      <div className="flex-1">
        {ChatView}
      </div>
    </Card>
  );
}
