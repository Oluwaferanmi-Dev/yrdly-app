export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  messageType: 'text' | 'image' | 'offer' | 'system';
  metadata?: {
    offerAmount?: number;
    offerStatus?: 'pending' | 'accepted' | 'rejected';
    imageUrl?: string;
  };
}

export interface ItemChat {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  itemTitle: string;
  itemImageUrl: string;
  lastMessage?: ChatMessage;
  lastActivity: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen?: Date;
}
