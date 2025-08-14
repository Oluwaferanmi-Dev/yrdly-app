
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, PackageOpen } from "lucide-react";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { useState, useEffect, useMemo } from "react";
import type { Post as PostType } from "@/types";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MarketplaceItemCard } from "@/components/MarketplaceItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

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

interface CategorySectionProps {
    title: string;
    items: PostType[];
}

function CategorySection({ title, items }: CategorySectionProps) {
    if (items.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{title}</h2>
                <Button variant="ghost" asChild>
                    <Link href="#">See all in {title}</Link>
                </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map(item => (
                    <MarketplaceItemCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}


export default function MarketplacePage() {
    const [items, setItems] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "posts"), 
            where("category", "==", "For Sale"),
            orderBy("timestamp", "desc")
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const itemsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as PostType));
            setItems(itemsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // This is a placeholder for actual categorization logic
    // In a real app, you might have sub-categories stored with the post
    const categorizedItems = useMemo(() => {
        const furniture = items.filter(i => i.text.toLowerCase().includes('desk') || i.text.toLowerCase().includes('cabinet') || i.text.toLowerCase().includes('table'));
        const pets = items.filter(i => i.text.toLowerCase().includes('dog') || i.text.toLowerCase().includes('pet') || i.text.toLowerCase().includes('tortoise'));
        const other = items.filter(i => !furniture.includes(i) && !pets.includes(i));
        return { furniture, pets, other };
    }, [items]);

  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline">For Sale & Free</h1>
            <p className="text-muted-foreground">Buy and sell items in your neighborhood.</p>
        </div>
       </div>

        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search For sale & free" className="pl-10 h-12 rounded-full bg-muted border-none" />
        </div>
        
        {loading ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
        ) : items.length > 0 ? (
            <div className="space-y-8">
                <CategorySection title="Featured" items={categorizedItems.other} />
                <CategorySection title="Furniture" items={categorizedItems.furniture} />
                <CategorySection title="Spoil your pets" items={categorizedItems.pets} />
            </div>
        ) : (
            <EmptyMarketplace />
        )}
        
        <div className="fixed bottom-20 right-4 z-20">
            <CreatePostDialog preselectedCategory="For Sale">
                <Button className="rounded-full h-14 w-14 shadow-lg" style={{backgroundColor: '#34A853'}}>
                    <Plus className="h-6 w-6" />
                </Button>
             </CreatePostDialog>
        </div>
    </div>
  );
}
