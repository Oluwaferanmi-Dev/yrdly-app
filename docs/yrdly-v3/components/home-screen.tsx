"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { DismissibleBanner } from "@/components/dismissible-banner"
import { CommentThread } from "@/components/comment-thread"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  ImageIcon,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
} from "lucide-react"
import type { Post, Comment, User } from "@/lib/types"

interface HomeScreenProps {
  onViewProfile?: (user: User) => void
}

export function HomeScreen({ onViewProfile }: HomeScreenProps) {
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showEmailBanner, setShowEmailBanner] = useState(true)
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true)

  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      userId: "user1",
      userName: "Feranmi Oyelowo",
      userAvatar: "/community-organizer-meeting.png",
      content: "Excited to announce our community art festival! 🎨",
      timestamp: "2 hours ago",
      likes: 24,
      type: "event",
      metadata: {
        title: "Community Art Festival",
        location: "Victoria Island Community Center",
        date: "March 15, 2024 at 2:00 PM",
      },
      comments: [],
    },
    {
      id: "2",
      userId: "user2",
      userName: "Opiah David",
      userAvatar: "/market-seller.jpg",
      content: "Beautiful vintage dining table with 4 chairs. Perfect condition!",
      timestamp: "1 day ago",
      likes: 12,
      type: "marketplace",
      metadata: {
        title: "Vintage Dining Set",
        price: 45000,
        image: "/vintage-furniture-collection.png",
      },
      comments: [],
    },
    {
      id: "3",
      userId: "user3",
      userName: "Boluwatife Lasisi",
      userAvatar: "/neighbor-profile.jpg",
      content:
        "Just moved to the neighborhood! Looking forward to meeting everyone and exploring local spots. Any recommendations for the best coffee shop nearby? ☕",
      timestamp: "3 hours ago",
      likes: 18,
      type: "general",
      comments: [
        {
          id: "c1",
          postId: "3",
          userId: "user4",
          userName: "Caleb Oyelowo",
          userAvatar: "/commenter.jpg",
          content:
            "Welcome to the neighborhood! I highly recommend Brew & Bean on Lagos Street - best coffee in the area!",
          timestamp: "2h",
          likes: 5,
          replies: [
            {
              id: "c1-r1",
              postId: "3",
              userId: "user3",
              userName: "Boluwatife Lasisi",
              userAvatar: "/neighbor-profile.jpg",
              content: "Thank you so much! I'll definitely check it out this weekend 😊",
              timestamp: "1h",
              likes: 2,
              parentId: "c1",
            },
          ],
        },
      ],
    },
  ])

  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({})
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({})

  const handleAddComment = (postId: string) => {
    const content = commentInputs[postId]?.trim()
    if (!content) return

    const newComment: Comment = {
      id: `c${Date.now()}`,
      postId,
      userId: "currentUser",
      userName: "John Doe",
      userAvatar: "/diverse-user-avatars.png",
      content,
      timestamp: "Just now",
      likes: 0,
      replies: [],
    }

    setPosts(posts.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post)))

    setCommentInputs({ ...commentInputs, [postId]: "" })
  }

  const handleReply = (postId: string, commentId: string, content: string) => {
    const newReply: Comment = {
      id: `r${Date.now()}`,
      postId,
      userId: "currentUser",
      userName: "John Doe",
      userAvatar: "/diverse-user-avatars.png",
      content,
      timestamp: "Just now",
      likes: 0,
      parentId: commentId,
    }

    setPosts(
      posts.map((post) => {
        if (post.id !== postId) return post

        const addReplyToComment = (comments: Comment[]): Comment[] => {
          return comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply],
              }
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: addReplyToComment(comment.replies),
              }
            }
            return comment
          })
        }

        return {
          ...post,
          comments: addReplyToComment(post.comments),
        }
      }),
    )
  }

  const handleLikeComment = (postId: string, commentId: string) => {
    setPosts(
      posts.map((post) => {
        if (post.id !== postId) return post

        const updateCommentLikes = (comments: Comment[]): Comment[] => {
          return comments.map((comment) => {
            if (comment.id === commentId) {
              return { ...comment, likes: comment.likes + 1 }
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: updateCommentLikes(comment.replies),
              }
            }
            return comment
          })
        }

        return {
          ...post,
          comments: updateCommentLikes(post.comments),
        }
      }),
    )
  }

  const toggleComments = (postId: string) => {
    setExpandedComments({
      ...expandedComments,
      [postId]: !expandedComments[postId],
    })
  }

  const handleAvatarClick = (post: Post) => {
    if (onViewProfile) {
      const user: User = {
        id: post.userId,
        name: post.userName,
        avatar: post.userAvatar,
        initials: post.userName.substring(0, 2).toUpperCase(),
        location: "Victoria Island, Lagos",
        joinDate: "March 2024",
        bio: "Community member",
        interests: [],
        stats: { neighbors: 24, events: 8, rating: 4.9 },
        isFriend: false,
        isOnline: true,
      }
      onViewProfile(user)
    }
  }

  return (
    <div className="p-4 space-y-4 pb-24 max-w-2xl mx-auto">
      {/* Email Verification Banner */}
      {showEmailBanner && (
        <DismissibleBanner className="p-4 bg-yellow-50 border-yellow-200" onDismiss={() => setShowEmailBanner(false)}>
          <div className="flex items-center gap-3 pr-8">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-yellow-800">Please verify your email address</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 bg-transparent flex-shrink-0"
            >
              Verify
            </Button>
          </div>
        </DismissibleBanner>
      )}

      {/* Welcome Banner */}
      {showWelcomeBanner && (
        <DismissibleBanner className="p-6 yrdly-gradient text-white" onDismiss={() => setShowWelcomeBanner(false)}>
          <div className="pr-8">
            <h2 className="text-xl font-bold mb-2">Welcome to your neighborhood!</h2>
            <p className="text-white/90 mb-4">Connect with neighbors, discover events, and support local businesses.</p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" className="bg-white text-primary hover:bg-white/90">
                Explore
              </Button>
              <Button size="sm" variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
                Invite Friends
              </Button>
            </div>
          </div>
        </DismissibleBanner>
      )}

      {/* Create Post Card */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src="/diverse-user-avatars.png" />
            <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            className="flex-1 justify-start text-muted-foreground bg-transparent"
            onClick={() => setShowCreatePost(true)}
          >
            What's happening in your neighborhood?
          </Button>
        </div>
      </Card>

      {/* Feed Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="p-4 yrdly-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar
                  className="w-10 h-10 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => handleAvatarClick(post)}
                >
                  <AvatarImage src={post.userAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {post.userName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  {/* Made username clickable */}
                  <h4
                    className="font-semibold text-foreground truncate cursor-pointer hover:text-primary"
                    onClick={() => handleAvatarClick(post)}
                  >
                    {post.userName}
                  </h4>
                  <p className="text-sm text-muted-foreground">{post.timestamp}</p>
                </div>
              </div>
              {post.type === "marketplace" && (
                <Badge className="bg-accent text-accent-foreground flex-shrink-0">For Sale</Badge>
              )}
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-3">
              {post.metadata?.image && (
                <img
                  src={post.metadata.image || "/placeholder.svg"}
                  alt={post.metadata.title || "Post image"}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              )}

              {post.type === "event" && post.metadata && (
                <>
                  <p className="text-foreground mb-2">{post.content}</p>
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-semibold text-foreground">{post.metadata.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="break-words">{post.metadata.location}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{post.metadata.date}</div>
                  </div>
                </>
              )}

              {post.type === "marketplace" && post.metadata && (
                <>
                  <h4 className="font-semibold text-foreground mb-1">{post.metadata.title}</h4>
                  <p className="text-foreground mb-2">{post.content}</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <span className="font-bold text-accent text-lg">₦{post.metadata.price?.toLocaleString()}</span>
                  </div>
                </>
              )}

              {post.type === "general" && <p className="text-foreground break-words">{post.content}</p>}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                  <Heart className="w-4 h-4 mr-1" />
                  <span className="text-sm">{post.likes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => toggleComments(post.id)}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">{post.comments.length}</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent">
                  <Share className="w-4 h-4 mr-1" />
                  <span className="text-sm">Share</span>
                </Button>
              </div>
              {post.type === "marketplace" && (
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Contact Seller
                </Button>
              )}
            </div>

            <Collapsible open={expandedComments[post.id]} onOpenChange={() => toggleComments(post.id)}>
              <CollapsibleContent className="mt-4 pt-3 border-t border-border space-y-4">
                {/* Existing Comments */}
                {post.comments.length > 0 && (
                  <div className="space-y-3">
                    {post.comments.map((comment) => (
                      <CommentThread
                        key={comment.id}
                        comment={comment}
                        onReply={(commentId, content) => handleReply(post.id, commentId, content)}
                        onLike={(commentId) => handleLikeComment(post.id, commentId)}
                      />
                    ))}
                  </div>
                )}

                {/* Add Comment Input */}
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src="/diverse-user-avatars.png" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2 min-w-0">
                    <Textarea
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      className="min-h-[60px] text-sm resize-none"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                      className="bg-primary text-primary-foreground"
                    >
                      Comment
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full max-w-2xl mx-auto bg-background rounded-t-xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Create Post</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreatePost(false)}>
                ✕
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src="/diverse-user-avatars.png" />
                <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-foreground">John Doe</h4>
                <p className="text-sm text-muted-foreground">Posting to neighborhood</p>
              </div>
            </div>

            <Textarea placeholder="What's happening in your neighborhood?" className="min-h-[100px] resize-none" />

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm">
                <ImageIcon className="w-4 h-4 mr-2" />
                Photo
              </Button>
              <Button variant="outline" size="sm">
                <MapPin className="w-4 h-4 mr-2" />
                Location
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowCreatePost(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Post</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
