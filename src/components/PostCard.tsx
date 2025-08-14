
"use client";

import type { User, Post } from "@/types";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, MapPin, Briefcase, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, getDoc, deleteDoc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "./ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CreatePostDialog } from "./CreatePostDialog";
import { useToast } from "@/hooks/use-toast";
import { CommentSection } from "./CommentSection";
import { timeAgo } from "@/lib/utils";


interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [author, setAuthor] = useState<User | null>(null);
  const [loadingAuthor, setLoadingAuthor] = useState(true);
  const [likes, setLikes] = useState(post.likedBy?.length || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  useEffect(() => {
    const fetchAuthor = async () => {
      setLoadingAuthor(true);
      if (post.userId) {
        try {
          const userDocRef = doc(db, "users", post.userId);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
              setAuthor({ id: userDocSnap.id, ...userDocSnap.data() } as User);
          } else {
              setAuthor({ 
                  id: post.userId, 
                  uid: post.userId,
                  name: post.authorName || 'Deleted User', 
                  avatarUrl: post.authorImage || 'https://placehold.co/100x100.png'
              });
          }
        } catch (error) {
          console.error("Error fetching author:", error);
          setAuthor(null);
        } finally {
          setLoadingAuthor(false);
        }
      } else {
         setAuthor({ 
            id: 'unknown',
            uid: 'unknown',
            name: post.authorName || 'Anonymous User', 
            avatarUrl: post.authorImage || 'https://placehold.co/100x100.png'
        });
        setLoadingAuthor(false);
      }
    };

    fetchAuthor();
  }, [post.userId, post.authorName, post.authorImage]);

  useEffect(() => {
    if (!post.id) return;
    const postRef = doc(db, "posts", post.id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
        if(docSnap.exists()) {
            const postData = docSnap.data();
            setLikes(postData.likedBy?.length || 0);
            setCommentCount(postData.commentCount || 0);
            if (currentUser && postData.likedBy) {
              setIsLiked(postData.likedBy.includes(currentUser.uid));
            }
        }
    });

    return () => unsubscribe();
  }, [post.id, currentUser]);

  const handleLike = async () => {
    if (!currentUser || !post.id) return;
    const postRef = doc(db, "posts", post.id);

    await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
            throw "Document does not exist!";
        }

        const postData = postDoc.data();
        const currentLikedBy = postData.likedBy || [];
        const userHasLiked = currentLikedBy.includes(currentUser.uid);

        if (userHasLiked) {
            transaction.update(postRef, { likedBy: arrayRemove(currentUser.uid) });
        } else {
            transaction.update(postRef, { likedBy: arrayUnion(currentUser.uid) });
        }
    });
  };

  const handleDelete = async () => {
    if (!currentUser || !post.id || currentUser.uid !== post.userId) return;
    try {
        await deleteDoc(doc(db, "posts", post.id));
        toast({ title: "Post deleted", description: "Your post has been successfully removed." });
    } catch (error) {
        console.error("Error deleting post:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to delete post." });
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Event":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">{category}</Badge>;
      case "For Sale":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">{category}</Badge>;
      case "Business":
         return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1"><Briefcase className="h-3 w-3"/>{category}</Badge>;
      case "General":
      default:
        return <Badge variant="secondary">{category}</Badge>;
    }
  }

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    const shareData = {
      title: `Post by ${author?.name || 'a user'} on Yrdly`,
      text: post.text,
      url: postUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: "Post shared!" });
      } catch {
        // Don't show an error toast if the user cancels the share dialog
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        toast({ title: "Link copied!", description: "The post link has been copied to your clipboard." });
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not copy link to clipboard." });
      }
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        {loadingAuthor ? (
            <div className="flex items-center gap-4 w-full">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                </div>
            </div>
        ) : author ? (
            <>
                <Avatar>
                <AvatarImage src={author.avatarUrl} alt={author.name} data-ai-hint="person portrait" />
                <AvatarFallback>{author.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                <p className="font-semibold">{author.name}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(post.timestamp?.toDate())}</p>
                </div>
                {getCategoryBadge(post.category)}
            </>
        ) : null}
        {currentUser?.uid === post.userId && (
             <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <CreatePostDialog postToEdit={post}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                        </CreatePostDialog>
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
                        This action cannot be undone. This will permanently delete your post and all its comments.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </CardHeader>

      <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <CardContent className="p-4 pt-0">
            <p className="whitespace-pre-wrap">{post.text}</p>
            {post.eventLocation && (
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4 mr-1"/>
                    <span>{post.eventLocation.address}</span>
                </div>
            )}
        </CardContent>
        {post.imageUrl && (
            <div className="relative w-full aspect-video">
            <Image
                src={post.imageUrl}
                alt="Post image"
                fill
                className="object-cover"
                data-ai-hint="neighborhood street"
            />
            </div>
        )}
        <CardFooter className="p-2 bg-background/50">
            <div className="flex justify-around w-full">
            <Button variant="ghost" className="flex-1 gap-2" onClick={handleLike}>
                <Heart className={`h-5 w-5 ${isLiked ? "text-red-500 fill-current" : ""}`} />
                <span className="text-sm">{likes}</span>
            </Button>
             <CollapsibleTrigger asChild>
                 <Button variant="ghost" className="flex-1 gap-2">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm">{commentCount}</span>
                </Button>
             </CollapsibleTrigger>
            <Button variant="ghost" className="flex-1 gap-2" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
                <span className="text-sm">Share</span>
            </Button>
            </div>
        </CardFooter>
        <CollapsibleContent>
            <div className="p-4 pt-0">
                <CommentSection postId={post.id} />
            </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
