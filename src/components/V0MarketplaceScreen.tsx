"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Search, Plus, Edit, Trash2 } from "lucide-react";
import { CreateItemDialog } from "@/components/CreateItemDialog";
import { EnhancedItemCard } from "@/components/marketplace/EnhancedItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Post as PostType } from "@/types";

interface V0MarketplaceScreenProps {
  onItemClick?: (item: PostType) => void;
  onMessageSeller?: (item: PostType) => void;
}

export function V0MarketplaceScreen({ onItemClick, onMessageSeller }: V0MarketplaceScreenProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<PostType | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Handle edit item
  const handleEditItem = (item: PostType) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  // Handle delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id); // Ensure user can only delete their own items

      if (error) {
        console.error('Error deleting item:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete item. Please try again.",
        });
        return;
      }

      // Remove item from local state
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
      toast({
        title: "Item Deleted",
        description: "Your item has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete item. Please try again.",
      });
    }
  };

  // Fetch items from Supabase
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            user:users!posts_user_id_fkey(
              id,
              name,
              avatar_url
            )
          `)
          .eq('category', 'For Sale')
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('Error fetching marketplace items:', error);
          return;
        }

        console.log('Marketplace items fetched:', data);
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
        if (payload.eventType === 'INSERT') {
          const newItem = payload.new as PostType;
          setItems(prevItems => [newItem, ...prevItems]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedItem = payload.new as PostType;
          setItems(prevItems => 
            prevItems.map(item => 
              item.id === updatedItem.id ? updatedItem : item
            )
          );
        } else if (payload.eventType === 'DELETE') {
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

  // Filter items based on search term
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

  const handleEditDialogClose = () => {
    setEditingItem(null);
    setIsEditDialogOpen(false);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "FREE";
    return `₦${price.toLocaleString()}`;
  };

  const getPriceColor = (price: number) => {
    if (price === 0) return "bg-green-500 text-white";
    if (price > 20000) return "bg-accent text-accent-foreground";
    return "bg-primary text-primary-foreground";
  };

  const getButtonColor = (price: number) => {
    if (price === 0) return "bg-green-500 text-white hover:bg-green-600";
    if (price > 20000) return "bg-accent text-accent-foreground hover:bg-accent/90";
    return "bg-primary text-primary-foreground hover:bg-primary/90";
  };

  const getBorderColor = (price: number) => {
    if (price === 0) return "border-green-500 text-green-500";
    if (price > 20000) return "border-accent text-accent";
    return "border-primary text-primary";
  };

  return (
    <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">For Sale & Free</h2>
          <p className="text-sm text-muted-foreground">Buy and sell items in your neighborhood</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search For sale & free" 
            className="pl-10 bg-card border-border focus:border-primary text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 sm:h-64 w-full" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="p-0 overflow-hidden yrdly-shadow">
              <div className="relative cursor-pointer" onClick={() => onItemClick?.(item)}>
                <img
                  src={item.image_urls?.[0] || "/placeholder.svg"}
                  alt={item.title || item.text || "Item"}
                  className="w-full aspect-square object-cover"
                />
                <Badge className={`absolute top-1 left-1 sm:top-2 sm:left-2 text-xs ${getPriceColor(item.price || 0)}`}>
                  {formatPrice(item.price || 0)}
                </Badge>
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-white/80 hover:bg-white w-6 h-6 sm:w-8 sm:h-8">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
              <div className="p-2 sm:p-3 space-y-1 sm:space-y-2">
                <h4 className="font-semibold text-foreground text-xs sm:text-sm cursor-pointer line-clamp-1" onClick={() => onItemClick?.(item)}>
                  {item.title || item.text || "Untitled Item"}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.description || item.text || "No description available"}
                </p>
                <div 
                  className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    const userId = item.user?.id || item.user_id;
                    if (userId) {
                      router.push(`/profile/${userId}`);
                    }
                  }}
                >
                  <Avatar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                    <AvatarImage src={item.user?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className={`text-xs ${getPriceColor(item.price || 0)}`}>
                      {item.user?.name?.slice(0, 2).toUpperCase() || item.user_id?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">
                    {item.user?.name || "Unknown Seller"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Posted {new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-1">
                  {user && item.user_id === user.id ? (
                    // Show Edit/Delete for own items
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7 sm:h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditItem(item);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 w-7 h-7 sm:w-8 sm:h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    // Show Buy Now/Chat for others' items
                    <>
                      <Button
                        size="sm"
                        className={`flex-1 text-xs ${getButtonColor(item.price || 0)} h-7 sm:h-8`}
                        onClick={() => onItemClick?.(item)}
                      >
                        {item.price === 0 ? "Claim Free" : "Buy Now"}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className={`${getBorderColor(item.price || 0)} bg-transparent w-7 h-7 sm:w-8 sm:h-8`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMessageSeller?.(item);
                        }}
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-block bg-muted p-4 rounded-full mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">
            {searchTerm ? `No items found for "${searchTerm}"` : "The marketplace is empty"}
          </h2>
          <p className="text-muted-foreground mt-2 mb-6">
            {searchTerm ? "Try searching for something else." : "Be the first to list an item for sale in your neighborhood!"}
          </p>
        </div>
      )}

      {/* Load More */}
      {filteredItems.length > 0 && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
          >
            Load More Items
          </Button>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-20">
        <CreateItemDialog>
          <Button className="rounded-full h-14 w-14 shadow-lg yrdly-gradient">
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

