
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, PackageOpen } from "lucide-react";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { useState, useEffect } from "react";
import type { Post as PostType } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PostCard } from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";

function EmptyMarketplace() {
    return (
        <div className="text-center py-16">
            <div className="inline-block bg-muted p-4 rounded-full mb-4">
                <PackageOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">No items yet</h2>
            <p className="text-muted-foreground mt-2 mb-6">Be the first to list something for sale in your neighborhood!</p>
             <CreatePostDialog preselectedCategory="For Sale">
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> List an Item
                </Button>
            </CreatePostDialog>
        </div>
    )
}

export default function MarketplacePage() {
    const [items, setItems] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "posts"), where("category", "==", "For Sale"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const itemsData = querySnapshot.docs.map(doc => {
                 const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                } as PostType;
            });
            setItems(itemsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline">For Sale & Free</h1>
            <p className="text-muted-foreground">Buy and sell items in your neighborhood.</p>
        </div>
         <CreatePostDialog preselectedCategory="For Sale">
            <Button>
                <Plus className="mr-2 h-4 w-4" /> List an Item
            </Button>
        </CreatePostDialog>
       </div>

        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search for items..." className="pl-10" />
        </div>
        
        {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        ) : items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map(item => (
                    <PostCard key={item.id} post={item} />
                ))}
            </div>
        ) : (
            <EmptyMarketplace />
        )}

    </div>
  );
}
