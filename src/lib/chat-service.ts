import { supabase } from '@/lib/supabase';
import { ChatMessage, ItemChat, ChatParticipant } from '@/types/chat';

/**
 * Unified Chat Service for marketplace item chats
 * Consolidates functionality from both chat-service.ts and supabase-chat-service.ts
 */
export class ChatService {
  /**
   * Create or get existing chat for an item
   * Also creates a corresponding entry in conversations table for unified messaging
   */
  static async getOrCreateChat(
    itemId: string,
    buyerId: string,
    sellerId: string,
    itemTitle: string,
    itemImageUrl: string
  ): Promise<string> {
    try {
      // Check if chat already exists
      const { data: existingChats, error: fetchError } = await supabase
        .from('item_chats')
        .select('id')
        .eq('item_id', itemId)
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .limit(1);

      if (fetchError) {
        console.error('Error fetching existing chat:', fetchError);
        throw fetchError;
      }

      if (existingChats && existingChats.length > 0) {
        return existingChats[0].id;
      }

      // Create new chat in item_chats table
      const now = new Date().toISOString();
      const { data: newChat, error: createError } = await supabase
        .from('item_chats')
        .insert({
          item_id: itemId,
          buyer_id: buyerId,
          seller_id: sellerId,
          item_title: itemTitle,
          item_image_url: itemImageUrl,
          last_message_at: now,
          is_active: true,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating chat:', createError);
        throw createError;
      }

      // Also create conversation in conversations table for unified messaging view
      const { error: conversationCreateError } = await supabase
        .from('conversations')
        .insert({
          id: newChat.id,
          type: 'marketplace',
          participant_ids: [buyerId, sellerId],
          item_title: itemTitle,
          item_image: itemImageUrl,
          created_at: now,
          updated_at: now
        });

      if (conversationCreateError) {
        console.error('Error creating conversation:', conversationCreateError);
        // Don't throw - the chat was created successfully
      }

      return newChat.id;
    } catch (error) {
      console.error('Error in getOrCreateChat:', error);
      throw error;
    }
  }

  /**
   * Send a message in a chat
   */
  static async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    content: string,
    messageType: ChatMessage['messageType'] = 'text',
    metadata?: ChatMessage['metadata']
  ): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      // Insert the message
      const messageData: any = {
        chat_id: chatId,
        sender_id: senderId,
        sender_name: senderName,
        content,
        message_type: messageType,
        metadata: metadata || null,
        created_at: now,
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select('id')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      // Update item_chats last message info
      const { error: updateError } = await supabase
        .from('item_chats')
        .update({
          last_message: content,
          last_message_at: now,
          updated_at: now,
        })
        .eq('id', chatId);

      if (updateError) {
        console.error('Error updating chat last message:', updateError);
        // Don't throw - message was sent successfully
      }

      // Also update the conversations table for marketplace chats
      const { error: conversationUpdateError } = await supabase
        .from('conversations')
        .update({
          last_message_text: content,
          last_message_timestamp: now,
          last_message_sender_id: senderId,
          updated_at: now
        })
        .eq('id', chatId)
        .eq('type', 'marketplace');

      if (conversationUpdateError) {
        console.error('Error updating conversation last message:', conversationUpdateError);
        // Don't throw - message was sent successfully
      }

      return data.id;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  /**
   * Get all messages for a chat
   */
  static async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chat messages:', error);
        throw error;
      }

