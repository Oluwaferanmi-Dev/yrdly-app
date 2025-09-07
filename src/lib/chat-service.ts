import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChatMessage, ItemChat, ChatParticipant } from '@/types/chat';

export class ChatService {
  // Create or get existing chat for an item
  static async getOrCreateChat(
    itemId: string,
    buyerId: string,
    sellerId: string,
    itemTitle: string,
    itemImageUrl: string
  ): Promise<string> {
    // Check if chat already exists
    const existingChatQuery = query(
      collection(db, 'item_chats'),
      where('itemId', '==', itemId),
      where('buyerId', '==', buyerId),
      where('sellerId', '==', sellerId)
    );

    const existingChatSnapshot = await getDocs(existingChatQuery);
    
    if (!existingChatSnapshot.empty) {
      return existingChatSnapshot.docs[0].id;
    }

    // Create new chat
    const chatData: Omit<ItemChat, 'id' | 'createdAt' | 'updatedAt'> = {
      itemId,
      buyerId,
      sellerId,
      itemTitle,
      itemImageUrl,
      lastActivity: new Date(),
      isActive: true
    };

    const docRef = await addDoc(collection(db, 'item_chats'), {
      ...chatData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  }

  // Send a message
  static async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    content: string,
    messageType: ChatMessage['messageType'] = 'text',
    metadata?: ChatMessage['metadata']
  ): Promise<string> {
    const messageData: Omit<ChatMessage, 'id' | 'timestamp'> = {
      chatId,
      senderId,
      senderName,
      content,
      isRead: false,
      messageType,
      ...(metadata && { metadata }) // Only include metadata if it exists
    };

    const docRef = await addDoc(collection(db, 'chat_messages'), {
      ...messageData,
      timestamp: serverTimestamp()
    });

    // Update chat last activity
    const chatRef = doc(db, 'item_chats', chatId);
    await updateDoc(chatRef, {
      lastActivity: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  }

  // Get chat messages
  static async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    const q = query(
      collection(db, 'chat_messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const messages: ChatMessage[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date()
      } as ChatMessage);
    });

    return messages;
  }

  // Get user's chats
  static async getUserChats(userId: string): Promise<ItemChat[]> {
    const q = query(
      collection(db, 'item_chats'),
      where('buyerId', '==', userId),
      orderBy('lastActivity', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const chats: ItemChat[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      
      // Get the last message for this chat
      const messagesQuery = query(
        collection(db, 'chat_messages'),
        where('chatId', '==', docSnapshot.id),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      let lastMessage: ChatMessage | undefined;
      
      if (!messagesSnapshot.empty) {
        const messageDoc = messagesSnapshot.docs[0];
        const messageData = messageDoc.data();
        lastMessage = {
          id: messageDoc.id,
          ...messageData,
          timestamp: messageData.timestamp ? (messageData.timestamp as Timestamp).toDate() : new Date()
        } as ChatMessage;
      }

      chats.push({
        id: docSnapshot.id,
        ...data,
        lastMessage,
        lastActivity: data.lastActivity ? (data.lastActivity as Timestamp).toDate() : new Date(),
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date()
      } as ItemChat);
    }

    return chats;
  }

  // Get seller's chats
  static async getSellerChats(sellerId: string): Promise<ItemChat[]> {
    const q = query(
      collection(db, 'item_chats'),
      where('sellerId', '==', sellerId),
      orderBy('lastActivity', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const chats: ItemChat[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      
      // Get the last message for this chat
      const messagesQuery = query(
        collection(db, 'chat_messages'),
        where('chatId', '==', docSnapshot.id),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      let lastMessage: ChatMessage | undefined;
      
      if (!messagesSnapshot.empty) {
        const messageDoc = messagesSnapshot.docs[0];
        const messageData = messageDoc.data();
        lastMessage = {
          id: messageDoc.id,
          ...messageData,
          timestamp: messageData.timestamp ? (messageData.timestamp as Timestamp).toDate() : new Date()
        } as ChatMessage;
      }

      chats.push({
        id: docSnapshot.id,
        ...data,
        lastMessage,
        lastActivity: data.lastActivity ? (data.lastActivity as Timestamp).toDate() : new Date(),
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date()
      } as ItemChat);
    }

    return chats;
  }

  // Mark messages as read
  static async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    const q = query(
      collection(db, 'chat_messages'),
      where('chatId', '==', chatId),
      where('senderId', '!=', userId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map(docSnapshot => {
      const messageRef = doc(db, 'chat_messages', docSnapshot.id);
      return updateDoc(messageRef, { isRead: true });
    });

    await Promise.all(updatePromises);
  }

  // Listen to chat messages in real-time
  static subscribeToChat(
    chatId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const q = query(
      collection(db, 'chat_messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: ChatMessage[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date()
        } as ChatMessage);
      });

      callback(messages);
    });

    return unsubscribe;
  }

  // Send an offer
  static async sendOffer(
    chatId: string,
    senderId: string,
    senderName: string,
    offerAmount: number
  ): Promise<string> {
    return this.sendMessage(
      chatId,
      senderId,
      senderName,
      `Offering ₦${offerAmount.toLocaleString()} for this item`,
      'offer',
      {
        offerAmount,
        offerStatus: 'pending'
      }
    );
  }

  // Respond to an offer
  static async respondToOffer(
    messageId: string,
    accepted: boolean
  ): Promise<void> {
    const messageRef = doc(db, 'chat_messages', messageId);
    
    await updateDoc(messageRef, {
      'metadata.offerStatus': accepted ? 'accepted' : 'rejected'
    });
  }
}
