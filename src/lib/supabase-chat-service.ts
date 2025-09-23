import { supabase } from '@/lib/supabase';
import { ChatMessage, ItemChat, ChatParticipant } from '@/types/chat';

export class SupabaseChatService {
  // Create or get existing chat for an item
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
        .select('*')
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

      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('item_chats')
        .insert({
          item_id: itemId,
          buyer_id: buyerId,
          seller_id: sellerId,
          item_title: itemTitle,
          item_image_url: itemImageUrl,
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating chat:', createError);
        throw createError;
      }

      return newChat.id;
    } catch (error) {
      console.error('Error in getOrCreateChat:', error);
      throw error;
    }
  }

  // Get all chats for a user (as buyer)
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

      return (chats || []).map(chat => ({
        id: chat.id,
        itemId: chat.item_id,
        buyerId: chat.buyer_id,
        sellerId: chat.seller_id,
        itemTitle: chat.item_title,
        itemImageUrl: chat.item_image_url,
        createdAt: new Date(chat.created_at),
        lastMessageAt: new Date(chat.last_message_at),
        lastMessage: chat.last_message,
        unreadCount: chat.unread_count || 0,
      }));
    } catch (error) {
      console.error('Error in getUserChats:', error);
      throw error;
    }
  }

  // Get all chats for a user (as seller)
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

      return (chats || []).map(chat => ({
        id: chat.id,
        itemId: chat.item_id,
        buyerId: chat.buyer_id,
        sellerId: chat.seller_id,
        itemTitle: chat.item_title,
        itemImageUrl: chat.item_image_url,
        createdAt: new Date(chat.created_at),
        lastMessageAt: new Date(chat.last_message_at),
        lastMessage: chat.last_message,
        unreadCount: chat.unread_count || 0,
      }));
    } catch (error) {
      console.error('Error in getSellerChats:', error);
      throw error;
    }
  }

  // Get messages for a specific chat
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

      return (messages || []).map(message => ({
        id: message.id,
        chatId: message.chat_id,
        senderId: message.sender_id,
        senderName: message.sender_name,
        content: message.content,
        imageUrl: message.image_url,
        createdAt: new Date(message.created_at),
        isRead: message.is_read || false,
      }));
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      throw error;
    }
  }

  // Send a message
  static async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    content: string,
    imageUrl?: string
  ): Promise<void> {
    try {
      // Insert the message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          sender_name: senderName,
          content: content,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          is_read: false,
        });

      if (messageError) {
        console.error('Error sending message:', messageError);
        throw messageError;
      }

      // Update the chat's last message
      const { error: updateError } = await supabase
        .from('item_chats')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', chatId);

      if (updateError) {
        console.error('Error updating chat last message:', updateError);
        // Don't throw here, message was sent successfully
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  // Subscribe to chat messages
  static subscribeToChat(chatId: string, callback: (messages: ChatMessage[]) => void) {
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

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Mark messages as read
  static async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId);

      if (error) {
        console.error('Error marking messages as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      throw error;
    }
  }
}
