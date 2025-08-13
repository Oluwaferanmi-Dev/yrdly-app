
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { Comment as CommentType } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { Input } from "./ui/input";
import { Send } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface CommentSectionProps {
  postId: string;
}

const commentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty."),
});

const CommentSkeleton = () => (
    <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-48" />
        </div>
    </div>
);

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: "" },
  });

  useEffect(() => {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const commentsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toLocaleString() ?? new Date().toLocaleString(),
      } as CommentType));
      setComments(commentsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [postId]);

  const onSubmit = async (values: z.infer<typeof commentSchema>) => {
    if (!user) return;

    const postRef = doc(db, "posts", postId);
    const commentsRef = collection(db, "posts", postId, "comments");
    
    try {
        await runTransaction(db, async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists()) {
                throw "Post does not exist!";
            }
            const newCommentCount = (postDoc.data().commentCount || 0) + 1;
            
            transaction.update(postRef, { commentCount: newCommentCount });

            await addDoc(commentsRef, {
                userId: user.uid,
                authorName: user.displayName,
                authorImage: user.photoURL,
                text: values.text,
                timestamp: serverTimestamp(),
            });
        });

        form.reset();
    } catch (error) {
        console.error("Error adding comment: ", error);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {loading ? (
        <div className="space-y-4">
            <CommentSkeleton />
            <CommentSkeleton />
        </div>
      ) : comments.length > 0 ? (
        comments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.authorImage} />
              <AvatarFallback>{comment.authorName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-muted rounded-lg px-3 py-2">
                <p className="text-sm font-semibold">{comment.authorName}</p>
                <p className="text-sm">{comment.text}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{comment.timestamp}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-center">No comments yet. Be the first to comment!</p>
      )}

      {user && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || ''} />
              <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Write a comment..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
