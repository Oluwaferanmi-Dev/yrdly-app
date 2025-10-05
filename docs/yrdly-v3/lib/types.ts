export interface Comment {
  id: string
  postId: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: string
  likes: number
  replies?: Comment[]
  parentId?: string
}

export interface Post {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: string
  likes: number
  comments: Comment[]
  type?: "event" | "marketplace" | "general"
  metadata?: {
    title?: string
    price?: number
    location?: string
    date?: string
    image?: string
  }
}

export interface MarketplaceItem {
  id: string
  title: string
  description: string
  price: number
  condition: "new" | "like-new" | "good" | "fair" | "free"
  category: string
  images: string[]
  sellerId: string
  sellerName: string
  sellerAvatar: string
  sellerRating: number
  location: string
  distance: string
  postedDate: string
  views: number
  isFavorite: boolean
}

export interface ItemMessage {
  id: string
  itemId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
  isRead: boolean
}

export interface Business {
  id: string
  name: string
  description: string
  category: string
  coverImage: string
  logo: string
  rating: number
  reviewCount: number
  hours: string
  phone: string
  location: string
  distance: string
  ownerId: string
  ownerName: string
  ownerAvatar: string
  catalog: CatalogItem[]
}

export interface CatalogItem {
  id: string
  businessId: string
  title: string
  description: string
  price: number
  images: string[]
  category: string
  inStock: boolean
}

export interface BusinessMessage {
  id: string
  businessId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
  isRead: boolean
}

export interface User {
  id: string
  name: string
  avatar: string
  initials: string
  location: string
  joinDate: string
  bio: string
  interests: string[]
  stats: {
    neighbors: number
    events: number
    rating: number
  }
  isFriend: boolean
  isOnline: boolean
}

export interface CommunityPost {
  id: string
  type: "event" | "announcement" | "discussion"
  userId: string
  userName: string
  userAvatar: string
  title: string
  content: string
  timestamp: string
  likes: number
  comments: number
  location: string
  metadata?: {
    eventDate?: string
    eventLocation?: string
    category?: string
  }
}

export interface Conversation {
  id: string
  type: "friend" | "marketplace" | "business"
  participantId: string
  participantName: string
  participantAvatar: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  isOnline: boolean
  // Context-specific data
  context?: {
    // For marketplace conversations
    itemId?: string
    itemTitle?: string
    itemImage?: string
    itemPrice?: number
    // For business conversations
    businessId?: string
    businessName?: string
    businessLogo?: string
  }
}
