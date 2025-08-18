
"use client";

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post as PostType } from '@/types';
import { PostCard } from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PostPageProps {
    params: {
        id: string;
    };
}



export default function PostPage({ params }: PostPageProps) {
    const [post, setPost] = useState<PostType | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!params.id) {
            setLoading(false);
            return;
        }

        const postRef = doc(db, 'posts', params.id);
        const unsubscribe = onSnapshot(postRef, (docSnap) => {
            if (docSnap.exists()) {
                setPost({ id: docSnap.id, ...docSnap.data() } as PostType);
            } else {
                // Handle case where post doesn't exist, maybe redirect
                router.push('/home');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto space-y-4">
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    
    if (!post) {
        return (
            <div className="max-w-2xl mx-auto text-center py-10">
                <h1 className="text-2xl font-bold">Post not found</h1>
                <p className="text-muted-foreground">The post you are looking for does not exist or has been deleted.</p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
             {post.category === "For Sale" && (
                <Button variant="ghost" onClick={() => router.push('/marketplace')} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Marketplace
                </Button>
             )}
              {post.category === "Event" && (
                <Button variant="ghost" onClick={() => router.push('/events')} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Events
                </Button>
             )}
            <PostCard post={post} />
        </div>
    );
}
