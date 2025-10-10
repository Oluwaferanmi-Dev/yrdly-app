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
import { ImagePlus, Send, MessageCircle, Users, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import Image from "next/image";

interface Conversation {
  id: string;
  participant_ids: string[];
  last_message_text: string | null;
  last_message_timestamp: string | null;
  last_message_sender_id: string | null;
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  text?: string; // Add text field for backward compatibility
  image_url: string | null;
  created_at: string;
  is_read: boolean;
}

interface NeighborChatLayoutProps {
  selectedConversationId?: string;
}

export function NeighborChatLayout({ selectedConversationId }: NeighborChatLayoutProps) {
  const { user, profile } = useAuth();
  const router = useRouter();
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
          .select(`
            *,
            messages(
              id,
              sender_id,
              is_read,
              read_by
            )
          `)
          .contains('participant_ids', [user.id.toString()])
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error loading conversations:', error);
          return;
        }

        // Calculate unread count for each conversation
        const conversationsWithUnreadCount = (data || []).map(conv => {
          // Check if the last message was sent by the current user
          // Messages are ordered by created_at ascending, so last message is at the end
          const lastMessage = conv.messages?.[conv.messages.length - 1];
          const lastMessageSentByUser = lastMessage?.sender_id === user.id;
          
          // If the user sent the last message, the chat should be considered read
          if (lastMessageSentByUser) {
            return {
              ...conv,
              unread_count: 0
            };
          }
          
          // Otherwise, count unread messages from other users
          const unreadCount = conv.messages?.filter((msg: any) => 
            msg.sender_id !== user.id && 
            (!msg.is_read || !msg.read_by?.includes(user.id))
          ).length || 0;
          
          return {
            ...conv,
            unread_count: unreadCount
          };
        });
        setConversations(conversationsWithUnreadCount);
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
        filter: `participant_ids.cs.{${user.id.toString()}}`
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

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation?.id && user?.id) {
      const markAsRead = async () => {
        try {
          await supabase.rpc('mark_messages_as_read', {
            p_conversation_id: selectedConversation.id,
            p_user_id: user.id
          });
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      };
      markAsRead();
    }
  }, [selectedConversation?.id, user?.id]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedConversation.id)
          .order('timestamp', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          return;
        }

        // Map database fields to component interface
        const mappedMessages = (data || []).map((msg: any) => {
          const senderName = participants[msg.sender_id]?.name || 'Unknown User';
          return {
            id: msg.id,
            conversation_id: msg.conversation_id,
            sender_id: msg.sender_id,
            sender_name: senderName,
            content: msg.text || '', // Map 'text' field to 'content'
            image_url: msg.image_url,
            created_at: msg.timestamp || msg.created_at,
            is_read: msg.is_read || false
          };
        });

        setMessages(mappedMessages);
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
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation.id}`
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id, participants]);

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
      const { data: messageData, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          text: newMessage.trim(),
          image_url: imageUrl,
          timestamp: new Date().toISOString(),
          is_read: true, // Mark as read for the sender
          read_by: [user.id], // Add sender to read_by array
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      // The trigger will automatically update the conversation's last message
      // But we can also update it manually to ensure it's immediate
      await supabase
        .from('conversations')
        .update({
          last_message_id: messageData.id,
          last_message_text: newMessage.trim(),
          last_message_sender_id: user.id,
          last_message_timestamp: new Date().toISOString(),
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
  }, [newMessage, imageFile, selectedConversation, user]);

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

  const getOtherParticipant = useCallback((conversation: Conversation) => {
    const otherId = conversation.participant_ids.find(id => id !== user?.id);
    return otherId ? participants[otherId] : null;
  }, [user?.id, participants]);

  const ConversationList = useMemo(() => (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          Messages
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse" />
                </div>
                <div className="h-3 w-3 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
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
                    "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 group",
                    selectedConversation?.id === conversation.id && "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                  )}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-slate-200 dark:ring-slate-600 group-hover:ring-blue-300 dark:group-hover:ring-blue-600 transition-all">
                    <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {otherParticipant.name.charAt(0)}
                      </AvatarFallback>
                  </Avatar>
                    {otherParticipant.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {otherParticipant.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {conversation.last_message_timestamp ? new Date(conversation.last_message_timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }) : ''}
                        </span>
                        {conversation.unread_count && conversation.unread_count > 0 && (
                          <div className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {conversation.last_message_text ? (
                        <>
                          {conversation.last_message_sender_id === user?.id ? 'You: ' : ''}
                          {conversation.last_message_text}
                        </>
                      ) : (
                        "No messages yet"
                      )}
                    </p>
                  </div>
                  {selectedConversation?.id === conversation.id && (
                    <div className="h-2 w-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
              <Users className="h-8 w-8 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">No conversations yet</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm">
              Start a conversation with your neighbors from the Community page.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  ), [conversations, loading, selectedConversation, user?.id, getOtherParticipant]);

  const ChatView = useMemo(() => {
    if (!selectedConversation) {
      return (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
              <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-fit mx-auto mb-6">
                <MessageCircle className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-slate-100">Select a conversation</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Choose a conversation from the list to start chatting with your neighbors.
              </p>
            </div>
          </div>
        </div>
      );
    }

    const otherParticipant = getOtherParticipant(selectedConversation);
    if (!otherParticipant) return null;

    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-800">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/messages")}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div 
              className="relative cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push(`/profile/${otherParticipant.id}`)}
            >
              <Avatar className="h-12 w-12 ring-2 ring-slate-200 dark:ring-slate-600">
            <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {otherParticipant.name.charAt(0)}
                </AvatarFallback>
          </Avatar>
              {otherParticipant.isOnline && (
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full" />
              )}
            </div>
            <div 
              className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push(`/profile/${otherParticipant.id}`)}
            >
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{otherParticipant.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {otherParticipant.isOnline ? 'Online' : 'Last seen recently'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full w-fit mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Start the conversation</h4>
                <p className="text-slate-600 dark:text-slate-400">Send a message to begin chatting with {otherParticipant.name}.</p>
              </div>
            ) : (
              messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.sender_id === user?.id ? "justify-end" : "justify-start"
                )}
              >
                {message.sender_id !== user?.id && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                        {otherParticipant.name.charAt(0)}
                      </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                      "rounded-2xl px-4 py-3 max-w-xs lg:max-w-md break-words shadow-sm",
                    message.sender_id === user?.id
                        ? "bg-blue-500 text-white rounded-br-md"
                        : "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-bl-md"
                  )}
                >
                  {message.image_url && (
                      <div className="relative w-full max-w-64 mb-2">
                      <Image
                        src={message.image_url}
                        alt="Chat image"
                        width={256}
                        height={256}
                        className="rounded-lg object-cover w-full h-auto max-h-64"
                      />
                    </div>
                  )}
                    {message.content && (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  <p
                    className={cn(
                        "text-xs mt-2 opacity-70",
                        message.sender_id === user?.id ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          {imagePreview && (
            <div className="mb-4 relative inline-block">
              <Image
                src={imagePreview}
                alt="Preview"
                width={128}
                height={128}
                className="w-32 h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={removeImagePreview}
              >
                &times;
              </Button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="pr-12 py-3 rounded-2xl border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ImagePlus className="h-5 w-5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
              </label>
            </div>
            <Button 
              type="submit" 
              disabled={(!newMessage.trim() && !imageFile) || uploading}
              className="px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {uploading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }, [selectedConversation, messages, user?.id, newMessage, imageFile, imagePreview, uploading, handleSendMessage, handleImageSelect, removeImagePreview, getOtherParticipant, router]);

  return (
    <div className="h-full w-full flex bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Mobile: Show only conversation list or chat view */}
      <div className="w-full md:w-1/3 border-r border-slate-200 dark:border-slate-700">
        {ConversationList}
      </div>
      <div className="hidden md:flex flex-1">
        {ChatView}
      </div>
      
      {/* Mobile chat view - shown when conversation is selected */}
      {selectedConversation && (
        <div className="md:hidden absolute inset-0 bg-white dark:bg-slate-800 z-10 flex flex-col">
          {/* Mobile Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm flex items-center gap-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedConversation(null)}
              className="p-2"
            >
              &larr;
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10">
                <AvatarImage src={getOtherParticipant(selectedConversation)?.avatarUrl} />
                <AvatarFallback>
                  {getOtherParticipant(selectedConversation)?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {getOtherParticipant(selectedConversation)?.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {getOtherParticipant(selectedConversation)?.isOnline ? 'Online' : 'Last seen recently'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Mobile Messages Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea ref={scrollAreaRef} className="h-full p-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full w-fit mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Start the conversation</h4>
                    <p className="text-slate-600 dark:text-slate-400">Send a message to begin chatting with {getOtherParticipant(selectedConversation)?.name}.</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.sender_id === user?.id ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.sender_id !== user?.id && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={getOtherParticipant(selectedConversation)?.avatarUrl} alt={getOtherParticipant(selectedConversation)?.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {getOtherParticipant(selectedConversation)?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 max-w-xs lg:max-w-md break-words shadow-sm",
                          message.sender_id === user?.id
                            ? "bg-blue-500 text-white rounded-br-md"
                            : "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-bl-md"
                        )}
                      >
                        {message.image_url && (
                          <div className="relative w-full max-w-64 mb-2">
                            <Image
                              src={message.image_url}
                              alt="Chat image"
                              width={256}
                              height={256}
                              className="rounded-lg object-cover w-full h-auto max-h-64"
                            />
                          </div>
                        )}
                        {(message.content || message.text) && (
                          <p className="whitespace-pre-wrap">{message.content || message.text}</p>
                        )}
                        <p
                          className={cn(
                            "text-xs mt-2 opacity-70",
                            message.sender_id === user?.id ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
                          )}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Mobile Message Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
          {imagePreview && (
              <div className="mb-4 relative inline-block">
              <Image
                src={imagePreview}
                alt="Preview"
                width={128}
                height={128}
                className="w-32 h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={removeImagePreview}
              >
                  &times;
              </Button>
            </div>
          )}
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="pr-12 py-3 rounded-2xl border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  disabled={uploading}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="mobile-image-upload"
                />
                <label
                  htmlFor="mobile-image-upload"
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <ImagePlus className="h-5 w-5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
                </label>
              </div>
              <Button 
                type="submit" 
                disabled={(!newMessage.trim() && !imageFile) || uploading}
                className="px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {uploading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
        </div>
      </div>
      )}
      </div>
  );
}