      return (messages || []).map((message: any) => ({
        id: message.id,
        chatId: message.chat_id,
        senderId: message.sender_id,
        senderName: message.sender_name,
        content: message.content,
        timestamp: new Date(message.created_at || message.timestamp),
        isRead: false, // Computed - see markMessagesAsRead for read tracking
        messageType: (message.message_type || 'text') as 'text' | 'image' | 'system',
        metadata: message.metadata || undefined,
      }));
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      throw error;
    }
  }

  /**
   * Get all chats for a user (as buyer)
   */
  static async getUserChats(userId: string): Promise<ItemChat[]> {
    try {
      const { data: chats, error } = await supabase
        .from('item_chats')
        .select('*')
        .eq('buyer_id', userId)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching user chats:', error);
        throw error;
      }

      return (chats || []).map(chat => this.mapChatToItemChat(chat));
    } catch (error) {
      console.error('Error in getUserChats:', error);
      throw error;
    }
  }

  /**
   * Get all chats for a user (as seller)
   */
  static async getSellerChats(userId: string): Promise<ItemChat[]> {
    try {
      const { data: chats, error } = await supabase
        .from('item_chats')
        .select('*')
        .eq('seller_id', userId)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching seller chats:', error);
        throw error;
      }

      return (chats || []).map(chat => this.mapChatToItemChat(chat));
    } catch (error) {
      console.error('Error in getSellerChats:', error);
      throw error;
    }
  }

  /**
   * Map database chat row to ItemChat type
   */
  private static mapChatToItemChat(chat: any): ItemChat {
    return {
      id: chat.id,
      itemId: chat.item_id,
      buyerId: chat.buyer_id,
      sellerId: chat.seller_id,
      itemTitle: chat.item_title,
      itemImageUrl: chat.item_image_url,
      createdAt: new Date(chat.created_at),
      lastActivity: new Date(chat.last_message_at || chat.created_at),
      isActive: chat.is_active ?? true,
      updatedAt: new Date(chat.updated_at || chat.last_message_at || chat.created_at),
      lastMessage: chat.last_message ? {
        id: '',
        chatId: chat.id,
        senderId: '',
        senderName: '',
        content: chat.last_message,
        timestamp: new Date(chat.last_message_at),
        isRead: false,
        messageType: 'text' as const,
      } : undefined,
    };
  }

  /**
   * Mark messages as read for a user in a chat
   * Note: This uses a read_receipts approach since chat_messages doesn't have is_read column
   * TODO: Implement proper read_receipts table if needed
   */
  static async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      // Store read receipt in metadata or a separate tracking mechanism
      // For now, update the conversation's last_read timestamp for this user
      const { error } = await supabase
        .from('conversations')
        .update({
          [`last_read_${userId}`]: new Date().toISOString(),
        })
        .eq('id', chatId)
        .eq('type', 'marketplace');

      if (error) {
        // This might fail if the column doesn't exist - that's OK
        console.warn('markMessagesAsRead: Could not update read status:', error.message);
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      // Don't throw - read receipts are non-critical
    }
  }

  /**
   * Subscribe to chat messages in real-time
   */
  static subscribeToChat(
    chatId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async () => {
          // Refetch messages when changes occur
          try {
            const messages = await this.getChatMessages(chatId);
            callback(messages);
          } catch (error) {
            console.error('Error refetching messages:', error);
          }
        }
      )
      .subscribe();

    // Fetch initial messages
    this.getChatMessages(chatId).then(callback).catch(console.error);

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Send a price offer for an item
   */
  static async sendOffer(
    chatId: string,
    senderId: string,
    senderName: string,
    offerAmount: number
  ): Promise<string> {
    // Store offer as 'text' type with offer data in metadata
    // (database constraint doesn't allow 'offer' type)
    return this.sendMessage(
      chatId,
      senderId,
      senderName,
      `Offering ₦${offerAmount.toLocaleString()} for this item`,
      'text',
      {
        offerAmount,
        offerStatus: 'pending'
      }
    );
  }

  /**
   * Respond to a price offer
   */
  static async respondToOffer(
    messageId: string,
    accepted: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        metadata: {
          offerStatus: accepted ? 'accepted' : 'rejected'
        }
      })
      .eq('id', messageId);

    if (error) {
      console.error('Error responding to offer:', error);
      throw error;
    }
  }

  /**
   * Get chat details by ID
   */
  static async getChatById(chatId: string): Promise<ItemChat | null> {
    try {
      const { data, error } = await supabase
        .from('item_chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return this.mapChatToItemChat(data);
    } catch (error) {
      console.error('Error in getChatById:', error);
      return null;
    }
  }
}

// Re-export as SupabaseChatService for backward compatibility
export { ChatService as SupabaseChatService };