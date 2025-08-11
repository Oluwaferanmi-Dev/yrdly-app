
import { DocumentReference } from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  bio?: string;
  uid?: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timestamp: string;
}

export type PostCategory = "General" | "Event" | "For Sale";

export interface Post {
  id: string;
  user: User;
  userRef?: DocumentReference;
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
