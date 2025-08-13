
"use client";

import { PostCard } from "@/components/PostCard";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Post as PostType } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Heart, Users, Building, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function WelcomeBanner() {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <Alert className="bg-accent border-primary/20 text-accent-foreground mb-6">
          <button onClick={() => setIsVisible(false)} className="absolute top-2 right-2 text-accent-foreground/70 hover:text-accent-foreground">
            <X className="h-4 w-4" />
          </button>
          <AlertTitle className="font-bold text-lg flex items-center gap-2">
            Welcome to Yardly, {user?.displayName?.split(' ')[0] || 'Test'}! 👋
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">You're now part of your neighborhood network. Here's how to get started:</p>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary"/> Share community posts</div>
                <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Connect with neighbors</div>
                <div className="flex items-center gap-2"><Building className="h-5 w-5 text-primary"/> Discover local businesses</div>
            </div>
            <div className="flex gap-2">
                <Button asChild variant="default" size="sm"><Link href="/settings">Complete Profile</Link></Button>
                <Button asChild variant="outline" size="sm"><Link href="/neighbors">Find Neighbors</Link></Button>
            </div>
          </AlertDescription>
        </Alert>
    )
}

function EmptyFeed() {
    return (
        <Card className="text-center p-8 md:p-16">
            <CardContent>
                <div className="flex justify-center mb-4">
                    <span className="text-5xl" role="img" aria-label="Waving hand">👋</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome to your neighborhood!</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">This is where you'll see updates from your neighbors. Be the first to share something with your community!</p>
                <CreatePostDialog>
                   <Button>Create Your First Post</Button>
                </CreatePostDialog>
            </CardContent>
        </Card>
    )
}

export default function Home() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // A simple check to see if user is new. In a real app, this would be more robust.
    const checkNewUserQuery = query(collection(db, "posts"), limit(1));
    const unsubCheck = onSnapshot(checkNewUserQuery, (snapshot) => {
        if (snapshot.empty) {
            setIsNewUser(true);
        } else {
            setIsNewUser(false);
        }
    });

    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate().toLocaleString() ?? new Date().toLocaleString(),
        } as PostType;
      });
      setPosts(postsData);
      setLoading(false);
    });

    return () => {
        unsubCheck();
        unsubscribe();
    }
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {isNewUser && <WelcomeBanner />}
      
      <Card>
        <CardContent className="p-4">
           <CreatePostDialog />
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <EmptyFeed />
        )}
      </div>
    </div>
  );
}
