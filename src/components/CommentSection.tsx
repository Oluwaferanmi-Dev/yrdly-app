'use client';

import { useState, useEffect, useCallback, useMemo, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
    Edit2, 
    Trash2, 
    MoreHorizontal, 
    Smile
} from 'lucide-react';
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from '@/components/ui/popover';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Comment {
    id: string;
    userId: string;
    authorName: string;
    authorImage: string;
    text: string;
    timestamp: string;
    parentId?: string;
    reactions: Record<string, string[]>;
}

interface CommentSectionProps {
    postId: string;
    onCommentCountChange?: (count: number) => void;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😡'];

export function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
    const { user: currentUser, profile: userDetails, loading } = useAuth();
    const { toast } = useToast();
    
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

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
    
    // Use timeout state if auth is stuck loading
    const isAuthLoading = loading && !authTimeout;

    useMemo(() => {
        if (!postId) return;
        
        console.log('Setting up real-time subscription for post:', postId);
        
        // Set up real-time subscription for comments
        const channel = supabase
            .channel(`comments_${postId}_${Date.now()}`) // Add timestamp to make channel unique
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'comments',
                filter: `post_id=eq.${postId}`
            }, (payload) => {
                console.log('Comment real-time update:', payload);
                console.log('Event type:', payload.eventType);
                console.log('Payload new:', payload.new);
                console.log('Payload old:', payload.old);
                
                if (payload.eventType === 'INSERT' && payload.new) {
                    console.log('Handling INSERT event');
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
                        console.log('Adding new comment:', newComment.id);
                        const existing = prev.filter(c => c.id !== newComment.id);
                        return [...existing, newComment].sort((a, b) => 
                            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                        );
                    });
                } else if (payload.eventType === 'UPDATE' && payload.new) {
                    console.log('Handling UPDATE event');
                    const dbComment = payload.new as any;
                    
                    const updatedComment: Comment = {
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
                        console.log('Updating comment:', updatedComment.id);
                        return prev.map(c => c.id === updatedComment.id ? updatedComment : c);
                    });
                } else if (payload.eventType === 'DELETE' && payload.old) {
                    console.log('Handling DELETE event');
                    const oldComment = payload.old as any;
                    console.log('Deleting comment:', oldComment.id);
                    setComments(prev => {
                        const filtered = prev.filter(c => c.id !== oldComment.id);
                        console.log('Comments after deletion:', filtered.length);
                        return filtered;
                    });
                }
            })
            .subscribe((status) => {
                console.log('Comments subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to comments real-time updates');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Error subscribing to comments real-time updates');
                    console.log('Falling back to polling mode for comments');
                } else if (status === 'CLOSED') {
                    console.log('Comments subscription closed');
                }
            });

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
            console.log('Cleaning up comments subscription for post:', postId);
            supabase.removeChannel(channel);
        };
    }, [postId]);

    const handlePostComment = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        console.log('Comment submission attempt:', { currentUser, userDetails, newComment, loading, authTimeout });
        
        if (!currentUser || !userDetails || !newComment.trim()) {
            console.log('Missing requirements:', { 
                hasCurrentUser: !!currentUser, 
                hasUserDetails: !!userDetails, 
                hasComment: !!newComment.trim() 
            });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: currentUser.id,
                    author_name: userDetails.name || userDetails.email || 'Anonymous',
                    author_image: userDetails.avatar_url || '',
                    text: newComment.trim(),
                    parent_id: replyingTo || null
                })
                .select()
                .single();

            if (error) throw error;

            setNewComment('');
            setReplyingTo(null);
            
            toast({ title: 'Success', description: 'Comment posted successfully.' });
            
            // Trigger notification for post comment
            try {
                const { NotificationTriggers } = await import('@/lib/notification-triggers');
                await NotificationTriggers.onPostCommented(postId, currentUser.id, newComment.trim());
            } catch (error) {
                console.error('Error creating comment notification:', error);
            }
            
            // Update comment count on the post
            if (onCommentCountChange) {
                const { data: postData, error: fetchError } = await supabase
                    .from('posts')
                    .select('comment_count')
                    .eq('id', postId)
                    .single();
                
                if (!fetchError && postData) {
                    const newCommentCount = (postData.comment_count || 0) + 1;
                    
                    await supabase
                        .from('posts')
                        .update({ comment_count: newCommentCount })
                        .eq('id', postId);
                    
                    onCommentCountChange(newCommentCount);
                }
            }
            
            // Temporary workaround: refresh comments if real-time doesn't work
            setTimeout(() => {
                const refreshComments = async () => {
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
                            reactions: comment.reactions || {}
                        }));
                        setComments(mappedComments);
                        console.log('Refreshed comments after posting');
                    }
                };
                refreshComments();
            }, 1000); // Wait 1 second for real-time to work, then refresh
            
        } catch (error) {
            console.error('Error posting comment:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not post comment.' });
        }
    }, [currentUser, userDetails, newComment, postId, replyingTo, toast, onCommentCountChange]);

    const handleEditComment = useCallback(async (commentId: string) => {
        if (!currentUser || !editText.trim()) return;
        
        try {
            const { error } = await supabase
                .from('comments')
                .update({ 
                    text: editText.trim()
                })
                .eq('id', commentId)
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
            
            setEditingComment(null);
            setEditText('');
            toast({ title: 'Success', description: 'Comment updated successfully.' });
            
            // Temporary workaround: refresh comments if real-time doesn't work
            setTimeout(() => {
                const refreshComments = async () => {
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
                            reactions: comment.reactions || {}
                        }));
                        setComments(mappedComments);
                        console.log('Refreshed comments after editing');
                    }
                };
                refreshComments();
            }, 1000); // Wait 1 second for real-time to work, then refresh
        } catch (error) {
            console.error('Error editing comment:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not edit comment.' });
        }
    }, [currentUser, editText, toast]);

    const handleDeleteComment = useCallback(async (commentId: string) => {
        if (!currentUser) return;
        
        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
            
            // Update comment count on the post
            const { data: postData, error: fetchError } = await supabase
                .from('posts')
                .select('comment_count')
                .eq('id', postId)
                .single();
            
            if (!fetchError && postData) {
                const newCommentCount = Math.max((postData.comment_count || 0) - 1, 0);
                
                await supabase
                    .from('posts')
                    .update({ comment_count: newCommentCount })
                    .eq('id', postId);
                
                if (onCommentCountChange) {
                    onCommentCountChange(newCommentCount);
                }
            }
            
            toast({ title: 'Success', description: 'Comment deleted successfully.' });
            
            // Temporary workaround: refresh comments if real-time doesn't work
            setTimeout(() => {
                const refreshComments = async () => {
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
                            reactions: comment.reactions || {}
                        }));
                        setComments(mappedComments);
                        console.log('Refreshed comments after deletion');
                    }
                };
                refreshComments();
            }, 1000); // Wait 1 second for real-time to work, then refresh
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete comment.' });
        }
    }, [currentUser, postId, toast, onCommentCountChange]);

    const handleReaction = useCallback(async (commentId: string, emoji: string) => {
        if (!currentUser) return;
        
        try {
            const comment = comments.find(c => c.id === commentId);
            if (!comment) return;
            
            const currentReactions = comment.reactions || {};
            const userReactions = currentReactions[emoji] || [];
            const hasReacted = userReactions.includes(currentUser.id);
            
            let newReactions = { ...currentReactions };
            
            if (hasReacted) {
                // Remove reaction
                newReactions[emoji] = userReactions.filter(id => id !== currentUser.id);
                if (newReactions[emoji].length === 0) {
                    delete newReactions[emoji];
                }
            } else {
                // Add reaction
                newReactions[emoji] = [...userReactions, currentUser.id];
            }
            
            const { error } = await supabase
                .from('comments')
                .update({ reactions: newReactions })
                .eq('id', commentId);
            
            if (error) throw error;
            
        } catch (error) {
            console.error('Error handling reaction:', error);
        }
    }, [currentUser, comments]);

    const startEditing = useCallback((comment: Comment) => {
        setEditingComment(comment.id);
        setEditText(comment.text);
    }, []);

    const cancelEditing = useCallback(() => {
        setEditingComment(null);
        setEditText('');
    }, []);

    const timeAgo = useCallback((date: Date | null) => {
        if (!date) return '';
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        return `${Math.floor(diffInSeconds / 86400)}d`;
    }, []);

    const renderComment = useCallback((comment: Comment, isReply: boolean = false) => {
        return (
            <div key={comment.id} className={cn("flex flex-col gap-2", isReply ? "ml-6" : "")}>
                <div className="flex gap-3">
                    <button onClick={() => {}} className="cursor-pointer">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.authorImage} />
                            <AvatarFallback>{comment.authorName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </button>
                    <div className="flex-1 bg-muted/50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <button onClick={() => {}} className="cursor-pointer">
                                    <span className="font-semibold text-sm hover:underline">{comment.authorName}</span>
                                </button>
                                <span className="text-xs text-muted-foreground">{timeAgo(new Date(comment.timestamp))}</span>
                            </div>
                            {currentUser && currentUser.id === comment.userId && (
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => startEditing(comment)}>
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
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete your comment.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={() => handleDeleteComment(comment.id)} 
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                        
                        {editingComment === comment.id ? (
                            <div className="mt-2 space-y-2">
                                <Textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="min-h-[60px]"
                                    placeholder="Edit your comment..."
                                />
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        onClick={() => handleEditComment(comment.id)}
                                        disabled={!editText.trim()}
                                    >
                                        Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelEditing}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm mt-1">{comment.text}</p>
                        )}
                        
                        {editingComment !== comment.id && (
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
                        )}
                    </div>
                </div>
                
                {editingComment !== comment.id && (
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
                )}
            </div>
        );
    }, [currentUser, editingComment, editText, handleEditComment, handleDeleteComment, handleReaction, startEditing, cancelEditing, timeAgo]);

    if (isAuthLoading) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                Loading comments...
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                Please sign in to view comments
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <form onSubmit={handlePostComment} className="space-y-3">
                <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={userDetails?.avatar_url} />
                        <AvatarFallback>{userDetails?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="min-h-[80px] resize-none"
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewComment('')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!newComment.trim()}
                    >
                        Post
                    </Button>
                </div>
            </form>

            <div className="space-y-4">
                {comments.map(comment => renderComment(comment))}
            </div>
        </div>
    );
}