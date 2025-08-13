"use client";

import { useState, useMemo, FormEvent } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Comment } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, Smile, ThumbsUp, Heart, Laugh, Angry } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface CommentSectionProps {
    postId: string;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😡'];

export function CommentSection({ postId }: CommentSectionProps) {
    const { user, userDetails } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

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
        if (!user || newComment.trim() === '') return;

        await addDoc(collection(db, 'posts', postId, 'comments'), {
            userId: user.uid,
            authorName: userDetails?.name,
            authorImage: userDetails?.avatarUrl,
            text: newComment,
            timestamp: serverTimestamp(),
            parentId: replyingTo,
            reactions: {},
        });

        // Also update the comment count on the post
        const postRef = doc(db, "posts", postId);
        await runTransaction(db, async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists()) return;
            const newCount = (postDoc.data().commentCount || 0) + 1;
            transaction.update(postRef, { commentCount: newCount });
        });

        setNewComment('');
        setReplyingTo(null);
    };

    const handleReaction = async (commentId: string, emoji: string) => {
        if (!user) return;
        const commentRef = doc(db, 'posts', postId, 'comments', commentId);

        await runTransaction(db, async (transaction) => {
            const commentDoc = await transaction.get(commentRef);
            if (!commentDoc.exists()) return;

            const reactions = commentDoc.data().reactions || {};
            const existingReaction = reactions[emoji] || [];

            if (existingReaction.includes(user.uid)) {
                // User is removing their reaction
                transaction.update(commentRef, {
                    [`reactions.${emoji}`]: existingReaction.filter((uid: string) => uid !== user.uid)
                });
            } else {
                // User is adding a new reaction
                transaction.update(commentRef, {
                    [`reactions.${emoji}`]: [...existingReaction, user.uid]
                });
            }
        });
    };

    const commentTree = useMemo(() => {
        const tree: (Comment & { replies: Comment[] })[] = [];
        const lookup: { [key: string]: Comment & { replies: Comment[] } } = {};

        comments.forEach(comment => {
            lookup[comment.id] = { ...comment, replies: [] };
        });

        comments.forEach(comment => {
            if (comment.parentId) {
                if (lookup[comment.parentId]) {
                    lookup[comment.parentId].replies.push(lookup[comment.id]);
                }
            } else {
                tree.push(lookup[comment.id]);
            }
        });

        return tree;
    }, [comments]);

    const renderComment = (comment: Comment & { replies: Comment[] }) => (
        <div key={comment.id} className="flex flex-col gap-2">
            <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.authorImage} />
                    <AvatarFallback>{comment.authorName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">{comment.authorName}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(comment.timestamp?.toDate())}</span>
                    </div>
                    <p className="text-sm mt-1">{comment.text}</p>
                    {comment.reactions && Object.keys(comment.reactions).length > 0 && (
                         <div className="flex gap-1 mt-2">
                            {Object.entries(comment.reactions).map(([emoji, uids]) => (
                                uids.length > 0 && (
                                    <div key={emoji} className="flex items-center bg-background px-2 py-0.5 rounded-full text-xs">
                                        <span>{emoji}</span>
                                        <span className="ml-1 font-medium">{uids.length}</span>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="ml-11 flex gap-2 items-center">
                <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => setReplyingTo(comment.id)}>Reply</Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2"><Smile className="h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-1">
                        <div className="flex gap-1">
                            {EMOJI_REACTIONS.map(emoji => (
                                <Button key={emoji} variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReaction(comment.id, emoji)}>
                                    {emoji}
                                </Button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            {comment.replies.map(renderComment)}
        </div>
    );

    return (
        <div className="space-y-4 pt-4">
            <div className="space-y-4">
                {commentTree.map(renderComment)}
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