
"use client";

import type { Post } from "@/types";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";


interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes || 0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!post.id) return;
    const postRef = doc(db, "posts", post.id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
        if(docSnap.exists()) {
            const postData = docSnap.data();
            setLikes(postData.likedBy?.length || 0);
            if (user) {
              setIsLiked(postData.likedBy?.includes(user.uid));
            }
        }
    });

    return () => unsubscribe();
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user || !post.id) return;
    const postRef = doc(db, "posts", post.id);

    if (isLiked) {
      await updateDoc(postRef, {
        likedBy: arrayRemove(user.uid)
      });
    } else {
      await updateDoc(postRef, {
        likedBy: arrayUnion(user.uid)
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Event":
        return "bg-accent text-accent-foreground hover:bg-accent/80";
      case "For Sale":
        return "bg-blue-500 text-white hover:bg-blue-500/80";
      case "General":
      default:
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={post.user?.avatarUrl} alt={post.user?.name} data-ai-hint="person portrait" />
          <AvatarFallback>{post.user?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{post.user?.name}</p>
          <p className="text-xs text-muted-foreground">{post.timestamp}</p>
        </div>
        <Badge variant="outline" className={getCategoryColor(post.category)}>{post.category}</Badge>
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
