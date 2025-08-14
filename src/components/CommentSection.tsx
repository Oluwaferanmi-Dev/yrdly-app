
"use client";

import { useState, useMemo, FormEvent, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, serverTimestamp, doc, runTransaction, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Comment, User } from '@/types';
import { useAuth } from '@/hooks/use-auth';
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

type SelectedUser = {
    user: User,
    status: 'friends' | 'request_sent' | 'request_received' | 'none';
}

export function CommentSection({ postId }: CommentSectionProps) {
    const { user: currentUser, userDetails } = useAuth();
    const { toast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

    useMemo(() => {
        if (!postId) return;
        const commentsQuery = query(
            collection(db, 'posts', postId, 'comments'),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Comment));
            setComments(fetchedComments);
        });

        return () => unsubscribe();
    }, [postId]);

    const handlePostComment = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentUser || !userDetails || newComment.trim() === '') return;

        const postRef = doc(db, "posts", postId);
        const commentsColRef = collection(postRef, "comments");

        try {
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) {
                    throw "Post does not exist!";
                }

                transaction.set(doc(commentsColRef), {
                    userId: currentUser.uid,
                    authorName: userDetails.name,
                    authorImage: userDetails.avatarUrl,
                    text: newComment,
                    timestamp: serverTimestamp(),
                    parentId: replyingTo || null,
                    reactions: {},
                });

                const newCount = (postDoc.data().commentCount || 0) + 1;
                transaction.update(postRef, { commentCount: newCount });
            });

            setNewComment('');
            setReplyingTo(null);

        } catch (error) {
            console.error("Error posting comment: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not post comment.' });
        }
    };

    const handleReaction = async (commentId: string, emoji: string) => {
        if (!currentUser) return;
        const commentRef = doc(db, 'posts', postId, 'comments', commentId);

        try {
            await runTransaction(db, async (transaction) => {
                const commentDoc = await transaction.get(commentRef);
                if (!commentDoc.exists()) return;

                const reactions = commentDoc.data().reactions || {};
                const uidsForEmoji: string[] = reactions[emoji] || [];
                const userHasReacted = uidsForEmoji.includes(currentUser.uid);

                const newUidsForEmoji = userHasReacted
                    ? uidsForEmoji.filter((uid) => uid !== currentUser.uid)
                    : [...uidsForEmoji, currentUser.uid];

                transaction.update(commentRef, {
                    [`reactions.${emoji}`]: newUidsForEmoji
                });
            });
        } catch (error) {
            console.error("Error handling reaction: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not add reaction." });
        }
    };

    const getFriendshipStatus = useCallback((neighborId: string): 'friends' | 'none' => {
        if (userDetails?.friends?.includes(neighborId)) return "friends";
        return "none";
    }, [userDetails]);
    
    const openProfile = async (userId: string) => {
        if (userId === currentUser?.uid) {
            // Maybe navigate to own profile page in the future
            return;
        }
        
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const user = {id: userDocSnap.id, ...userDocSnap.data()} as User;
            // Simplified status for comment section - real-time request status not needed here
            const status = getFriendshipStatus(userId);
            setSelectedUser({ user, status });
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
                        <span className="text-xs text-muted-foreground">{timeAgo(comment.timestamp?.toDate())}</span>
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
                                        currentUser && uids.includes(currentUser.uid) ? "border-primary bg-primary/10" : "border-transparent hover:border-border"
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
            {selectedUser && <UserProfileDialog user={selectedUser.user} friendshipStatus={selectedUser.status} open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)} />}
            <div className="space-y-4">
                {commentTree.map(comment => renderComment(comment))}
            </div>
            <form onSubmit={handlePostComment} className="flex items-start gap-3 pt-4 border-t">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={userDetails?.avatarUrl} />
                    <AvatarFallback>{userDetails?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                    <Textarea
                        placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="pr-20"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                        <Button type="submit" size="icon" className="h-8 w-8">
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
