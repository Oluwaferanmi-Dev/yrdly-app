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
  text: string;
  content?: string;
  image_url: string | null;
  created_at: string;
  is_read: boolean;
}

interface V0ConversationScreenProps {
  conversationId: string;
}

export function V0ConversationScreen({ conversationId }: V0ConversationScreenProps) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Record<string, User>>({});
  const [newMessage, setNewMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch conversations and participants
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .contains('participant_ids', [user.id])
          .order('updated_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          return;
        }

        setConversations(conversationsData || []);

        // Find the selected conversation
        const conversation = conversationsData?.find(conv => conv.id === conversationId);
        if (conversation) {
          setSelectedConversation(conversation);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, [user, conversationId]);

  // Fetch participants
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchParticipants = async () => {
      try {
        const participantIds = selectedConversation.participant_ids;
        const { data: participantsData, error: participantsError } = await supabase
          .from('users')
          .select('id, name, email, avatar_url, created_at')
          .in('id', participantIds);

        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
          return;
        }

        const participantsMap: Record<string, User> = {};
        participantsData?.forEach(participant => {
          participantsMap[participant.id] = {
            ...participant,
            uid: participant.id,
            avatarUrl: participant.avatar_url,
            timestamp: participant.created_at,
          };
        });

        setParticipants(participantsMap);
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    };

    fetchParticipants();
  }, [selectedConversation]);

  // Fetch messages
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      try {
        console.log('Fetching messages for conversation:', selectedConversation.id);
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedConversation.id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return;
        }

        console.log('Fetched messages:', messagesData);
        setMessages(messagesData || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  // Mark all messages as read when conversation is opened
  useEffect(() => {
    if (!selectedConversation || !user) return;

    const markMessagesAsRead = async () => {
      try {
        // First, get all unread messages in this conversation
        const { data: unreadMessages, error: fetchError } = await supabase
          .from('messages')
          .select('id, read_by')
          .eq('conversation_id', selectedConversation.id)
          .neq('sender_id', user.id)
          .eq('is_read', false);

        if (fetchError) {
          console.error('Error fetching unread messages:', fetchError);
          return;
        }

        if (!unreadMessages || unreadMessages.length === 0) {
          return; // No unread messages to mark
        }

        // Update each message to mark as read and add user to read_by array
        for (const message of unreadMessages) {
          const currentReadBy = message.read_by || [];
          const updatedReadBy = [...currentReadBy, user.id];

          const { error: updateError } = await supabase
            .from('messages')
            .update({ 
              is_read: true,
              read_by: updatedReadBy
            })
            .eq('id', message.id);

          if (updateError) {
            console.error('Error updating message read status:', updateError);
          }
        }

        console.log('Marked all messages as read for conversation:', selectedConversation.id);
      } catch (error) {
        console.error('Error in markMessagesAsRead:', error);
      }
    };

    markMessagesAsRead();
  }, [selectedConversation, user]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages-${selectedConversation.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedMessage = payload.new as ChatMessage;
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          ));
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setMessages(prev => prev.filter(msg => msg.id !== deletedId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const getOtherParticipant = useCallback((conversation: Conversation) => {
    const otherId = conversation.participant_ids.find(id => id !== user?.id);
    return otherId ? participants[otherId] : null;
  }, [user?.id, participants]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConversation || !newMessage.trim() && !selectedFile) return;

    setSending(true);
    try {
      let imageUrl = null;
      
      if (selectedFile) {
        const { url, error } = await StorageService.uploadChatImage(selectedConversation.id, selectedFile);
        if (error) {
          console.error('Error uploading image:', error);
          return;
        }
        imageUrl = url;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          text: newMessage.trim() || (imageUrl ? 'Image' : ''),
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          is_read: true, // Mark as read for the sender
          read_by: [user.id], // Add sender to read_by array
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ 
          updated_at: new Date().toISOString(),
          last_message_text: newMessage.trim() || (imageUrl ? 'Image' : ''),
          last_message_timestamp: new Date().toISOString(),
          last_message_sender_id: user.id,
        })
        .eq('id', selectedConversation.id);

      setNewMessage("");
      setSelectedFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }, [user, selectedConversation, newMessage, selectedFile]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeImagePreview = useCallback(() => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/4" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedConversation) {
    return (
      <div className="flex flex-col h-full">
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
            <div className="text-center flex-1">
              <h2 className="text-lg font-semibold">Conversation not found</h2>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Conversation not found</h3>
            <p className="text-muted-foreground mb-4">
              This conversation doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Button onClick={() => router.push("/messages")}>
              Back to Messages
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant(selectedConversation);

  if (!otherParticipant) {
    return (
      <div className="flex flex-col h-full">
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
            <div className="text-center flex-1">
              <h2 className="text-lg font-semibold">Loading...</h2>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading participant...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm flex-shrink-0">
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
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
              {otherParticipant.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {otherParticipant.isOnline ? "Online" : "Last seen recently"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground">
                Start a conversation with {otherParticipant.name}
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const sender = participants[message.sender_id];
              const isOwnMessage = message.sender_id === user?.id;
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    isOwnMessage ? "justify-end" : "justify-start"
                  )}
                >
                  {!isOwnMessage && sender && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={sender.avatarUrl} alt={sender.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                        {sender.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[70%] rounded-lg px-3 py-2",
                      isOwnMessage
                        ? "bg-blue-500 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    )}
                  >
                    {message.image_url && (
                      <div className="mb-2">
                        <Image
                          src={message.image_url}
                          alt="Message image"
                          width={200}
                          height={200}
                          className="rounded-lg max-w-full h-auto"
                        />
                      </div>
                    )}
                    <p className="text-sm break-words">{message.text || message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative">
            {imagePreview && (
              <div className="mb-2 relative">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={100}
                  height={100}
                  className="rounded-lg max-w-20 h-20 object-cover"
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
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-12"
              disabled={sending}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={(!newMessage.trim() && !selectedFile) || sending}
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
