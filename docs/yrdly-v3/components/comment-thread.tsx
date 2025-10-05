"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Heart, MessageCircle, ChevronDown, ChevronUp } from "lucide-react"
import type { Comment } from "@/lib/types"

interface CommentThreadProps {
  comment: Comment
  onReply: (commentId: string, content: string) => void
  onLike: (commentId: string) => void
  depth?: number
}

export function CommentThread({ comment, onReply, onLike, depth = 0 }: CommentThreadProps) {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isExpanded, setIsExpanded] = useState(true)
  const [isLiked, setIsLiked] = useState(false)

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent)
      setReplyContent("")
      setShowReplyInput(false)
    }
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    onLike(comment.id)
  }

  const hasReplies = comment.replies && comment.replies.length > 0
  const marginLeft = depth > 0 ? "ml-8" : ""

  return (
    <div className={`${marginLeft} space-y-2`}>
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.userAvatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
            {comment.userName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-secondary rounded-lg p-3">
            <h5 className="font-semibold text-sm text-foreground">{comment.userName}</h5>
            <p className="text-sm text-foreground break-words">{comment.content}</p>
          </div>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs p-0 h-auto ${isLiked ? "text-red-500" : "text-muted-foreground"}`}
              onClick={handleLike}
            >
              <Heart className={`w-3 h-3 mr-1 ${isLiked ? "fill-current" : ""}`} />
              {comment.likes + (isLiked ? 1 : 0)}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground p-0 h-auto"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Reply
            </Button>
            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply} className="bg-primary text-primary-foreground">
                  Reply
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowReplyInput(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {hasReplies && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="mt-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-primary p-0 h-auto">
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Hide {comment.replies!.length} {comment.replies!.length === 1 ? "reply" : "replies"}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Show {comment.replies!.length} {comment.replies!.length === 1 ? "reply" : "replies"}
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                {comment.replies!.map((reply) => (
                  <CommentThread key={reply.id} comment={reply} onReply={onReply} onLike={onLike} depth={depth + 1} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  )
}
