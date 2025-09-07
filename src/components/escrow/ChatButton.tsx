"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { ChatService } from '@/lib/chat-service';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

interface ChatButtonProps {
  itemId: string;
  itemTitle: string;
  itemImageUrl: string;
  sellerId: string;
  sellerName: string;
}

export function ChatButton({ itemId, itemTitle, itemImageUrl, sellerId, sellerName }: ChatButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenChat = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to chat with sellers",
        variant: "destructive",
      });
      return;
    }

    if (user.uid === sellerId) {
      toast({
        title: "Error",
        description: "You cannot chat with yourself",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get or create chat
      const chatId = await ChatService.getOrCreateChat(
        itemId,
        user.uid,
        sellerId,
        itemTitle,
        itemImageUrl
      );

      // Redirect to marketplace chat
      router.push(`/messages/marketplace/${chatId}`);
    } catch (error) {
      console.error('Failed to open chat:', error);
      toast({
        title: "Error",
        description: "Failed to open chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full border-gray-300 hover:bg-gray-50"
      onClick={handleOpenChat}
      disabled={isLoading}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      {isLoading ? 'Opening...' : 'Chat with Seller'}
    </Button>
  );
}
