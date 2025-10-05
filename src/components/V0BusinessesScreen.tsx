"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Briefcase, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Plus,
  Heart,
  Share,
  MessageCircle,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import type { Business } from "@/types";
import { CreateBusinessDialog } from "@/components/CreateBusinessDialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
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
import { usePosts } from "@/hooks/use-posts";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface V0BusinessesScreenProps {
  className?: string;
}

function BusinessCard({ business }: { business: Business }) {
  const { user } = useAuth();
  const { deleteBusiness } = usePosts();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const handleDelete = async () => {
    try {
      await deleteBusiness(business.id);
      toast({
        title: "Success",
        description: "Business deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete business:", error);
      toast({
        title: "Error",
        description: "Failed to delete business. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const newLikes = isLiked
      ? [] // Since Business type doesn't have liked_by, we'll just toggle the state
      : [user.id];

    try {
      // Since Business type doesn't have liked_by field, we'll just update the local state
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: business.name,
        text: business.description || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement messaging functionality
    toast({
      title: "Message Business",
      description: `Messaging ${business.name}`,
    });
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full yrdly-shadow hover:shadow-lg transition-all">
      {/* Business Images */}
      {business.image_urls && business.image_urls.length > 0 ? (
        business.image_urls.length > 1 ? (
          <Carousel className="w-full">
            <CarouselContent>
              {business.image_urls.map((url, index) => (
                <CarouselItem key={index}>
                  <AspectRatio ratio={16 / 9}>
                    <Image
                      src={url}
                      alt={`${business.name} image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </AspectRatio>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        ) : (
          <AspectRatio ratio={16 / 9}>
            <Image
              src={business.image_urls[0]}
              alt={`${business.name} image 1`}
              fill
              className="object-cover"
            />
          </AspectRatio>
        )
      ) : (
        <AspectRatio ratio={16/9}>
          <div className="bg-muted flex items-center justify-center h-full">
            <Briefcase className="h-12 w-12 text-muted-foreground" />
          </div>
        </AspectRatio>
      )}
      
      <CardHeader className="flex-row items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-lg">{business.name}</CardTitle>
          <CardDescription>{business.category}</CardDescription>
          {/* Rating would be added to Business type in the future */}
        </div>
        {user?.id === business.owner_id && (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <CreateBusinessDialog postToEdit={business}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                </CreateBusinessDialog>
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
                  This action cannot be undone. This will permanently delete this business listing.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>

      <CardContent className="flex-grow space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{business.description}</p>
        
        {/* Contact Info */}
        <div className="space-y-2">
          {business.location?.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{business.location.address}</span>
            </div>
          )}
          {/* Phone and email would be added to Business type in the future */}
        </div>
      </CardContent>

      <CardContent className="pt-0">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : ''}`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500' : ''}`} />
              <span>{likeCount}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleMessage}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyBusinesses() {
  return (
    <div className="text-center py-16">
      <div className="inline-block bg-muted p-4 rounded-full mb-4">
        <Briefcase className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold">No businesses yet</h2>
      <p className="text-muted-foreground mt-2">Be the first to add a local business to the directory!</p>
    </div>
  );
}

export function V0BusinessesScreen({ className }: V0BusinessesScreenProps) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateBusinessDialogOpen, setIsCreateBusinessDialogOpen] = useState(false);
  const [categoryStats, setCategoryStats] = useState<Array<{
    name: string;
    count: number;
    icon: string;
    color: string;
  }>>([]);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching businesses:', error);
          return;
        }

        setBusinesses(data as Business[]);
        
        // Calculate category stats from real data
        const categoryCounts = (data || []).reduce((acc, business) => {
          acc[business.category] = (acc[business.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Map categories to display format
        const categoryMap: Record<string, { icon: string; color: string }> = {
          'Food & Dining': { icon: '🍽️', color: 'bg-primary/10' },
          'Restaurant': { icon: '🍽️', color: 'bg-primary/10' },
          'Food': { icon: '🍽️', color: 'bg-primary/10' },
          'Retail': { icon: '🛍️', color: 'bg-accent/10' },
          'Shopping': { icon: '🛍️', color: 'bg-accent/10' },
          'Health & Fitness': { icon: '💪', color: 'bg-green-100' },
          'Fitness': { icon: '💪', color: 'bg-green-100' },
          'Gym': { icon: '💪', color: 'bg-green-100' },
          'Beauty': { icon: '✂️', color: 'bg-purple-100' },
          'Salon': { icon: '✂️', color: 'bg-purple-100' },
          'Spa': { icon: '✂️', color: 'bg-purple-100' },
          'Electronics': { icon: '📱', color: 'bg-blue-100' },
          'Technology': { icon: '📱', color: 'bg-blue-100' },
          'Services': { icon: '🔧', color: 'bg-orange-100' },
          'Automotive': { icon: '🚗', color: 'bg-gray-100' },
          'Education': { icon: '📚', color: 'bg-indigo-100' },
          'Entertainment': { icon: '🎬', color: 'bg-pink-100' },
        };

        const stats = Object.entries(categoryCounts).map(([category, count]) => ({
          name: category,
          count: count as number,
          icon: categoryMap[category]?.icon || '🏢',
          color: categoryMap[category]?.color || 'bg-gray-100'
        }));

        setCategoryStats(stats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching businesses:', error);
        setLoading(false);
      }
    };

    fetchBusinesses();

    // Set up real-time subscription
    const channel = supabase
      .channel('businesses')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'businesses'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newBusiness = payload.new as Business;
          setBusinesses(prevBusinesses => [newBusiness, ...prevBusinesses]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedBusiness = payload.new as Business;
          setBusinesses(prevBusinesses => 
            prevBusinesses.map(business => 
              business.id === updatedBusiness.id ? updatedBusiness : business
            )
          );
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setBusinesses(prevBusinesses => 
            prevBusinesses.filter(business => business.id !== deletedId)
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredBusinesses = useMemo(() => {
    if (!searchQuery) return businesses;
    
    return businesses.filter(business =>
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.location?.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [businesses, searchQuery]);

  return (
    <div className={`p-4 space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Local Businesses</h2>
            <p className="text-muted-foreground">Discover and support businesses in your neighborhood</p>
          </div>
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 yrdly-shadow"
            onClick={() => setIsCreateBusinessDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your Business
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border focus:border-primary"
          />
        </div>
      </div>

      {/* Featured Business */}
      {filteredBusinesses.length > 0 && (
        <Card className="p-0 overflow-hidden yrdly-shadow-lg border-0">
          <div className="relative h-32 yrdly-gradient"></div>
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xl font-bold text-foreground">{filteredBusinesses[0].name}</h4>
                <p className="text-muted-foreground">{filteredBusinesses[0].category}</p>
              </div>
              <Badge className="bg-primary text-primary-foreground">Featured</Badge>
            </div>

            <div className="flex items-center gap-4">
              {filteredBusinesses[0].rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{filteredBusinesses[0].rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({filteredBusinesses[0].review_count || 0} reviews)
                  </span>
                </div>
              )}
              {filteredBusinesses[0].hours && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{filteredBusinesses[0].hours}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm">{filteredBusinesses[0].location.address}</span>
            </div>

            <p className="text-sm text-muted-foreground">{filteredBusinesses[0].description}</p>

            <div className="flex gap-2">
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Visit Store</Button>
              {filteredBusinesses[0].phone && (
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                  onClick={() => window.open(`tel:${filteredBusinesses[0].phone}`)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Business Categories */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Categories</h3>
        <div className="grid grid-cols-2 gap-3">
          {categoryStats.map((category) => (
            <Card key={category.name} className="p-4 yrdly-shadow hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                  <span className="text-lg">{category.icon}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{category.name}</h4>
                  <p className="text-sm text-muted-foreground">{category.count} businesses</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Nearby Businesses */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Nearby Businesses</h3>
      </div>

      {/* Businesses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBusinesses.map(business => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      ) : (
        <EmptyBusinesses />
      )}

      {/* Create Business Dialog - handled by header button */}
    </div>
  );
}
