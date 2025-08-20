
"use client";

import type { Conversation, User, Message } from "../../types";
import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SendHorizonal, Search, ArrowLeft, Users, ImagePlus, X } from "lucide-react";
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
  where,
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { UserProfileDialog } from "../UserProfileDialog";
import Image from "next/image";
import { Progress } from "../ui/progress";


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
  currentUser: User;
  selectedConversationId?: string;
}

export function ChatLayout({
  currentUser,
  selectedConversationId,
}: ChatLayoutProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendTypingStatus = useCallback(async (isTyping: boolean) => {
      if (!selectedConversation) return;
      const conversationRef = doc(db, 'conversations', selectedConversation.id);
      try {
          await updateDoc(conversationRef, {
              [`typing.${currentUser.id}`]: isTyping
          });
      } catch (e) {
          console.error("Error updating typing status", e)
      }
  }, [selectedConversation, currentUser.id]);

  const debouncedStopTyping = useDebouncedCallback(() => {
      sendTypingStatus(false);
  }, 2000);

  const [showChat, setShowChat] = useState(false);

  // Listen for real-time updates to conversations
  useEffect(() => {
    if (!currentUser?.id) return;

    const q = query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", currentUser.id)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const convsPromises = querySnapshot.docs.map(async (docSnap) => {
        const convData = docSnap.data();
        const otherParticipantId = convData.participantIds.find((id: string) => id !== currentUser.id);
        
        if (!otherParticipantId) return null;

        const userDoc = await getDoc(doc(db, 'users', otherParticipantId));
        if (!userDoc.exists()) return null;
        const participant = { id: userDoc.id, ...userDoc.data() } as User;

        const lastMessage = convData.lastMessage;

        return {
            id: docSnap.id,
            participantIds: convData.participantIds,
            participant,
            lastMessage: lastMessage ? {
                id: 'last',
                senderId: lastMessage.senderId,
                text: lastMessage.text,
                timestamp: lastMessage.timestamp,
                readBy: lastMessage.readBy || [],
            } : undefined,
        } as Conversation;
      });

      const resolvedConvs = (await Promise.all(convsPromises)).filter(Boolean) as Conversation[];
      setConversations(resolvedConvs);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  // Pre-select a conversation if an ID is passed
  useEffect(() => {
    const conversationToSelect = conversations.find(c => c.id === selectedConversationId);
    if (conversationToSelect) {
        setSelectedConversation(conversationToSelect);
        setShowChat(true);
    } else {
        setSelectedConversation(null);
        setShowChat(false);
    }
  }, [selectedConversationId, conversations]);

  const handleConversationSelect = (conv: Conversation) => {
      router.push(`/messages/${conv.id}`);
  }

  const handleBackToList = () => {
      setSelectedConversation(null);
      setShowChat(false);
      // Optional: if you are using query params to manage state
      // router.push('/messages'); 
  }

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
            imageUrl: msgData.imageUrl,
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
        debouncedStopTyping.cancel();
        sendTypingStatus(false); // Ensure typing status is false on unmount
    };
  }, [selectedConversation, currentUser, markMessagesAsRead, debouncedStopTyping, sendTypingStatus]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);


  const handleTyping = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewMessage(e.target.value);
      sendTypingStatus(true); // Send true immediately
      debouncedStopTyping(); // Start/reset debounce for sending false
  }, [sendTypingStatus, debouncedStopTyping]);
  
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((newMessage.trim() === "" && !imageFile) || !selectedConversation) return;

    const conversationRef = doc(db, "conversations", selectedConversation.id);
    const messagesRef = collection(conversationRef, "messages");

    try {
        let imageUrl = "";
        if (imageFile) {
            setUploadProgress(0);
            const storageRef = ref(storage, `chat_images/${selectedConversation.id}/${Date.now()}_${imageFile.name}`);
            const uploadTask = await uploadBytes(storageRef, imageFile);
imageUrl = await getDownloadURL(uploadTask.ref);
            setUploadProgress(100);
        }

        const messageData: Partial<Message> = {
          senderId: currentUser.id,
          timestamp: serverTimestamp() as any,
        };

        if (imageUrl) {
            messageData.imageUrl = imageUrl;
        }
        if (newMessage.trim() !== "") {
            messageData.text = newMessage;
        }
        
        await addDoc(messagesRef, messageData);

        await updateDoc(conversationRef, {
            lastMessage: {
                text: imageUrl ? "📷 Image" : newMessage,
                senderId: currentUser.id,
                timestamp: serverTimestamp(),
                readBy: [currentUser.id]
            },
            [`typing.${currentUser.id}`]: false,
        });
        
        debouncedStopTyping.cancel(); // Cancel any pending stop typing
        setNewMessage("");
        setImageFile(null);
        setImagePreview(null);
        setUploadProgress(null);
    } catch (error) {
      console.error("Error sending message: ", error);
      setUploadProgress(null);
    }
  }, [newMessage, imageFile, selectedConversation, currentUser.id, debouncedStopTyping]);

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

  const ConversationList = () => (
    <div className="h-full flex flex-col">
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
                    const isUnread = conv.lastMessage?.senderId !== currentUser.id && !conv.lastMessage?.readBy?.includes(currentUser.id);
                    return (
                        <div
                            key={conv.id}
                            className={cn(
                                "flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50",
                                selectedConversation?.id === conv.id && "bg-muted/50"
                            )}
                            onClick={() => handleConversationSelect(conv)}
                        >
                            <Avatar>
                                <AvatarImage src={conv.participant.avatarUrl} alt={conv.participant.name} />
                                <AvatarFallback>{conv.participant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 truncate">
                                <p className="font-semibold">{conv.participant.name}</p>
                                <p className={cn("text-sm truncate", isUnread ? "text-foreground font-medium" : "text-muted-foreground")}>
                                    {conv.lastMessage?.text}
                                </p>
                            </div>
                            {isUnread && <div className="h-3 w-3 rounded-full bg-primary" />}
                        </div>
                    )
                })
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
  );

  const ChatView = () => {
    if (!selectedConversation) {
        return (
            <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground p-8">
                <NoFriendsEmptyState
                    title="Select a conversation"
                    description="Choose one of your existing conversations to see the messages."
                    buttonText="Find Friends"
                    buttonLink="/neighbors"
                />
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
                <button className="flex items-center gap-2" onClick={() => setProfileUser(selectedConversation.participant)}>
                    <Avatar>
                        <AvatarImage src={selectedConversation.participant.avatarUrl} alt={selectedConversation.participant.name} />
                        <AvatarFallback>{selectedConversation.participant.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{selectedConversation.participant.name}</p>
                </button>
            </div>
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-gray-50 dark:bg-gray-900 min-h-0">
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn("flex gap-3", msg.sender.id === currentUser.id ? "justify-end" : "justify-start")}
                        >
                            {msg.sender.id !== currentUser.id && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={msg.sender.avatarUrl} />
                                    <AvatarFallback>{msg.sender.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn("rounded-lg px-3 py-2 max-w-xs lg:max-w-md break-words", msg.sender.id === currentUser.id ? "bg-primary text-primary-foreground" : "bg-card border")}>
                                {msg.imageUrl && (
                                    <div className="relative w-48 h-48 mb-2">
                                        <Image src={msg.imageUrl} alt="Chat image" layout="fill" className="rounded-md object-cover" />
                                    </div>
                                )}
                                {msg.text && <p>{msg.text}</p>}
                                <p className={cn("text-xs opacity-70 mt-1", msg.sender.id === currentUser.id ? "text-right" : "text-left")}>
                                    {msg.timestamp}
                                </p>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-3 justify-start">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={selectedConversation.participant.avatarUrl} />
                                <AvatarFallback>{selectedConversation.participant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="rounded-lg px-4 py-2 bg-card border animate-pulse">
                                typing...
                            </div>
                        </div>
                    )}
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
                        onBlur={() => debouncedStopTyping.flush()}
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
  }

  return (
      <>
        {profileUser && (
            <UserProfileDialog 
                user={profileUser}
                open={!!profileUser}
                onOpenChange={() => setProfileUser(null)}
            />
        )}
        <Card className="h-full w-full flex">
            <div className={cn("w-full md:w-1/3 border-r", { 'hidden md:flex': showChat })}>
                <ConversationList />
            </div>
            <div className={cn("w-full md:w-2/3", { 'hidden md:flex': !showChat })}>
                <ChatView />
            </div>
        </Card>
    </>
  );
}
