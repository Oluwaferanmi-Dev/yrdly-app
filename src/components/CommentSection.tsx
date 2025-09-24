
"use client";

import { useState, useMemo, FormEvent, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Comment, User } from '@/types';
import { useAuth } from '@/hooks/use-supabase-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Smile } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useToast } from '@/hooks/use-toast';
import { UserProfileDialog } from './UserProfileDialog';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
    postId: string;
}

// Define a recursive type for comments with replies
type CommentWithReplies = Comment & {
  replies: CommentWithReplies[];
};


const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😡'];

export function CommentSection({ postId }: CommentSectionProps) {
    const { user: currentUser, profile: userDetails, loading } = useAuth();
    const { toast } = useToast();
    
    // Debug authentication state
    console.log('CommentSection auth state:', { 
        currentUser: currentUser?.id, 
        userDetails: userDetails?.id, 
        loading,
        hasUser: !!currentUser,
        hasUserDetails: !!userDetails
    });
    
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [authTimeout, setAuthTimeout] = useState(false);
    
    // Add timeout to prevent infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.log('Auth loading timeout - forcing loading to false');
                setAuthTimeout(true);
            }
        }, 10000); // 10 second timeout
        
        return () => clearTimeout(timer);
    }, [loading]);
    
    // Use timeout state if auth is stuck loading
    const isAuthLoading = loading && !authTimeout;

    useMemo(() => {
        if (!postId) return;
        
        // Set up real-time subscription for comments
        const channel = supabase
            .channel(`comments_${postId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'comments',
                filter: `post_id=eq.${postId}`
            }, (payload) => {
                if (payload.new) {
                    const dbComment = payload.new as any;
                    const newComment: Comment = {
                        id: dbComment.id,
                        userId: dbComment.user_id,
                        authorName: dbComment.author_name,
                        authorImage: dbComment.author_image,
                        text: dbComment.text,
                        timestamp: dbComment.timestamp,
                        parentId: dbComment.parent_id,
                        reactions: dbComment.reactions || {}
                    };
                    setComments(prev => {
                        const existing = prev.filter(c => c.id !== newComment.id);
                        return [...existing, newComment].sort((a, b) => 
                            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                        );
                    });
                } else if (payload.eventType === 'DELETE') {
                    const oldComment = payload.old as any;
                    setComments(prev => prev.filter(c => c.id !== oldComment.id));
                }
            })
            .subscribe();

        // Also fetch comments initially
        const fetchComments = async () => {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('post_id', postId)
                .order('timestamp', { ascending: true });
            
            if (!error && data) {
                // Map database fields to TypeScript interface
                const mappedComments = data.map((comment: any) => ({
                    id: comment.id,
                    userId: comment.user_id,
                    authorName: comment.author_name,
                    authorImage: comment.author_image,
                    text: comment.text,
                    timestamp: comment.timestamp,
                    parentId: comment.parent_id,
                    reactions: comment.reactions || {}
                }));
                setComments(mappedComments);
            }
        };
        
        fetchComments();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [postId]);

    const handlePostComment = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        console.log('Comment submission attempt:', { currentUser, userDetails, newComment, loading, authTimeout });
        
        if (isAuthLoading) {
            console.log('Comment submission blocked: Auth still loading');
            return;
        }
        
        if (!currentUser || !userDetails || newComment.trim() === '') {
            console.log('Comment submission blocked:', { hasUser: !!currentUser, hasUserDetails: !!userDetails, hasComment: !!newComment.trim() });
            return;
        }

        try {
            // Add comment to Supabase
            const { error: commentError } = await supabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: currentUser.id,
                    author_name: userDetails.name,
                    author_image: userDetails.avatar_url,
                    text: newComment,
                    timestamp: new Date().toISOString(),
                    parent_id: replyingTo || null,
                    reactions: {},
                });

            if (commentError) throw commentError;

            // Update comment count on the post
            const { data: postData, error: fetchError } = await supabase
                .from('posts')
                .select('comment_count')
                .eq('id', postId)
                .single();
            
            if (fetchError) throw fetchError;
            
            const { error: updateError } = await supabase
                .from('posts')
                .update({ comment_count: (postData.comment_count || 0) + 1 })
                .eq('id', postId);

            if (updateError) throw updateError;

            setNewComment('');
            setReplyingTo(null);
            console.log('Comment posted successfully!');

        } catch (error) {
            console.error("Error posting comment: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not post comment.' });
        }
    }, [currentUser, userDetails, newComment, postId, replyingTo, toast]);

    const handleReaction = useCallback(async (commentId: string, emoji: string) => {
        if (!currentUser) return;

        try {
            // Get current comment data
            const { data: commentData, error: fetchError } = await supabase
                .from('comments')
                .select('reactions')
                .eq('id', commentId)
                .single();
            
            if (fetchError) throw fetchError;

            const reactions = commentData.reactions || {};
            const uidsForEmoji: string[] = reactions[emoji] || [];
            const userHasReacted = uidsForEmoji.includes(currentUser.id);

            const newUidsForEmoji = userHasReacted
                ? uidsForEmoji.filter((uid) => uid !== currentUser.id)
                : [...uidsForEmoji, currentUser.id];

            // Update the comment with new reactions
            const { error: updateError } = await supabase
                .from('comments')
                .update({
                    reactions: {
                        ...reactions,
                        [emoji]: newUidsForEmoji
                    }
                })
                .eq('id', commentId);

            if (updateError) throw updateError;
        } catch (error) {
            console.error("Error handling reaction: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not add reaction." });
        }
    }, [currentUser, toast]);
    
    const openProfile = async (userId: string) => {
        if (userId === currentUser?.id) {
            // Maybe navigate to own profile page in the future
            return;
        }
        
        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error && userData) {
            setSelectedUser(userData as User);
        }
    };

    const commentTree = useMemo(() => {
        const tree: CommentWithReplies[] = [];
        const lookup: { [key: string]: CommentWithReplies } = {};

        comments.forEach(comment => {
            lookup[comment.id] = { ...comment, replies: [] };
        });

        comments.forEach(comment => {
            if (comment.parentId && lookup[comment.parentId]) {
                lookup[comment.parentId].replies.push(lookup[comment.id]);
            } else {
                tree.push(lookup[comment.id]);
            }
        });

        return tree;
    }, [comments]);

    const renderComment = (comment: CommentWithReplies, isReply: boolean = false) => (
        <div key={comment.id} className={cn("flex flex-col gap-2", isReply ? "ml-6" : "")}>
            <div className="flex gap-3">
                <button onClick={() => openProfile(comment.userId)} className="cursor-pointer">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.authorImage} />
                        <AvatarFallback>{comment.authorName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </button>
                <div className="flex-1 bg-muted/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                        <button onClick={() => openProfile(comment.userId)} className="cursor-pointer">
                            <span className="font-semibold text-sm hover:underline">{comment.authorName}</span>
                        </button>
                        <span className="text-xs text-muted-foreground">{timeAgo(new Date(comment.timestamp))}</span>
                    </div>
                    <p className="text-sm mt-1">{comment.text}</p>
                     <div className="flex gap-1 mt-2 flex-wrap">
                        {comment.reactions && Object.entries(comment.reactions).map(([emoji, uids]) => (
                            (uids && uids.length > 0) && (
                                <button 
                                    key={emoji} 
                                    onClick={() => handleReaction(comment.id, emoji)}
                                    className={cn(
                                        "flex items-center bg-background px-2 py-0.5 rounded-full text-xs border transition-colors",
                                        currentUser && uids.includes(currentUser.id) ? "border-primary bg-primary/10" : "border-transparent hover:border-border"
                                    )}
                                >
                                    <span>{emoji}</span>
                                    <span className="ml-1 font-medium">{uids.length}</span>
                                </button>
                            )
                        ))}
                    </div>
                </div>
            </div>
            <div className="ml-11 flex gap-2 items-center">
                <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => setReplyingTo(comment.id)}>Reply</Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-xs h-8 w-8"><Smile className="h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-1">
                        <div className="flex gap-1">
                            {EMOJI_REACTIONS.map(emoji => (
                                <Button key={emoji} variant="ghost" size="icon" className="h-8 w-8 text-lg" onClick={() => handleReaction(comment.id, emoji)}>
                                    {emoji}
                                </Button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
             {comment.replies.length > 0 && (
                <div className="space-y-2">
                    {comment.replies.map(reply => renderComment(reply, true))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-4 pt-4">
            {selectedUser && <UserProfileDialog user={selectedUser} open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)} />}
            <div className="space-y-4">
                {commentTree.map(comment => renderComment(comment))}
            </div>
            <form onSubmit={handlePostComment} className="flex items-start gap-3 pt-4 border-t">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={userDetails?.avatar_url} />
                    <AvatarFallback>{userDetails?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                    <Textarea
                        placeholder={isAuthLoading ? "Loading..." : (replyingTo ? "Write a reply..." : "Add a comment...")}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="pr-20"
                        disabled={isAuthLoading}
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                        <Button 
                            type="submit" 
                            size="icon" 
                            className="h-8 w-8"
                            disabled={isAuthLoading || !newComment.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </form>
            {replyingTo && (
                <div className="text-sm text-muted-foreground ml-11">
                    Replying to a comment. <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setReplyingTo(null)}>Cancel</Button>
                </div>
            )}
        </div>
    );
}
