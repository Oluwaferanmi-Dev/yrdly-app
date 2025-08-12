

export interface User {
  id: string;
  uid: string;
  name: string;
  email?: string;
  avatarUrl: string;
  bio?: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timestamp: string;
}

export type PostCategory = "General" | "Event" | "For Sale" | "Business";

export interface Post {
  id: string;
  userId: string;
  authorName?: string;
  authorImage?: string;
  category: PostCategory;
  text: string;
  imageUrl?: string;
  location?: string;
  likes: number;
  likedBy?: string[];
  comments: Comment[];
  timestamp: string;
}

export interface Message {
  id: string;
  sender: User;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  messages: Message[];
}
