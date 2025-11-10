
"use client";

import type { User, Post } from "@/types";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MapPin, Briefcase, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "./ui/skeleton";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CreatePostDialog } from "./CreatePostDialog";
import { CreateEventDialog } from "./CreateEventDialog";
import { useToast } from "@/hooks/use-toast";
import { CommentSection } from "./CommentSection";
import { timeAgo, formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ImageSwiper } from "./ImageSwiper";


interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
  onCreatePost?: (postData: any, postId?: string, imageFiles?: FileList) => Promise<void>;
}

export function PostCard({ post, onDelete, onCreatePost }: PostCardProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [author, setAuthor] = useState<User | null>(null);
  const [loadingAuthor, setLoadingAuthor] = useState(true);
  const [likes, setLikes] = useState(post.liked_by?.length || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isImageSwiperOpen, setIsImageSwiperOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isEventEditDialogOpen, setIsEventEditDialogOpen] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  useEffect(() => {
    const fetchAuthorData = async () => {
      if (!post.user_id) {
        setLoadingAuthor(false);
        setAuthor({ 
          id: 'unknown',
          uid: 'unknown',
          name: 'Anonymous User', 
          avatar_url: 'https://placehold.co/100x100.png',
          timestamp: post.timestamp
        });
        return;
      }

      try {
        setLoadingAuthor(true);
        
        // First try to use the user data from the post if available (for performance)
        if (post.user) {
          setAuthor({ 
            id: post.user_id,
            uid: post.user_id,
            name: post.user.name || post.author_name || 'Anonymous User', 
            avatar_url: post.user.avatar_url || post.author_image || 'https://placehold.co/100x100.png',
            timestamp: post.user.created_at || post.timestamp
          });
          setLoadingAuthor(false);
        } else {
          // Fallback: fetch fresh user data from database
          const { data: userData, error } = await supabase
            .from('users')
            .select('id, name, avatar_url, created_at')
            .eq('id', post.user_id)
            .single();

          if (error) {
            // Use cached data as fallback
            setAuthor({ 
              id: post.user_id,
              uid: post.user_id,
              name: post.author_name || 'Anonymous User', 
              avatar_url: post.author_image || 'https://placehold.co/100x100.png',
              timestamp: post.timestamp
            });
          } else {
            setAuthor({ 
              id: userData.id,
              uid: userData.id,
              name: userData.name || 'Anonymous User', 
              avatar_url: userData.avatar_url || 'https://placehold.co/100x100.png',
              timestamp: userData.created_at || post.timestamp
            });
          }
          setLoadingAuthor(false);
        }
      } catch (error) {
        // Use cached data as fallback
        setAuthor({ 
          id: post.user_id,
          uid: post.user_id,
          name: post.author_name || 'Anonymous User', 
          avatar_url: post.author_image || 'https://placehold.co/100x100.png',
          timestamp: post.timestamp
        });
        setLoadingAuthor(false);
      }
    };

    fetchAuthorData();
  }, [post.user_id, post.user, post.timestamp, post.author_image, post.author_name]);

  useEffect(() => {
    if (!post.id) return;
    
    // Set initial values from post data
    setLikes(post.liked_by?.length || 0);
    setCommentCount(post.comment_count || 0);
    if (currentUser && post.liked_by) {
      setIsLiked(post.liked_by.includes(currentUser.id));
    }

    // Set up real-time subscription for this post
    const channel = supabase
      .channel(`post-${post.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${post.id}`,
        },
        (payload) => {
          if (payload.new) {
            const postData = payload.new as any;
            setLikes(postData.liked_by?.length || 0);
            setCommentCount(postData.comment_count || 0);
            if (currentUser && postData.liked_by) {
              setIsLiked(postData.liked_by.includes(currentUser.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, post.liked_by, post.comment_count, currentUser]);


  const handleLike = async () => {
    if (!currentUser || !post.id) return;
    
    try {
      // Get current post data
      const { data: postData, error: fetchError } = await supabase
        .from('posts')
        .select('liked_by')
        .eq('id', post.id)
        .single();

      if (fetchError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to like post. Please try again.",
        });
        return;
      }

      const currentLikedBy = postData.liked_by || [];
      const userHasLiked = currentLikedBy.includes(currentUser.id);

      let newLikedBy;
      if (userHasLiked) {
        // Remove user from liked_by array
        newLikedBy = currentLikedBy.filter((id: string) => id !== currentUser.id);
      } else {
        // Add user to liked_by array
        newLikedBy = [...currentLikedBy, currentUser.id];
      }

      // Update the post
      const { error: updateError } = await supabase
        .from('posts')
        .update({ liked_by: newLikedBy })
        .eq('id', post.id);

      if (updateError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to like post. Please try again.",
        });
      } else {
        // Update local state immediately for better UX
        setLikes(newLikedBy.length);
        setIsLiked(!userHasLiked);
        
        // Trigger notification if user just liked the post
        if (!userHasLiked) {
          try {
            const { NotificationTriggers } = await import('@/lib/notification-triggers');
            await NotificationTriggers.onPostLiked(post.id, currentUser.id);
          } catch (error) {
            // Error creating post like notification
          }
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to like post. Please try again.",
      });
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageSwiperOpen(true);
  };

  const handleDelete = async () => {
    if (!currentUser || !post.id || currentUser.id !== post.user_id) return;
    
    try {
      // Delete the post from the database
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete post. Please try again.",
        });
        return;
      }

      // Also delete associated comments
      await supabase
        .from('comments')
        .delete()
        .eq('post_id', post.id);

      toast({ title: "Post deleted successfully" });
      
      // Call the onDelete callback if provided
      if (onDelete) {
        await onDelete(post.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete post. Please try again.",
      });
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Event":
        return <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800">{category}</Badge>;
      case "For Sale":
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">{category}</Badge>;
      case "Business":
         return <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800 flex items-center gap-1"><Briefcase className="h-3 w-3"/>{category}</Badge>;
      case "General":
      default:
        return <Badge variant="secondary">{category}</Badge>;
    }
  }

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    const shareData = {
      title: `Post by ${author?.name || 'a user'} on Yrdly`,
      text: post.text,
      url: postUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: "Post shared!" });
      } catch {
        // Don't show an error toast if the user cancels the share dialog
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        toast({ title: "Link copied!", description: "The post link has been copied to your clipboard." });
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not copy link to clipboard." });
      }
    }
  };
  
    const handleMessageSeller = async () => {
        if (!currentUser || !author || currentUser.id === author.id) return;

        const sortedParticipantIds = [currentUser.id, author.id].sort();
        
        try {
            // For marketplace posts, create item-specific conversations
            if (post.category === "For Sale") {
                // Check if item-specific conversation already exists
                const { data: existingConversations, error: fetchError } = await supabase
                    .from('conversations')
                    .select('id, participant_ids, item_id')
                    .contains('participant_ids', [currentUser.id])
                    .eq('type', 'marketplace')
                    .eq('item_id', post.id);

                if (fetchError) {
                    toast({ variant: "destructive", title: "Error", description: "Could not open conversation." });
                    return;
                }

                let conversationId: string;

                if (existingConversations && existingConversations.length > 0) {
                    conversationId = existingConversations[0].id;
                } else {
                    // Create new item-specific conversation
                    const { data: newConversation, error: createError } = await supabase
                        .from('conversations')
                        .insert({
                            participant_ids: sortedParticipantIds,
                            type: 'marketplace',
                            item_id: post.id,
                            item_title: post.title || post.text || "Item",
                            item_image: post.image_url || post.image_urls?.[0] || "/placeholder.svg",
                            item_price: post.price || 0,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                        .select('id')
                        .single();

                    if (createError) {
                        toast({ variant: "destructive", title: "Error", description: "Could not create conversation." });
                        return;
                    }

                    conversationId = newConversation.id;
                }
                
                router.push(`/messages/${conversationId}`);
            } else {
                // For non-marketplace posts, create general friend conversation
                const { data: allConversations, error: fetchError } = await supabase
                    .from('conversations')
                    .select('id, participant_ids')
                    .contains('participant_ids', [currentUser.id]);

                if (fetchError) {
                    toast({ variant: "destructive", title: "Error", description: "Could not open conversation." });
                    return;
                }

                // Filter for conversation with the specific friend
                const existingConversations = allConversations?.filter(conv => 
                    conv.participant_ids.includes(currentUser.id) && 
                    conv.participant_ids.includes(author.id) &&
                    conv.participant_ids.length === 2
                );

                let conversationId: string;

                if (existingConversations && existingConversations.length > 0) {
                    conversationId = existingConversations[0].id;
                } else {
                    // Create new conversation
                    const { data: newConversation, error: createError } = await supabase
                        .from('conversations')
                        .insert({
                            participant_ids: sortedParticipantIds,
                            created_at: new Date().toISOString(),
                        })
                        .select('id')
                        .single();

                    if (createError) {
                        toast({ variant: "destructive", title: "Error", description: "Could not create conversation." });
                        return;
                    }

                    conversationId = newConversation.id;
                }
                
                router.push(`/messages/${conversationId}`);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not open conversation." });
        }
    };

  const openProfile = () => {
    if (author && author.id !== currentUser?.id) {
        router.push(`/profile/${author.id}`);
    }
  };

  const renderMarketplaceContent = () => (
    <CardContent className="p-4 pt-2">
        <h2 className="text-3xl font-bold text-primary dark:text-primary">{formatPrice(post.price)}</h2>
        <h3 className="text-xl font-semibold mt-2 text-foreground">{post.text}</h3>
        
        <div className="mt-6">
            <h4 className="font-semibold text-md mb-2">Description</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">{post.description || "No description provided."}</p>
        </div>
        
        <div className="mt-6 border-t pt-4">
            <h4 className="font-semibold text-md mb-2">Seller Information</h4>
            <button onClick={openProfile} className="flex items-center gap-3 hover:bg-muted p-2 rounded-lg w-full text-left">
                <Avatar>
                    <AvatarImage src={author?.avatar_url} alt={author?.name} />
                    <AvatarFallback>{author?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{author?.name}</p>
                    <p className="text-xs text-muted-foreground">Joined {timeAgo(author?.timestamp ? new Date(author.timestamp) : null)}</p>
                </div>
            </button>
        </div>

        {currentUser?.id !== post.user_id && (
            <Button className="w-full mt-4" onClick={handleMessageSeller}>
                <MessageCircle className="mr-2 h-4 w-4" /> Message Seller
            </Button>
        )}

    </CardContent>
  );

  const renderDefaultContent = () => (
     <CardContent className="p-4 pt-0">
        <p className="whitespace-pre-wrap">{post.text}</p>
        {post.event_location && (
            <div className="flex items-center text-sm text-muted-foreground mt-2">
                <MapPin className="h-4 w-4 mr-1"/>
                <span>{post.event_location.address}</span>
            </div>
        )}
    </CardContent>
  );

  const handleEventEdit = () => {
    setIsEventEditDialogOpen(true);
  };

  const handleEventEditDialogClose = (open: boolean) => {
    setIsEventEditDialogOpen(open);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a, [role="dialog"], [role="menu"]')) {
        return;
    }
    // also don't navigate if text is selected
    if (window.getSelection()?.toString()) {
        return;
    }

    if (!isCommentsOpen) {
      router.push(`/posts/${post.id}`);
    }
  };

  return (
    <>
    <div className="w-full bg-background border-b border-border">
       <div onClick={handleCardClick} className="cursor-pointer">
      {/* Minimal Header */}
      <div className="flex flex-row items-center gap-2 px-3 py-2">
        {loadingAuthor ? (
            <div className="flex items-center gap-2 w-full">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-3 w-[120px]" />
                </div>
            </div>
        ) : author ? (
            <>
                <button onClick={openProfile} className="cursor-pointer">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={author.avatar_url} alt={author.name} data-ai-hint="person portrait" />
                        <AvatarFallback className="text-xs">{author.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </button>
                <div className="flex-1 min-w-0">
                    <button onClick={openProfile} className="cursor-pointer">
                        <p className="font-semibold text-sm hover:underline truncate">{author.name}</p>
                    </button>
                </div>
                <div className="flex-shrink-0 self-center">
                    {getCategoryBadge(post.category)}
                </div>
                {currentUser?.id === post.user_id && (
                     <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                 <CreateEventDialog 
                                    postToEdit={post}
                                    open={isEventEditDialogOpen}
                                    onOpenChange={handleEventEditDialogClose}
                                 >
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Edit</span>
                                    </DropdownMenuItem>
                                </CreateEventDialog>
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
                                This action cannot be undone. This will permanently delete your post and all its comments.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </>
        ) : null}
      </div>

        {/* Full-width Media */}
        {post.image_urls && post.image_urls.length > 0 && (
            <div className="w-full">
              {post.image_urls.length === 1 ? (
                <div 
                  className="relative w-full cursor-pointer"
                  onClick={() => handleImageClick(0)}
                >
                  <Image
                    src={post.image_urls[0]}
                    alt="Post image"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                    style={{ aspectRatio: 'auto' }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-0.5">
                  {post.image_urls.slice(0, 4).map((imageUrl, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square cursor-pointer"
                      onClick={() => handleImageClick(index)}
                    >
                      <Image
                        src={imageUrl}
                        alt={`Post image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {index === 3 && post.image_urls && post.image_urls.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">+{post.image_urls.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
        )}
        
        {/* Compact Interaction Row */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={handleLike}>
                <Heart className={`h-6 w-6 ${isLiked ? "text-red-500 fill-current" : ""}`} />
              </Button>
              {likes > 0 && <span className="text-sm font-semibold text-foreground">{likes}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={() => setIsCommentsOpen(true)}>
                <MessageCircle className="h-6 w-6" />
              </Button>
              {commentCount > 0 && <span className="text-sm font-semibold text-foreground">{commentCount}</span>}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={handleShare}>
              <Share2 className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Caption Section */}
        <div className="px-3 pb-3">
          {post.category === 'For Sale' ? (
            <div className="space-y-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-semibold text-sm">{author?.name}</span>
                {(() => {
                  const text = post.text || '';
                  const maxLength = 150;
                  const shouldTruncate = text.length > maxLength;
                  const displayText = isTextExpanded || !shouldTruncate ? text : text.slice(0, maxLength) + '...';
                  
                  return (
                    <>
                      <span className="text-sm">{displayText}</span>
                      {shouldTruncate && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsTextExpanded(!isTextExpanded);
                          }}
                          className="text-sm text-muted-foreground hover:text-foreground font-medium"
                        >
                          {isTextExpanded ? 'see less' : 'see more'}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
              {post.price && (
                <p className="text-sm font-semibold text-primary">{formatPrice(post.price)}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-semibold text-sm">{author?.name}</span>
                {(() => {
                  const text = post.text || '';
                  const maxLength = 150;
                  const shouldTruncate = text.length > maxLength;
                  const displayText = isTextExpanded || !shouldTruncate ? text : text.slice(0, maxLength) + '...';
                  
                  return (
                    <>
                      <span className="text-sm whitespace-pre-wrap">{displayText}</span>
                      {shouldTruncate && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsTextExpanded(!isTextExpanded);
                          }}
                          className="text-sm text-muted-foreground hover:text-foreground font-medium"
                        >
                          {isTextExpanded ? 'see less' : 'see more'}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
              {post.event_location && (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3 mr-1"/>
                  <span>{post.event_location.address}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{timeAgo(post.timestamp ? new Date(post.timestamp) : null)}</p>
            </div>
          )}
        </div>

      {/* Instagram-style Comment Modal */}
      <Sheet open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <SheetContent side="bottom" className="p-0 flex flex-col h-[90vh] max-h-screen rounded-t-2xl">
          <SheetHeader className="p-4 border-b flex-shrink-0">
            <SheetTitle className="text-center">Comments</SheetTitle>
          </SheetHeader>
          <CommentSection 
            postId={post.id}
            post={post}
            author={author}
            onCommentCountChange={setCommentCount}
            onClose={() => setIsCommentsOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
    </div>
    
    {/* Image Swiper Modal */}
    {post.image_urls && post.image_urls.length > 0 && (
      <ImageSwiper
        images={post.image_urls}
        isOpen={isImageSwiperOpen}
        onClose={() => setIsImageSwiperOpen(false)}
        initialIndex={selectedImageIndex}
      />
    )}
    </>
  );
}
