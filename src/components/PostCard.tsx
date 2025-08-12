
"use client";

import type { Post, User } from "@/types";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, MapPin, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "./ui/skeleton";


interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user: currentUser } = useAuth();
  const [author, setAuthor] = useState<User | null>(null);
  const [loadingAuthor, setLoadingAuthor] = useState(true);
  const [likes, setLikes] = useState(post.likes || 0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!post.userId) {
        setLoadingAuthor(false);
        return;
    };

    const userDocRef = doc(db, "users", post.userId);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setAuthor({ id: docSnap.id, ...docSnap.data() } as User);
        } else {
            setAuthor(null);
        }
        setLoadingAuthor(false);
    });

    return () => unsubscribe();
  }, [post.userId]);

  useEffect(() => {
    if (!post.id) return;
    const postRef = doc(db, "posts", post.id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
        if(docSnap.exists()) {
            const postData = docSnap.data();
            setLikes(postData.likedBy?.length || 0);
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

    if (isLiked) {
      await updateDoc(postRef, {
        likedBy: arrayRemove(currentUser.uid)
      });
    } else {
      await updateDoc(postRef, {
        likedBy: arrayUnion(currentUser.uid)
      });
    }
  };

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
                <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                </div>
                {getCategoryBadge(post.category)}
            </>
        ) : (
             <div className="flex items-center gap-4 w-full">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <p className="font-semibold text-sm">Deleted User</p>
                    <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                </div>
            </div>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="whitespace-pre-wrap">{post.text}</p>
        {post.location && (
            <div className="flex items-center text-sm text-muted-foreground mt-2">
                <MapPin className="h-4 w-4 mr-1"/>
                <span>{post.location}</span>
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
          <Button variant="ghost" className="flex-1 gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">{post.comments?.length || 0}</span>
          </Button>
          <Button variant="ghost" className="flex-1 gap-2">
            <Share2 className="h-5 w-5" />
            <span className="text-sm">Share</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
