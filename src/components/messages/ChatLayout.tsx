
"use client";

import type { Conversation, User } from "@/types";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SendHorizonal, Search, MessageSquare, ArrowLeft } from "lucide-react";
import { Textarea } from "../ui/textarea";

interface ChatLayoutProps {
  conversations: Conversation[];
  currentUser: User;
}

export function ChatLayout({ conversations: initialConversations, currentUser }: ChatLayoutProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !selectedConversation) return;

    const message = {
      id: `m${Date.now()}`,
      sender: currentUser,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };

    const updatedConversations = conversations.map(conv => {
        if (conv.id === selectedConversation.id) {
            const newMessages = [...conv.messages, message];
            return {
                ...conv,
                messages: newMessages
            };
        }
        return conv;
    });

    setConversations(updatedConversations);
    setSelectedConversation(prev => prev ? updatedConversations.find(c => c.id === prev.id) || null : null);
    setNewMessage("");
  };
  
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
  }

  return (
    <Card className="h-[calc(100vh-10rem)] w-full flex overflow-hidden">
      {/* Conversation List - Hidden on mobile when a chat is open */}
      <div className={cn(
        "w-full md:w-1/3 border-r transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
        selectedConversation ? "-translate-x-full" : "translate-x-0"
      )}>
        <div className="p-4 border-b">
            <h2 className="text-xl font-bold mb-4 md:hidden">Messages</h2>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search messages" className="pl-8" />
            </div>
        </div>
        <ScrollArea className="h-[calc(100%-8rem)] md:h-[calc(100%-4.5rem)]">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50"
                onClick={() => handleSelectConversation(conv)}
              >
                <Avatar>
                  <AvatarImage src={conv.participant.avatarUrl} alt={conv.participant.name} data-ai-hint="person portrait"/>
                  <AvatarFallback>{conv.participant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                  <p className="font-semibold">{conv.participant.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{conv.messages[conv.messages.length - 1].text}</p>
                </div>
              </div>
            ))
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                <MessageSquare className="h-10 w-10 mb-2" />
                <p className="font-semibold">No conversations yet</p>
                <p className="text-sm">Start a new message to see it here.</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat View - Hides behind list on mobile */}
      <div className={cn(
        "w-full md:w-2/3 flex flex-col absolute md:static inset-0 transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
        selectedConversation ? "translate-x-0" : "translate-x-full"
      )}>
        {selectedConversation ? (
          <>
            <div className="flex items-center gap-4 p-4 border-b">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversation(null)}>
                  <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar>
                 <AvatarImage src={selectedConversation.participant.avatarUrl} alt={selectedConversation.participant.name} data-ai-hint="person portrait"/>
                <AvatarFallback>{selectedConversation.participant.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <p className="font-semibold">{selectedConversation.participant.name}</p>
            </div>
            <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
              <div className="space-y-4">
                {selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.sender.id === currentUser.id ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.sender.id !== currentUser.id && <Avatar className="h-8 w-8"><AvatarImage src={msg.sender.avatarUrl} data-ai-hint="person portrait" /><AvatarFallback>{msg.sender.name.charAt(0)}</AvatarFallback></Avatar>}
                    <div className={cn(
                        "rounded-lg px-4 py-2 max-w-xs lg:max-w-md break-words",
                        msg.sender.id === currentUser.id ? "bg-primary text-primary-foreground" : "bg-card"
                    )}>
                        <p>{msg.text}</p>
                        <p className={cn("text-xs opacity-70 mt-1", msg.sender.id === currentUser.id ? "text-right" : "text-left")}>{msg.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-card">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                    }
                  }}
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <SendHorizonal className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
             <div className="text-center">
                 <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="font-semibold">Select a conversation</p>
                <p className="text-sm">Choose a chat from the left to start messaging.</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
