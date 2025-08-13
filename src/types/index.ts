

export interface Location {
  state?: string;
  stateId?: number;
  lga?: string;
  lgaId?: number;
  city?: string;
  cityId?: number;
  ward?: string;
}
export interface NotificationSettings {
  friendRequests?: boolean;
  messages?: boolean;
  postUpdates?: boolean;
  comments?: boolean;
  postLikes?: boolean;
  eventInvites?: boolean;
}

export interface User {
  id: string;
  uid: string;
  name: string;
  email?: string;
  avatarUrl: string;
  bio?: string;
  location?: Location;
  friends?: User[];
  blockedUsers?: string[];
  notificationSettings?: NotificationSettings;
  fcmToken?: string;
}

export type UserWithFriends = User & {
  friends: User[];
};


export interface Comment {
  id: string;
  userId: string;
  authorName: string;
  authorImage: string;
  text: string;
  timestamp: any;
  parentId?: string | null;
  reactions?: { [key: string]: string[] }; // e.g. { '👍': ['userId1', 'userId2'] }
}

export type PostCategory = "General" | "Event" | "For Sale" | "Business";

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorImage: string;
  category: PostCategory;
  text: string;
  imageUrl?: string;
  location?: string;
  likes: number;
  likedBy?: string[];
  commentCount?: number;
  timestamp: string;
  // Event specific fields
  eventDate?: string;
  eventTime?: string;
  eventLink?: string;
  attendees?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  sender: User;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id:string;
  participant: User;
  messages: Message[];
}

export interface FriendRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'declined';
    timestamp: any;
}
