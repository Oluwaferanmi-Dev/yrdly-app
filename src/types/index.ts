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
  // Additional fields needed for v0 design
  rating?: number;
  review_count?: number;
  hours?: string;
  phone?: string;
  email?: string;
  website?: string;
  owner_name?: string;
  owner_avatar?: string;
  // Business detail page fields
  cover_image?: string;
  logo?: string;
  distance?: string;
  catalog?: CatalogItem[];
}

export interface CatalogItem {
  id: string;
  business_id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  in_stock: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessMessage {
  id: string;
  business_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  timestamp: string;
  is_read: boolean;
  item_id?: string; // If discussing a specific catalog item
  created_at?: string;
}

export interface BusinessReview {
  id: string;
  business_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
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
  
  // Joined user data (when fetched with user relation)
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
    created_at?: string;
  };
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