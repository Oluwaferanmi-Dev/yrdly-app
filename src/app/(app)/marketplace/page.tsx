
"use client";

import { Button } from "@/components/ui/button";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';
import { Input } from "@/components/ui/input";
import { Search, Plus, ShoppingCart } from "lucide-react";
import { CreateItemDialog } from "@/components/CreateItemDialog";
import { useState, useEffect, useMemo } from "react";
import type { Post as PostType } from "@/types";
import { supabase } from "@/lib/supabase";
import { EnhancedItemCard } from "@/components/marketplace/EnhancedItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function EmptyMarketplace() {
    return (
        <div className="text-center py-16">
            <div className="inline-block bg-muted p-4 rounded-full mb-4">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">The marketplace is empty</h2>
            <p className="text-muted-foreground mt-2 mb-6">Be the first to list an item for sale in your neighborhood!</p>
        </div>
    )
}

export default function MarketplacePage() {
    const [items, setItems] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingItem, setEditingItem] = useState<PostType | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const { data, error } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('category', 'For Sale')
                    .order('timestamp', { ascending: false });

                if (error) {
                    console.error('Error fetching marketplace items:', error);
                    return;
                }

                setItems(data as PostType[]);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching marketplace items:', error);
                setLoading(false);
            }
        };

        fetchItems();

        // Set up real-time subscription
        const channel = supabase
            .channel('marketplace-items')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'posts',
                filter: 'category=eq.For Sale'
            }, (payload) => {
                console.log('Marketplace realtime change received!', payload);
                
                if (payload.eventType === 'INSERT') {
                    // Add new item to the beginning of the list
                    const newItem = payload.new as PostType;
                    setItems(prevItems => [newItem, ...prevItems]);
                } else if (payload.eventType === 'UPDATE') {
                    // Update existing item in the list
                    const updatedItem = payload.new as PostType;
                    setItems(prevItems => 
                        prevItems.map(item => 
                            item.id === updatedItem.id ? updatedItem : item
                        )
                    );
                } else if (payload.eventType === 'DELETE') {
                    // Remove deleted item from the list
                    const deletedId = payload.old.id;
                    setItems(prevItems => 
                        prevItems.filter(item => item.id !== deletedId)
                    );
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredItems = useMemo(() => {
        if (!searchTerm) {
            return items;
        }
        return items.filter(item =>
            (item.text?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    const handleEditItem = (item: PostType) => {
        setEditingItem(item);
        setIsEditDialogOpen(true);
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', itemId);
            
            if (error) {
                throw error;
            }
            
            toast({
                title: "Success",
                description: "Item deleted successfully",
            });
        } catch (error) {
            console.error("Failed to delete item:", error);
            toast({
                title: "Error",
                description: "Failed to delete item. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleEditDialogClose = () => {
        setEditingItem(null);
        setIsEditDialogOpen(false);
    };

  return (
    <div className="space-y-8 pt-16">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline">For Sale & Free</h1>
            <p className="text-muted-foreground">Buy and sell items in your neighborhood.</p>
        </div>
       </div>

        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Search For sale & free" 
                className="pl-10 h-12 rounded-full bg-muted border-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        {loading ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
        ) : filteredItems.length > 0 ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredItems.map(item => (
                    <EnhancedItemCard 
                        key={item.id} 
                        item={item}
                        onEditItem={handleEditItem}
                        onDeleteItem={handleDeleteItem}
                    />
                ))}
            </div>
        ) : (
            searchTerm ? (
                <div className="text-center py-16">
                    <div className="inline-block bg-muted p-4 rounded-full mb-4">
                        <Search className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold">No items found for &quot;{searchTerm}&quot;</h2>
                    <p className="text-muted-foreground mt-2 mb-6">Try searching for something else.</p>
                </div>
            ) : (
                <EmptyMarketplace />
            )
        )}
        
        <div className="fixed bottom-20 right-4 z-20">
            <CreateItemDialog>
                <Button className="rounded-full h-14 w-14 shadow-lg" style={{backgroundColor: '#34A853'}}>
                    <Plus className="h-6 w-6" />
                </Button>
             </CreateItemDialog>
        </div>

        {/* Edit Item Dialog */}
        {editingItem && (
            <CreateItemDialog 
                postToEdit={editingItem}
                onOpenChange={setIsEditDialogOpen}
            />
        )}
    </div>
  );
}
