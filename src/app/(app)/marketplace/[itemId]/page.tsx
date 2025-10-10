"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Heart, 
  Share, 
  MessageCircle, 
  MapPin, 
  Calendar,
  Shield,
  Truck,
  MoreHorizontal,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import type { Post as PostType } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Image from "next/image";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function MarketplaceItemPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [item, setItem] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const itemId = params.itemId as string;

  // Image navigation functions
  const nextImage = () => {
    if (!item?.image_urls || item.image_urls.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % item.image_urls!.length);
  };

  const prevImage = () => {
    if (!item?.image_urls || item.image_urls.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + item.image_urls!.length) % item.image_urls!.length);
  };

  useEffect(() => {
    if (!itemId) return;

    const fetchItem = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            user:users!posts_user_id_fkey(name, avatar_url, created_at)
          `)
          .eq('id', itemId)
          .eq('category', 'For Sale')
          .single();

        if (error) throw error;

        const itemWithAuthor = {
          ...data,
          author_name: data.user?.name || 'Unknown User',
          author_image: data.user?.avatar_url,
          author_created_at: data.user?.created_at,
        };

        setItem(itemWithAuthor);
        setIsLiked(data.liked_by?.includes(user?.id || '') || false);
        setLikeCount(data.liked_by?.length || 0);
      } catch (error) {
        console.error('Error fetching item:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load item details",
        });
        router.push('/marketplace');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId, user?.id, toast, router]);

  const handleLike = async () => {
    if (!user || !item) return;

    try {
      const currentLikes = item.liked_by || [];
      const isCurrentlyLiked = currentLikes.includes(user.id);
      
      let newLikes;
      if (isCurrentlyLiked) {
        newLikes = currentLikes.filter(id => id !== user.id);
      } else {
        newLikes = [...currentLikes, user.id];
      }

      const { error } = await supabase
        .from('posts')
        .update({ liked_by: newLikes })
        .eq('id', item.id);

      if (error) throw error;

      setIsLiked(!isCurrentlyLiked);
      setLikeCount(newLikes.length);
    } catch (error) {
      console.error('Error updating like:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update like",
      });
    }
  };

  const handleMessageSeller = async () => {
    if (!user || !item) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please log in to message the seller"
      });
      return;
    }
    
    if (user.id === item.user_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You cannot message yourself",
      });
      return;
    }

    try {
      // Check if item-specific conversation already exists
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id, participant_ids, item_id')
        .contains('participant_ids', [user.id])
        .eq('type', 'marketplace')
        .eq('item_id', item.id);

      if (fetchError) {
        console.error("Error fetching conversations:", fetchError);
        toast({ 
          variant: "destructive", 
          title: "Error", 
          description: "Could not open conversation." 
        });
        return;
      }
      
      let conversationId: string;

      if (!existingConversations || existingConversations.length === 0) {
        // Create new item-specific conversation
        const sortedParticipantIds = [user.id, item.user_id].sort();
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            participant_ids: sortedParticipantIds,
            type: 'marketplace',
            item_id: item.id,
            item_title: item.title || item.text || "Item",
            item_image: item.image_url || item.image_urls?.[0] || "/placeholder.svg",
            item_price: item.price || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        
        if (createError) throw createError;
        conversationId = newConv.id;
      } else {
        conversationId = existingConversations[0].id;
      }
      
      // Navigate to the conversation
      router.push(`/messages/${conversationId}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Could not open conversation." 
      });
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please log in to purchase items.",
      });
      return;
    }

    if (user.id === item?.user_id) {
      toast({
        variant: "destructive",
        title: "Cannot Buy Own Item",
        description: "You cannot purchase your own item.",
      });
      return;
    }

    // For now, show a message about contacting seller
    // In a real app, this would integrate with a payment system
    toast({
      title: "Contact Seller",
      description: `To purchase "${item?.title || item?.text || 'this item'}", please contact the seller directly.`,
    });
    
    // Optionally navigate to seller profile or open chat
    handleMessageSeller();
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${item?.title || 'Item'} - ${formatPrice(item?.price)}`,
        text: item?.text || '',
        url: `${window.location.origin}/marketplace/${itemId}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: "Item shared!" });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/marketplace/${itemId}`);
        toast({ title: "Link copied!", description: "The item link has been copied to your clipboard." });
      }
    } catch (error) {
      console.error('Error sharing item:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to share item." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Item Not Found</h1>
          <p className="text-muted-foreground mb-4">The item you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button onClick={() => router.push('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const isOwnItem = user?.id === item.user_id;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Item Details</h1>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <Image
                src={item.image_urls?.[currentImageIndex] || item.image_url || "/placeholder.svg"}
                alt={item.title || "Item image"}
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation arrows for multiple images */}
              {item.image_urls && item.image_urls.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Image counter */}
              {item.image_urls && item.image_urls.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  {currentImageIndex + 1} / {item.image_urls.length}
                </div>
              )}
            </div>
            
            {/* Thumbnail strip */}
            {item.image_urls && item.image_urls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {item.image_urls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ${
                      index === currentImageIndex ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Price and Title */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {formatPrice(item.price)}
              </h1>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {item.title || item.text}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
                  For Sale
                </Badge>
                {item.condition && (
                  <Badge variant="secondary">{item.condition}</Badge>
                )}
              </div>
            </div>

            {/* Seller Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={item.author_image || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {item.author_name?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.author_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Member since {new Date(item.user?.created_at || item.timestamp).getFullYear()}
                    </p>
                  </div>
                  {/* Rating removed - no hardcoded values */}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/profile/${item.user_id}`)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                  {!isOwnItem && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleMessageSeller}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {item.description && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            {/* Location */}
            {item.event_location?.address && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Location</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{item.event_location.address}</span>
                </div>
              </div>
            )}

            {/* Features */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Features</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span>Delivery Available</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLike}
                  className={`flex-1 ${isLiked ? 'text-red-500 border-red-500' : ''}`}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex-1"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
              
              {!isOwnItem && (
                <Button
                  onClick={handleBuyNow}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  Buy Now
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
