"use client";

import type { ItemChat, ChatMessage } from "../../types/chat";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SendHorizonal, Search, ArrowLeft, ShoppingBag, ImagePlus, X } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { ChatService } from "@/lib/chat-service";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Progress } from "../ui/progress";
import { OnlineStatusService } from "@/lib/online-status";
import { AvatarOnlineIndicator } from "../ui/online-indicator";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@/types";

// Helper function to format date for display
const formatMessageDate = (timestamp: Date) => {
  if (!timestamp) return "";
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDate = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());
  
  if (messageDate.getTime() === today.getTime()) {
    return "Today";
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    return timestamp.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
};

// Helper function to check if two timestamps are on different dates
const isDifferentDate = (timestamp1: Date, timestamp2: Date) => {
  if (!timestamp1 || !timestamp2) return false;
  
  return timestamp1.toDateString() !== timestamp2.toDateString();
};

interface MarketplaceChatLayoutProps {
  currentUser: User;
  selectedChatId?: string;
}

export function MarketplaceChatLayout({
  currentUser,
  selectedChatId,
}: MarketplaceChatLayoutProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [chats, setChats] = useState<ItemChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<ItemChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [buyer, setBuyer] = useState<User | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showChat, setShowChat] = useState(false);
  const [onlineStatuses, setOnlineStatuses] = useState<{ [userId: string]: boolean }>({});

  // Initialize online status tracking for current user
  useEffect(() => {
    if (currentUser?.uid) {
      OnlineStatusService.getInstance().initialize(currentUser.uid);
      
      return () => {
        OnlineStatusService.getInstance().cleanup();
      };
    }
  }, [currentUser?.uid]);

  // Track online status of chat participants
  useEffect(() => {
    if (!currentUser?.uid) return;

    const participants = chats.map(chat => ({ uid: chat.buyerId }));
    const unsubscribeFunctions: (() => void)[] = [];

    participants.forEach(participant => {
      const unsubscribe = OnlineStatusService.listenToUserOnlineStatus(participant.uid, (status) => {
        setOnlineStatuses(prev => ({
          ...prev,
          [participant.uid]: status.isOnline
        }));
      });
      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser?.uid, chats]);

  // Load seller chats
  useEffect(() => {
    if (!currentUser?.uid) return;

    const loadChats = async () => {
      try {
        const sellerChats = await ChatService.getSellerChats(currentUser.uid);
        setChats(sellerChats);
      } catch (error) {
        console.error("Error loading seller chats:", error);
      }
    };

    loadChats();
  }, [currentUser?.uid]);

  // Pre-select a chat if an ID is passed
  useEffect(() => {
    const chatToSelect = chats.find(c => c.id === selectedChatId);
    if (chatToSelect) {
      setSelectedChat(chatToSelect);
      setShowChat(true);
    } else {
      setSelectedChat(null);
      setShowChat(false);
    }
  }, [selectedChatId, chats]);

  const handleChatSelect = (chat: ItemChat) => {
    router.push(`/messages/marketplace/${chat.id}`);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    setShowChat(false);
  };

  // Load buyer information when chat is selected
  useEffect(() => {
    if (!selectedChat?.buyerId) return;

    const loadBuyer = async () => {
      try {
        const buyerDoc = await getDoc(doc(db, 'users', selectedChat.buyerId));
        if (buyerDoc.exists()) {
          setBuyer({ id: buyerDoc.id, ...buyerDoc.data() } as User);
        }
      } catch (error) {
        console.error("Error loading buyer:", error);
      }
    };

    loadBuyer();
  }, [selectedChat?.buyerId]);

  // Listen for messages in the selected chat
  useEffect(() => {
    if (!selectedChat?.id || !currentUser?.uid) return;

    const unsubscribe = ChatService.subscribeToChat(selectedChat.id, (messages) => {
      setMessages(messages);
    });

    return () => unsubscribe();
  }, [selectedChat, currentUser.uid]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleTyping = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  }, []);
  
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((newMessage.trim() === "" && !imageFile) || !selectedChat || !user) return;

    try {
      await ChatService.sendMessage(
        selectedChat.id,
        user.uid,
        user.displayName || 'Anonymous',
        newMessage.trim(),
        'text'
      );
      
      setNewMessage("");
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress(null);
    } catch (error) {
      console.error("Error sending message: ", error);
      setUploadProgress(null);
    }
  }, [newMessage, imageFile, selectedChat, user]); // Include all dependencies

  // Chat input is now inlined to prevent focus loss

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImagePreview = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const ChatList = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-4">Marketplace Chats</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search marketplace chats" className="pl-8" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {chats.length > 0 ? (
          chats.map((chat) => {
            const isUnread = chat.lastMessage?.senderId !== currentUser.uid && !chat.lastMessage?.isRead;
            return (
              <div
                key={chat.id}
                className={cn(
                  "flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50",
                  selectedChat?.id === chat.id && "bg-muted/50"
                )}
                onClick={() => handleChatSelect(chat)}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={chat.itemImageUrl} alt={chat.itemTitle} />
                    <AvatarFallback>
                      <ShoppingBag className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 truncate">
                  <p className="font-semibold">{chat.itemTitle}</p>
                  <p className={cn("text-sm truncate", isUnread ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {chat.lastMessage?.content || "No messages yet"}
                  </p>
                </div>
                {isUnread && <div className="h-3 w-3 rounded-full bg-primary" />}
              </div>
            );
          })
        ) : (
          <div className="p-4">
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <ShoppingBag className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1">
                No marketplace chats
              </h3>
              <p className="mb-4 max-w-sm">
                You don&apos;t have any marketplace chats yet. When buyers contact you about your items, they&apos;ll appear here.
              </p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const ChatView = () => {
    if (!selectedChat || !buyer) {
      return (
        <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground p-8">
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-1">
              Select a marketplace chat
            </h3>
            <p className="mb-4 max-w-sm">
              Choose one of your marketplace chats to see the messages.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 p-3 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={handleBackToList}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Avatar>
                <AvatarImage src={buyer.avatarUrl} alt={buyer.name} />
                <AvatarFallback>{buyer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <AvatarOnlineIndicator 
                isOnline={onlineStatuses[buyer.uid] || false} 
              />
            </div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{buyer.name}</p>
              <span className="text-sm text-muted-foreground">•</span>
              <p className="text-sm text-muted-foreground">{selectedChat.itemTitle}</p>
            </div>
          </div>
        </div>
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-gray-50 dark:bg-gray-900 min-h-0">
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const showDateSeparator = index === 0 || 
                (messages[index - 1] && 
                 isDifferentDate(
                   messages[index - 1].timestamp, 
                   msg.timestamp
                 ));
              
              return (
                <div key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-4">
                      <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
                        {formatMessageDate(msg.timestamp)}
                      </div>
                    </div>
                  )}
                  <div
                    className={cn("flex gap-3", msg.senderId === currentUser.uid ? "justify-end" : "justify-start")}
                  >
                    {msg.senderId !== currentUser.uid && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={buyer.avatarUrl} />
                        <AvatarFallback>{buyer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("rounded-lg px-3 py-2 max-w-xs lg:max-w-md break-words", msg.senderId === currentUser.uid ? "bg-primary text-primary-foreground" : "bg-card border")}>
                      {msg.metadata?.imageUrl && (
                        <div className="relative w-48 h-48 mb-2">
                          <Image src={msg.metadata.imageUrl} alt="Chat image" layout="fill" className="rounded-md object-cover" />
                        </div>
                      )}
                      {msg.content && <p>{msg.content}</p>}
                      <p className={cn("text-xs opacity-70 mt-1", msg.senderId === currentUser.uid ? "text-right" : "text-left")}>
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-card">
          {imagePreview && (
            <div className="relative w-24 h-24 mb-2">
              <Image src={imagePreview} alt="Image preview" layout="fill" className="rounded-md object-cover" />
              <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImagePreview}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {uploadProgress !== null && <Progress value={uploadProgress} className="mb-2" />}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="h-5 w-5" />
            </Button>
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleTyping}
              className="flex-1 resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={(!newMessage.trim() && !imageFile) || uploadProgress !== null}>
              <SendHorizonal className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full w-full flex">
      <div className={cn("w-full md:w-1/3 border-r", { 'hidden md:flex': showChat })}>
        <ChatList />
      </div>
      <div className={cn("w-full md:w-2/3", { 'hidden md:flex': !showChat })}>
        <ChatView />
      </div>
    </Card>
  );
}
