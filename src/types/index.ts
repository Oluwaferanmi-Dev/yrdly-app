
import type { Timestamp, GeoPoint } from "firebase/firestore";

export interface Location {
  address: string;
  geopoint?: GeoPoint;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  category: string;
  description: string;
  location: Location;
  imageUrls?: string[];
  createdAt: Timestamp;
}

export type PostCategory = 'General' | 'Event' | 'For Sale' | 'Business';

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorImage: string;
  text: string;
  description?: string; // For marketplace listings
  imageUrl?: string;
  imageUrls?: string[];
  timestamp: Timestamp;
  commentCount: number;
  category: PostCategory;
  
  // Event-specific fields
  title?: string;
  eventDate?: string;
  eventTime?: string;
  eventLink?: string;
  eventLocation?: Location;
  attendees?: string[];

  // For Sale specific fields
  price?: number;

  likedBy: string[];
}

export interface Comment {
  id: string;
  userId: string;
  authorName: string;
  authorImage: string;
  text: string;
  timestamp: Timestamp;
  parentId: string | null;
  reactions: { [key: string]: string[] }; // emoji -> userId[]
}


export interface User {
  id: string;
  uid: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  location?: {
    state?: string;
    lga?: string;
    city?: string;
    ward?: string;
  };
  friends?: string[];
  blockedUsers?: string[];
  notificationSettings?: NotificationSettings;
  timestamp?: Timestamp;
  // Online status fields
  isOnline?: boolean;
  lastSeen?: Timestamp;
}

export interface FriendRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    participantIds: string[];
    status: 'pending' | 'accepted' | 'declined';
    timestamp: Timestamp;
}


export interface Conversation {
  id: string;
  participantIds: string[];
  participant: User;
  lastMessage?: {
      id?: string;
      senderId: string;
      text: string;
      timestamp: string;
      isRead?: boolean;
      readBy?: string[];
  };
  messages: Message[];
  typing?: { [key: string]: boolean };
}

export interface Message {
    id: string;
    senderId: string;
    sender: User;
    text?: string; // Make text optional
    imageUrl?: string; // Add imageUrl
    timestamp: string; // Should be string for display
    originalTimestamp?: any; // Original Firestore timestamp for date comparison
    isRead: boolean;
}

export interface NotificationSettings {
  friendRequests: boolean;
  messages: boolean;
  postUpdates: boolean;
  comments: boolean;
  postLikes: boolean;
  eventInvites: boolean;
}
