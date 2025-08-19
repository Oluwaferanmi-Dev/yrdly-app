
"use client";

import type { User, Post } from "@/types";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, MapPin, Briefcase, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { doc, arrayUnion, arrayRemove, onSnapshot, getDoc, deleteDoc, runTransaction, collection, query, where, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CreatePostDialog } from "./CreatePostDialog";
import { useToast } from "@/hooks/use-toast";
import { CommentSection } from "./CommentSection";
import { timeAgo, formatPrice } from "@/lib/utils";
import { UserProfileDialog } from "./UserProfileDialog";
import { useRouter } from "next/navigation";


interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [author, setAuthor] = useState<User | null>(null);
  const [loadingAuthor, setLoadingAuthor] = useState(true);
  const [likes, setLikes] = useState(post.likedBy?.length || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchAuthor = async () => {
      setLoadingAuthor(true);
      if (post.userId) {
        try {
          const userDocRef = doc(db, "users", post.userId);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
              setAuthor({ id: userDocSnap.id, ...userDocSnap.data() } as User);
          } else {
              setAuthor({ 
                  id: post.userId, 
                  uid: post.userId,
                  name: post.authorName || 'Deleted User', 
                  avatarUrl: post.authorImage || 'https://placehold.co/100x100.png'
              });
          }
        } catch (error) {
          console.error("Error fetching author:", error);
          setAuthor(null);
        } finally {
          setLoadingAuthor(false);
        }
      } else {
         setAuthor({ 
            id: 'unknown',
            uid: 'unknown',
            name: post.authorName || 'Anonymous User', 
            avatarUrl: post.authorImage || 'https://placehold.co/100x100.png'
        });
        setLoadingAuthor(false);
      }
    };

    fetchAuthor();
  }, [post.userId, post.authorName, post.authorImage]);

  useEffect(() => {
    if (!post.id) return;
    const postRef = doc(db, "posts", post.id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
        if(docSnap.exists()) {
            const postData = docSnap.data();
            setLikes(postData.likedBy?.length || 0);
            setCommentCount(postData.commentCount || 0);
            if (currentUser && postData.likedBy) {
              setIsLiked(postData.likedBy.includes(currentUser.uid));
            }
        }
    });

    return () => unsubscribe();
  }, [post.id, currentUser]);

  const handleLike = async () => {
    if (!currentUser || !post.id) return;
    const postRef = doc(db, "posts", post.id);

    await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
            throw "Document does not exist!";
        }

        const postData = postDoc.data();
        const currentLikedBy = postData.likedBy || [];
        const userHasLiked = currentLikedBy.includes(currentUser.uid);

        if (userHasLiked) {
            transaction.update(postRef, { likedBy: arrayRemove(currentUser.uid) });
        } else {
            transaction.update(postRef, { likedBy: arrayUnion(currentUser.uid) });
        }
    });
  };

  const handleDelete = async () => {
    if (!currentUser || !post.id || currentUser.uid !== post.userId) return;
    try {
        await deleteDoc(doc(db, "posts", post.id));
        toast({ title: "Post deleted", description: "Your post has been successfully removed." });
    } catch (error) {
        console.error("Error deleting post:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to delete post." });
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Event":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">{category}</Badge>;
      case "For Sale":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">{category}</Badge>;
      case "Business":
         return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1"><Briefcase className="h-3 w-3"/>{category}</Badge>;
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
        if (!currentUser || !author || currentUser.uid === author.uid) return;

        const sortedParticipantIds = [currentUser.uid, author.uid].sort();
        
        const q = query(
            collection(db, "conversations"),
            where("participantIds", "==", sortedParticipantIds)
        );

        try {
            const querySnapshot = await getDocs(q);
            let conversationId: string;

            if (querySnapshot.empty) {
                const newConvRef = await addDoc(collection(db, "conversations"), {
                    participantIds: sortedParticipantIds,
                    lastMessage: null,
                    timestamp: serverTimestamp(),
                });
                conversationId = newConvRef.id;
            } else {
                conversationId = querySnapshot.docs[0].id;
            }
            
            router.push(`/messages/${conversationId}`);
        } catch (error) {
            console.error("Error handling message action:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not open conversation." });
        }
    };

  const openProfile = () => {
    if (author && author.uid !== currentUser?.uid) {
        setSelectedUser(author);
    }
  };

  const renderMarketplaceContent = () => (
    <CardContent className="p-4 pt-2">
        <h2 className="text-3xl font-bold">{formatPrice(post.price)}</h2>
        <h3 className="text-xl font-semibold mt-2">{post.text}</h3>
        
        <div className="mt-6">
            <h4 className="font-semibold text-md mb-2">Description</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">{post.description || "No description provided."}</p>
        </div>
        
        <div className="mt-6 border-t pt-4">
            <h4 className="font-semibold text-md mb-2">Seller Information</h4>
            <button onClick={openProfile} className="flex items-center gap-3 hover:bg-muted p-2 rounded-lg w-full text-left">
                <Avatar>
                    <AvatarImage src={author?.avatarUrl} alt={author?.name} />
                    <AvatarFallback>{author?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{author?.name}</p>
                    <p className="text-xs text-muted-foreground">Joined {timeAgo(author?.timestamp?.toDate())}</p>
                </div>
            </button>
        </div>

        {currentUser?.uid !== post.userId && (
            <Button className="w-full mt-4" onClick={handleMessageSeller}>
                <MessageCircle className="mr-2 h-4 w-4" /> Message Seller
            </Button>
        )}

    </CardContent>
  );

  const renderDefaultContent = () => (
     <CardContent className="p-4 pt-0">
        <p className="whitespace-pre-wrap">{post.text}</p>
        {post.eventLocation && (
            <div className="flex items-center text-sm text-muted-foreground mt-2">
                <MapPin className="h-4 w-4 mr-1"/>
                <span>{post.eventLocation.address}</span>
            </div>
        )}
    </CardContent>
  );

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
    <Card className="overflow-hidden">
       <div onClick={handleCardClick} className="cursor-pointer">
      {selectedUser && (
          <UserProfileDialog 
              user={selectedUser} 
              open={!!selectedUser} 
              onOpenChange={(wasChanged) => {
                  if (wasChanged) {
                    // Logic to refetch or update state if a change (like block/unfriend) happened
                  }
                  setSelectedUser(null)
              }} 
          />
      )}
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        {loadingAuthor ? (
            <div className="flex items-center gap-4 w-full">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                </div>
            </div>
        ) : author ? (
            <>
                <button onClick={openProfile} className="cursor-pointer">
                    <Avatar>
                        <AvatarImage src={author.avatarUrl} alt={author.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{author.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </button>
                <div className="flex-1">
                    <button onClick={openProfile} className="cursor-pointer">
                        <p className="font-semibold hover:underline">{author.name}</p>
                    </button>
                    <p className="text-xs text-muted-foreground">{timeAgo(post.timestamp?.toDate())}</p>
                </div>
                {getCategoryBadge(post.category)}
            </>
        ) : null}
        {currentUser?.uid === post.userId && (
             <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <CreatePostDialog postToEdit={post}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                        </CreatePostDialog>
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
      </CardHeader>

      <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        {post.imageUrls && post.imageUrls.length > 0 && (
            <div className="relative w-full aspect-video">
            <Image
                src={post.imageUrls[0]}
                alt="Post image"
                fill
                className="object-cover"
                data-ai-hint="neighborhood street"
            />
            </div>
        )}
        
        {post.category === 'For Sale' ? renderMarketplaceContent() : renderDefaultContent()}

        <CardFooter className="p-2 bg-background/50">
            <div className="flex justify-around w-full">
            <Button variant="ghost" className="flex-1 gap-2" onClick={handleLike}>
                <Heart className={`h-5 w-5 ${isLiked ? "text-red-500 fill-current" : ""}`} />
                <span className="text-sm">{likes}</span>
            </Button>
             <CollapsibleTrigger asChild>
                 <Button variant="ghost" className="flex-1 gap-2">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm">{commentCount}</span>
                </Button>
             </CollapsibleTrigger>
            <Button variant="ghost" className="flex-1 gap-2" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
                <span className="text-sm">Share</span>
            </Button>
            </div>
        </CardFooter>
        <CollapsibleContent>
            <div className="p-4 pt-0">
                <CommentSection postId={post.id} />
            </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
    </Card>
  );
}
