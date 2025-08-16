
"use client";

import type { Conversation, User, Message } from "../../types";
import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SendHorizonal, Search, ArrowLeft, Users } from "lucide-react";
import { Textarea } from "../ui/textarea";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useDebouncedCallback } from "use-debounce";
import { UserProfileDialog } from "../UserProfileDialog";
import { getFriendshipStatus } from "@/lib/user-actions";


interface NoFriendsEmptyStateProps {
    title?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
}

export function NoFriendsEmptyState({
    title = "Find your neighbors",
    description = "It looks like you haven't started any conversations yet. Once you do, they'll appear here.",
    buttonText = "Find Neighbors",
    buttonLink = "/neighbors",
}: NoFriendsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center bg-gray-50 dark:bg-gray-900/50 rounded-lg">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <Users className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-1">
        {title}
      </h3>
      <p className="mb-4 max-w-sm">
        {description}
      </p>
      <Button asChild>
        <Link href={buttonLink}>{buttonText}</Link>
      </Button>
    </div>
  );
}

interface ChatLayoutProps {
  conversations: Conversation[];
  currentUser: User;
  selectedConversationId?: string;
}

export function ChatLayout({
  conversations: initialConversations,
  currentUser,
  selectedConversationId,
}: ChatLayoutProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);

  // Update conversation list when prop changes
  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  // Pre-select a conversation if an ID is passed
  useEffect(() => {
    if (selectedConversationId) {
      const conversationToSelect = conversations.find(c => c.id === selectedConversationId);
      if (conversationToSelect) {
        setSelectedConversation(conversationToSelect);
      }
    }
  }, [selectedConversationId, conversations]);


  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
        'lastMessage.readBy': arrayUnion(currentUser.id)
    });
  }, [currentUser.id]);


  // Listen for messages in the selected conversation
  useEffect(() => {
    if (!selectedConversation?.id || !currentUser?.id) return;

    markMessagesAsRead(selectedConversation.id);

    const q = query(
      collection(db, "conversations", selectedConversation.id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribeMessages = onSnapshot(q, async (querySnapshot) => {
      const msgs: Message[] = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const msgData = docSnap.data();
          let sender: User;

          if (msgData.senderId === currentUser.id) {
            sender = currentUser;
          } else if (msgData.senderId === selectedConversation.participant.id) {
            sender = selectedConversation.participant;
          } else {
            const userDoc = await getDoc(doc(db, "users", msgData.senderId));
            sender = userDoc.exists()
              ? ({ id: userDoc.id, ...userDoc.data() } as User)
              : { id: msgData.senderId, uid: msgData.senderId, name: "Unknown", avatarUrl: "" };
          }

          return {
            id: docSnap.id,
            senderId: msgData.senderId,
            text: msgData.text,
            sender,
            timestamp:
              msgData.timestamp?.toDate().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }) || "...",
            isRead: msgData.read,
          };
        })
      );
      
      setMessages(msgs);
    });
    
    const convRef = doc(db, "conversations", selectedConversation.id);
    const unsubscribeConversation = onSnapshot(convRef, (doc) => {
        const data = doc.data();
        if(data?.typing && data.typing[selectedConversation.participant.id]) {
            setIsTyping(true);
        } else {
            setIsTyping(false);
        }
    });


    return () => {
        unsubscribeMessages();
        unsubscribeConversation();
    };
  }, [selectedConversation, currentUser, markMessagesAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);
  
  const debouncedUpdateTyping = useDebouncedCallback(async (isTyping: boolean) => {
      if (!selectedConversation) return;
      const conversationRef = doc(db, 'conversations', selectedConversation.id);
      try {
          await updateDoc(conversationRef, {
              [`typing.${currentUser.id}`]: isTyping
          });
      } catch (e) {
          console.error("Error updating typing status", e)
      }

  }, 2000);


  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewMessage(e.target.value);
      debouncedUpdateTyping.cancel();
      debouncedUpdateTyping(true);
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !selectedConversation) return;

    const conversationRef = doc(db, "conversations", selectedConversation.id);
    const messagesRef = collection(conversationRef, "messages");

    try {
        const messageData = {
          senderId: currentUser.id,
          text: newMessage,
          timestamp: serverTimestamp(),
        };
        
        await addDoc(messagesRef, messageData);

        await updateDoc(conversationRef, {
            lastMessage: {
                text: newMessage,
                senderId: currentUser.id,
                timestamp: serverTimestamp(),
                readBy: [currentUser.id]
            },
            [`typing.${currentUser.id}`]: false,
        });
        
        debouncedUpdateTyping.cancel();
        setNewMessage("");
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  return (
      <>
        {profileUser && (
            <UserProfileDialog 
                user={profileUser}
                open={!!profileUser}
                onOpenChange={(wasChanged) => setProfileUser(null)}
            />
        )}
        <Card className="h-[calc(100vh-10rem)] w-full flex overflow-hidden">
          {/* Conversation List */}
          <div
            className={cn(
              "w-full md:w-1/3 border-r transition-transform duration-300 ease-in-out flex flex-col",
              "md:translate-x-0",
              selectedConversation ? "-translate-x-full" : "translate-x-0"
            )}
          >
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search messages" className="pl-8" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {conversations.length > 0 ? (
                conversations.map((conv) => {
                  const isUnread = conv.lastMessage?.senderId !== currentUser.id && !conv.lastMessage?.isRead;
                  return (
                  <div
                    key={conv.id}
                    className={cn(
                      "flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50",
                      selectedConversation?.id === conv.id && "bg-muted/50"
                    )}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <Avatar>
                      <AvatarImage
                        src={conv.participant.avatarUrl}
                        alt={conv.participant.name}
                      />
                      <AvatarFallback>
                        {conv.participant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                      <p className="font-semibold">{conv.participant.name}</p>
                      <p className={cn("text-sm truncate", isUnread ? "text-foreground font-medium" : "text-muted-foreground")}>
                        {conv.lastMessage?.text}
                      </p>
                    </div>
                     {isUnread && <div className="h-3 w-3 rounded-full bg-primary" />}
                  </div>
                )})
              ) : (
                <div className="p-4">
                  <NoFriendsEmptyState 
                    title="No conversations"
                    description="You don't have any messages yet. Start a conversation with a friend!"
                    buttonText="Find Friends"
                    buttonLink="/neighbors"
                  />
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat View */}
          <div
            className={cn(
              "w-full md:w-2/3 flex flex-col absolute md:static inset-0 transition-transform duration-300 ease-in-out bg-background",
              "md:translate-x-0",
              selectedConversation ? "translate-x-0" : "translate-x-full"
            )}
          >
            {selectedConversation ? (
              <>
                <button
                    className="flex items-center gap-4 p-3 border-b hover:bg-muted/50"
                    onClick={() => setProfileUser(selectedConversation.participant)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={(e) => { e.stopPropagation(); setSelectedConversation(null); }}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage
                      src={selectedConversation.participant.avatarUrl}
                      alt={selectedConversation.participant.name}
                    />
                    <AvatarFallback>
                      {selectedConversation.participant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold">
                    {selectedConversation.participant.name}
                  </p>
                </button>
                <ScrollArea
                  ref={scrollAreaRef}
                  className="flex-1 p-4 bg-gray-50 dark:bg-gray-900"
                >
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-3",
                          msg.sender.id === currentUser.id
                            ? "justify-end"
                            : "justify-start"
                        )}
                      >
                        {msg.sender.id !== currentUser.id && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.sender.avatarUrl} />
                            <AvatarFallback>
                              {msg.sender.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "rounded-lg px-4 py-2 max-w-xs lg:max-w-md break-words",
                            msg.sender.id === currentUser.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border"
                          )}
                        >
                          <p>{msg.text}</p>
                          <p
                            className={cn(
                              "text-xs opacity-70 mt-1",
                              msg.sender.id === currentUser.id
                                ? "text-right"
                                : "text-left"
                            )}
                          >
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                     {isTyping && (
                      <div className="flex gap-3 justify-start">
                          <Avatar className="h-8 w-8">
                              <AvatarImage src={selectedConversation.participant.avatarUrl} />
                              <AvatarFallback>
                                  {selectedConversation.participant.name.charAt(0)}
                              </AvatarFallback>
                          </Avatar>
                          <div className="rounded-lg px-4 py-2 bg-card border animate-pulse">
                              typing...
                          </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t bg-card">
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2"
                  >
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
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!newMessage.trim()}
                    >
                      <SendHorizonal className="h-5 w-5" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground p-8">
                <NoFriendsEmptyState 
                    title="Select a conversation"
                    description="Choose one of your existing conversations to see the messages."
                    buttonText="Find Friends"
                    buttonLink="/neighbors"
                />
              </div>
            )}
          </div>
        </Card>
    </>
  );
}
