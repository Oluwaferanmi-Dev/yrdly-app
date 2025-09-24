// Removed Firebase imports - using Supabase

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Location {
  address: string;
  geopoint?: GeoPoint;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  description: string;
  location: Location;
  image_urls?: string[];
  created_at: string;
}

export type PostCategory = 'General' | 'Event' | 'For Sale' | 'Business';

export interface Post {
  id: string;
  user_id: string;
  author_name: string;
  author_image?: string;
  text: string;
  description?: string; // For marketplace listings
  image_url?: string; // Single image URL
  image_urls?: string[]; // Multiple image URLs
  timestamp: string; // Supabase returns ISO string
  comment_count: number;
  category: PostCategory;
  
  // Event-specific fields
  title?: string;
  event_date?: string; // Changed from eventDate
  event_time?: string; // Changed from eventTime
  event_link?: string; // Changed from eventLink
  event_location?: Location; // Changed from eventLocation
  attendees?: string[];

  // For Sale specific fields
  price?: number;
  condition?: string;

  liked_by: string[];
  
  // Additional Supabase fields
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  userId: string;
  authorName: string;
  authorImage: string;
  text: string;
  timestamp: string; // Changed from Timestamp to string for Supabase
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
  timestamp?: string; // Changed from Timestamp to string for Supabase
  // Online status fields
  isOnline?: boolean;
  lastSeen?: string; // Changed from Timestamp to string for Supabase
}

export interface FriendRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    participantIds: string[];
    status: 'pending' | 'accepted' | 'declined';
    timestamp: string; // Changed from Timestamp to string for Supabase
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