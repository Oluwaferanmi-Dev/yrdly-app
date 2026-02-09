'use client';

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { 
    MoreHorizontal, 
    Heart,
    Trash2,
    Edit2,
    MessageCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { Post, User } from '@/types';
import Image from 'next/image';

interface Comment {
    id: string;
    userId: string;
    authorName: string;
    authorImage: string;
    text: string;
    timestamp: string;
    parentId?: string | null;
    reactions: Record<string, string[]>;
    likedBy?: string[];
}

interface CommentSectionProps {
    postId: string;
    post?: Post;
    author?: User | null;
    onCommentCountChange?: (count: number) => void;
    onClose?: () => void;
    /** Inline variant: no sheet, dark theme, input above comments (post detail page) */
    variant?: "default" | "inline";
    /** Hide the post preview block (use when full post is shown above) */
    hidePostPreview?: boolean;
}

export function CommentSection({ postId, post, author, onCommentCountChange, onClose, variant = "default", hidePostPreview }: CommentSectionProps) {
    const { user: currentUser, profile: userDetails, loading } = useAuth();
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const commentsEndRef = useRef<HTMLDivElement>(null);
    
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

    // Auth timeout fallback
    const [authTimeout, setAuthTimeout] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                setAuthTimeout(true);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [loading]);
    
    const isAuthLoading = loading && !authTimeout;

    // Fetch comments
    useEffect(() => {
        if (!postId || !currentUser) return;
        
        const fetchComments = async () => {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('post_id', postId)
                .order('timestamp', { ascending: true });
            
            if (!error && data) {
                const mappedComments = data.map((comment: any) => ({
                    id: comment.id,
                    userId: comment.user_id,
                    authorName: comment.author_name,
                    authorImage: comment.author_image,
                    text: comment.text,
                    timestamp: comment.timestamp,
                    parentId: comment.parent_id,
                    reactions: comment.reactions || {},
                    likedBy: comment.reactions?.['❤️'] || []
                }));
                setComments(mappedComments);
                
                // Set liked comments
                const liked = new Set<string>();
                mappedComments.forEach(comment => {
                    if (comment.likedBy?.includes(currentUser.id)) {
                        liked.add(comment.id);
                    }
                });
                setLikedComments(liked);

                // Sync comment count with parent (and fix drift: update post row if stored count differs)
                const actualCount = mappedComments.length;
                onCommentCountChange?.(actualCount);
                const { data: postRow } = await supabase.from('posts').select('comment_count').eq('id', postId).single();
                if (postRow && (postRow.comment_count ?? 0) !== actualCount) {
                    await supabase.from('posts').update({ comment_count: actualCount }).eq('id', postId);
                }
            }
        };
        
        fetchComments();

        // Set up real-time subscription
        const channel = supabase
            .channel(`comments_${postId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'comments',
                filter: `post_id=eq.${postId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT' && payload.new) {
                    const dbComment = payload.new as any;
                    const newComment: Comment = {
                        id: dbComment.id,
                        userId: dbComment.user_id,
                        authorName: dbComment.author_name,
                        authorImage: dbComment.author_image,
                        text: dbComment.text,
                        timestamp: dbComment.timestamp,
                        parentId: dbComment.parent_id,
                        reactions: dbComment.reactions || {},
                        likedBy: dbComment.reactions?.['❤️'] || []
                    };
                    
                    setComments(prev => {
                        const existing = prev.filter(c => c.id !== newComment.id);
                        return [...existing, newComment].sort((a, b) => 
                            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                        );
                    });
                    
                    // Scroll to bottom when new comment is added
                    setTimeout(() => {
                        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                } else if (payload.eventType === 'UPDATE' && payload.new) {
                    const dbComment = payload.new as any;
                    setComments(prev => 
                        prev.map(c => 
                            c.id === dbComment.id 
                                ? {
                                    ...c,
                                    text: dbComment.text,
                                    reactions: dbComment.reactions || {},
                                    likedBy: dbComment.reactions?.['❤️'] || []
                                }
                                : c
                        )
                    );
                } else if (payload.eventType === 'DELETE') {
                    setComments(prev => prev.filter(c => c.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [postId, currentUser, onCommentCountChange]);

    // Keep parent comment count in sync when comments list changes (realtime or local); skip initial mount to avoid flashing 0
    const isFirstCommentSync = useRef(true);
    useEffect(() => {
        if (isFirstCommentSync.current) {
            isFirstCommentSync.current = false;
            return;
        }
        onCommentCountChange?.(comments.length);
    }, [comments.length, onCommentCountChange]);

    // Focus input when replying
    useEffect(() => {
        if (replyingTo && inputRef.current) {
            inputRef.current.focus();
        }
    }, [replyingTo]);

    const handlePostComment = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        
        if (!currentUser || !userDetails || !newComment.trim()) {
            return;
        }

        const commentText = newComment.trim();
        const parentId = replyingTo;

        // Optimistic update
        const optimisticComment: Comment = {
            id: `temp-${Date.now()}`,
            userId: currentUser.id,
            authorName: userDetails.name || userDetails.email || 'Anonymous',
            authorImage: userDetails.avatar_url || '',
            text: commentText,
            timestamp: new Date().toISOString(),
            parentId: parentId || null,
            reactions: {},
            likedBy: []
        };

        setComments(prev => [...prev, optimisticComment]);
        setNewComment('');
        setReplyingTo(null);
        
        // Scroll to bottom
        setTimeout(() => {
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: currentUser.id,
                    author_name: userDetails.name || userDetails.email || 'Anonymous',
                    author_image: userDetails.avatar_url || '',
                    text: commentText,
                    parent_id: parentId || null
                })
                .select()
                .single();

            if (error) throw error;

            // Replace optimistic comment with real one
            setComments(prev => 
                prev.map(c => 
                    c.id === optimisticComment.id 
                        ? {
                            id: data.id,
                            userId: data.user_id,
                            authorName: data.author_name,
                            authorImage: data.author_image,
                            text: data.text,
                            timestamp: data.timestamp,
                            parentId: data.parent_id,
                            reactions: data.reactions || {},
                            likedBy: data.reactions?.['❤️'] || []
                        }
                        : c
                )
            );
            
            // Update comment count
            if (onCommentCountChange) {
                const { data: postData } = await supabase
                    .from('posts')
                    .select('comment_count')
                    .eq('id', postId)
                    .single();
                
                if (postData) {
                    const newCommentCount = (postData.comment_count || 0) + 1;
                    await supabase
                        .from('posts')
                        .update({ comment_count: newCommentCount })
                        .eq('id', postId);
                    onCommentCountChange(newCommentCount);
                }
            }
            
            // Trigger notification
            try {
                const { NotificationTriggers } = await import('@/lib/notification-triggers');
                await NotificationTriggers.onPostCommented(postId, currentUser.id, commentText);
            } catch (error) {
                console.error('Error creating comment notification:', error);
            }
            
        } catch (error) {
            console.error('Error posting comment:', error);
            // Remove optimistic comment on error
            setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
            toast({ variant: 'destructive', title: 'Error', description: 'Could not post comment.' });
        }
    }, [currentUser, userDetails, newComment, postId, replyingTo, toast, onCommentCountChange]);

    const handleLikeComment = useCallback(async (commentId: string) => {
        if (!currentUser) return;
        
        const comment = comments.find(c => c.id === commentId);
        if (!comment) return;
        
        const isLiked = likedComments.has(commentId);
        const currentReactions = comment.reactions || {};
        const heartReactions = currentReactions['❤️'] || [];
        
        let newReactions = { ...currentReactions };
        
        if (isLiked) {
            // Remove like
            newReactions['❤️'] = heartReactions.filter(id => id !== currentUser.id);
            if (newReactions['❤️'].length === 0) {
                delete newReactions['❤️'];
            }
            setLikedComments(prev => {
                const next = new Set(prev);
                next.delete(commentId);
                return next;
            });
        } else {
            // Add like
            newReactions['❤️'] = [...heartReactions, currentUser.id];
            setLikedComments(prev => new Set(prev).add(commentId));
        }
        
        // Optimistic update
        setComments(prev => 
            prev.map(c => 
                c.id === commentId 
                    ? { ...c, reactions: newReactions, likedBy: newReactions['❤️'] || [] }
                    : c
            )
        );
        
        try {
            const { error } = await supabase
                .from('comments')
                .update({ reactions: newReactions })
                .eq('id', commentId);
            
            if (error) throw error;
        } catch (error) {
            console.error('Error liking comment:', error);
            // Revert optimistic update
            setComments(prev => 
                prev.map(c => 
                    c.id === commentId ? comment : c
                )
            );
            if (isLiked) {
                setLikedComments(prev => new Set(prev).add(commentId));
            } else {
                setLikedComments(prev => {
                    const next = new Set(prev);
                    next.delete(commentId);
                    return next;
                });
            }
        }
    }, [currentUser, comments, likedComments]);

    const handleDeleteComment = useCallback(async (commentId: string) => {
        if (!currentUser) return;
        
        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
            
            // Update comment count
            if (onCommentCountChange) {
                const { data: postData } = await supabase
                    .from('posts')
                    .select('comment_count')
                    .eq('id', postId)
                    .single();
                
                if (postData) {
                    const newCommentCount = Math.max((postData.comment_count || 0) - 1, 0);
                    await supabase
                        .from('posts')
                        .update({ comment_count: newCommentCount })
                        .eq('id', postId);
                    onCommentCountChange(newCommentCount);
                }
            }
            
            toast({ title: 'Success', description: 'Comment deleted successfully.' });
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete comment.' });
        }
    }, [currentUser, postId, toast, onCommentCountChange]);

    const timeAgo = useCallback((date: Date | null) => {
        if (!date) return '';
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        return `${Math.floor(diffInSeconds / 86400)}d`;
    }, []);

    const toggleReplies = useCallback((commentId: string) => {
        setExpandedReplies(prev => {
            const next = new Set(prev);
            if (next.has(commentId)) {
                next.delete(commentId);
            } else {
                next.add(commentId);
            }
            return next;
        });
    }, []);

    // Organize comments into parent and replies
    const parentComments = comments.filter(c => !c.parentId);
    const repliesByParent = comments.reduce((acc, comment) => {
        if (comment.parentId) {
            if (!acc[comment.parentId]) {
                acc[comment.parentId] = [];
            }
            acc[comment.parentId].push(comment);
        }
        return acc;
    }, {} as Record<string, Comment[]>);

    const renderComment = useCallback((comment: Comment, isReply: boolean = false) => {
        const replies = repliesByParent[comment.id] || [];
        const hasReplies = replies.length > 0;
        const showReplies = expandedReplies.has(comment.id);
        const isLiked = likedComments.has(comment.id);
        const likeCount = comment.reactions?.['❤️']?.length || 0;
        const dark = variant === "inline";

        return (
            <div key={comment.id} className={cn("flex gap-3 py-2", isReply && "ml-6", dark && isReply && "border-l-2 border-[#388E3C] pl-3")}>
                <Avatar className={cn("h-8 w-8 flex-shrink-0", dark && "ring-1 ring-white/10")}>
                    <AvatarImage src={comment.authorImage} />
                    <AvatarFallback className={cn("text-xs", dark && "bg-[#388E3C] text-white")}>{comment.authorName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className={cn("font-semibold text-sm", dark && "text-white")}>{comment.authorName}</span>
                                <span className={cn("text-sm", dark && "text-white/90")}>{comment.text}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                                <span className={cn("text-xs", dark ? "text-white/60" : "text-muted-foreground")}>{timeAgo(new Date(comment.timestamp))}</span>
                                {!isReply && (
                                    <button
                                        onClick={() => setReplyingTo(comment.id)}
                                        className={cn("text-xs font-medium", dark ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        Reply
                                    </button>
                                )}
                                {currentUser?.id === comment.userId && (
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className={cn("text-xs", dark ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground")}>
                                                    <MoreHorizontal className="h-3 w-3" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className={dark ? "bg-[#1E2126] border-white/10" : undefined}>
                                                <DropdownMenuItem onClick={() => { setEditingComment(comment.id); setEditText(comment.text); }}>
                                                    <Edit2 className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent className={dark ? "bg-[#1E2126] border-white/10 text-white" : undefined}>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete your comment.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteComment(comment.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                            <button onClick={() => handleLikeComment(comment.id)}>
                                <Heart className={cn("h-4 w-4 transition-colors", isLiked ? "text-red-500 fill-current" : dark ? "text-white/70" : "text-muted-foreground")} />
                            </button>
                            {likeCount > 0 && <span className={cn("text-xs font-semibold", dark ? "text-white/90" : "text-foreground")}>{likeCount}</span>}
                            {!isReply && hasReplies && (
                                <span className={cn("text-xs", dark ? "text-white/60" : "text-muted-foreground")}>
                                    {replies.length}
                                </span>
                            )}
                        </div>
                    </div>
                    {hasReplies && !isReply && (
                        <button
                            onClick={() => toggleReplies(comment.id)}
                            className={cn("text-xs font-medium mt-2 block", dark ? "text-white/80 italic hover:text-white" : "text-muted-foreground hover:text-foreground")}
                        >
                            {showReplies ? "Hide" : "View"} {replies.length === 1 ? "reply" : "replies"}
                        </button>
                    )}
                    {showReplies && hasReplies && (
                        <div className="mt-2 space-y-0">
                            {replies.map(reply => renderComment(reply, true))}
                        </div>
                    )}
                </div>
            </div>
        );
    }, [repliesByParent, expandedReplies, likedComments, currentUser, timeAgo, handleLikeComment, handleDeleteComment, toggleReplies, setReplyingTo, variant]);

    if (isAuthLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center text-muted-foreground">Loading comments...</div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center text-muted-foreground">Please sign in to view comments</div>
            </div>
        );
    }

    const isInline = variant === "inline";
    const inputBlock = (
        <div className={cn("flex-shrink-0", isInline ? "p-4 pb-2" : "p-4 border-t bg-background safe-area-bottom")}>
            {replyingTo && (
                <div className={cn("mb-2 flex items-center justify-between text-xs", isInline ? "text-white/70" : "text-muted-foreground")}>
                    <span>Replying to {comments.find(c => c.id === replyingTo)?.authorName}</span>
                    <button onClick={() => setReplyingTo(null)} className={isInline ? "hover:text-white" : "hover:text-foreground"}>
                        Cancel
                    </button>
                </div>
            )}
            <form onSubmit={handlePostComment} className="flex items-center gap-3">
                <Avatar className={cn("flex-shrink-0", isInline ? "h-9 w-9" : "h-8 w-8")}>
                    <AvatarImage src={userDetails?.avatar_url} />
                    <AvatarFallback className={cn("text-xs", isInline && "bg-[#388E3C] text-white")}>{userDetails?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <Input
                    ref={inputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? "Add a reply..." : "Leave a comment"}
                    className={cn(
                        "flex-1 font-raleway",
                        isInline
                            ? "h-10 bg-[#15181D] border-[#388E3C] rounded-full text-white placeholder:text-white/70 focus-visible:ring-[#388E3C]"
                            : "h-9"
                    )}
                />
                <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim()}
                    className={cn(isInline ? "rounded-full bg-[#388E3C] text-white hover:bg-[#2d7a2e]" : "text-primary hover:text-primary")}
                    variant={isInline ? "default" : "ghost"}
                >
                    Post
                </Button>
            </form>
        </div>
    );

    return (
        <div className={cn("flex flex-col min-h-0", isInline ? "h-auto" : "h-full")}>
            {/* Post Preview - hidden when inline / hidePostPreview */}
            {!hidePostPreview && post && author && (
                <div className="p-4 border-b flex-shrink-0">
                    <div className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={author.avatar_url} />
                            <AvatarFallback>{author.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="font-semibold text-sm">{author.name}</span>
                                <span className="text-sm line-clamp-2">{post.text}</span>
                            </div>
                        </div>
                        {post.image_urls && post.image_urls.length > 0 && (
                            <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden">
                                <Image src={post.image_urls[0]} alt="Post thumbnail" width={48} height={48} className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isInline && inputBlock}

            {/* Comments List */}
            <div className={cn("flex-1 overflow-y-auto min-h-0", isInline ? "px-4 py-2 max-h-[60vh]" : "px-4 py-2")}>
                {parentComments.length === 0 ? (
                    <div className={cn(
                        "text-center py-8 flex flex-col items-center gap-2",
                        isInline ? "text-white/70 font-raleway" : "text-muted-foreground"
                    )}>
                        {isInline && <MessageCircle className="w-10 h-10 text-white/30 flex-shrink-0" aria-hidden />}
                        <p className="text-sm">No comments yet.</p>
                        <p className={cn("text-xs", isInline ? "text-white/50" : "text-muted-foreground/80")}>Be the first to comment!</p>
                    </div>
                ) : (
                    <div className={cn("space-y-0", isInline && "space-y-1")}>
                        {parentComments.map(comment => renderComment(comment))}
                    </div>
                )}
                <div ref={commentsEndRef} />
            </div>

            {!isInline && inputBlock}
        </div>
    );
}
