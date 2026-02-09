"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Edit,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { usePosts } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { CommentSection } from "@/components/CommentSection";
import { timeAgo } from "@/lib/utils";
import type { Post, User } from "@/types";
import { cn } from "@/lib/utils";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

interface PostDetailViewProps {
  post: Post;
  onCommentCountChange?: (count: number) => void;
}

export function PostDetailView({ post, onCommentCountChange }: PostDetailViewProps) {
  const router = useRouter();
  const { user: currentUser, profile: userDetails } = useAuth();
  const { toast } = useToast();
  const [author, setAuthor] = useState<User | null>(null);
  const [loadingAuthor, setLoadingAuthor] = useState(true);
  const [likes, setLikes] = useState(post.liked_by?.length || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isEventEditDialogOpen, setIsEventEditDialogOpen] = useState(false);
  const [isPostEditDialogOpen, setIsPostEditDialogOpen] = useState(false);
  const { createPost } = usePosts();

  useEffect(() => {
    const fetchAuthor = async () => {
      if (!post.user_id) {
        setAuthor({
          id: "unknown",
          uid: "unknown",
          name: post.author_name || "Anonymous",
          avatar_url: post.author_image || "https://placehold.co/100x100.png",
          timestamp: post.timestamp,
        });
        setLoadingAuthor(false);
        return;
      }
      if (post.user) {
        setAuthor({
          id: post.user_id,
          uid: post.user_id,
          name: post.user.name || post.author_name || "Anonymous",
          avatar_url: post.user.avatar_url || post.author_image || "https://placehold.co/100x100.png",
          timestamp: post.timestamp,
        });
        setLoadingAuthor(false);
        return;
      }
      const { data } = await supabase.from("users").select("id, name, avatar_url, created_at").eq("id", post.user_id).single();
      if (data) {
        setAuthor({
          id: data.id,
          uid: data.id,
          name: data.name || post.author_name || "Anonymous",
          avatar_url: data.avatar_url || post.author_image || "https://placehold.co/100x100.png",
          timestamp: data.created_at || post.timestamp,
        });
      } else {
        setAuthor({
          id: post.user_id,
          uid: post.user_id,
          name: post.author_name || "Anonymous",
          avatar_url: post.author_image || "https://placehold.co/100x100.png",
          timestamp: post.timestamp,
        });
      }
      setLoadingAuthor(false);
    };
    fetchAuthor();
  }, [post.user_id, post.user, post.author_name, post.author_image, post.timestamp]);

  useEffect(() => {
    setLikes(post.liked_by?.length || 0);
    setCommentCount(post.comment_count || 0);
    if (currentUser && post.liked_by) setIsLiked(post.liked_by.includes(currentUser.id));
    const ch = supabase
      .channel(`post-detail-${post.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts", filter: `id=eq.${post.id}` }, (payload: any) => {
        if (payload.new) {
          const p = payload.new;
          setLikes(p.liked_by?.length || 0);
          setCommentCount(p.comment_count || 0);
          if (currentUser && p.liked_by) setIsLiked(p.liked_by.includes(currentUser.id));
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [post.id, post.liked_by, post.comment_count, currentUser]);

  const handleBack = () => {
    if (post.category === "Event") router.push("/events");
    else if (post.category === "For Sale") router.push("/marketplace");
    else router.push("/home");
  };

  const handleLike = useCallback(async () => {
    if (!currentUser || !post.id) return;
    const { data } = await supabase.from("posts").select("liked_by").eq("id", post.id).single();
    if (!data) return;
    const current = (data.liked_by || []) as string[];
    const hasLiked = current.includes(currentUser.id);
    const next = hasLiked ? current.filter((id) => id !== currentUser.id) : [...current, currentUser.id];
    await supabase.from("posts").update({ liked_by: next }).eq("id", post.id);
    setLikes(next.length);
    setIsLiked(!hasLiked);
  }, [currentUser, post.id]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Post on Yrdly", url });
        toast({ title: "Post shared!" });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!" });
    }
  }, [post.id, toast]);

  const handleDelete = useCallback(async () => {
    if (!currentUser || currentUser.id !== post.user_id) return;
    await supabase.from("posts").delete().eq("id", post.id);
    await supabase.from("comments").delete().eq("post_id", post.id);
    toast({ title: "Post deleted" });
    router.push("/home");
  }, [currentUser, post.id, post.user_id, router, toast]);

  const handleCommentCountChange = useCallback(
    (count: number) => {
      setCommentCount(count);
      onCommentCountChange?.(count);
    },
    [onCommentCountChange]
  );

  const urls = post.image_urls?.length ? post.image_urls : post.image_url ? [post.image_url] : [];
  const hasThreeOrMore = urls.length >= 3;

  return (
    <div
      className={cn(
        "w-full max-w-[626px] mx-auto rounded-[11px] overflow-hidden",
        "bg-[#1E2126] text-white"
      )}
    >
      {/* Top bar: back + "Post" */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-white/10"
        style={{ background: "rgba(185,185,185,0.05)" }}
      >
        <button onClick={handleBack} className="p-1 -ml-1 rounded hover:bg-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-normal text-sm leading-tight" style={{ fontFamily: '"Pacifico", cursive' }}>
          Post
        </span>
      </div>

      {/* Post header: avatar, name, time, tag */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          {loadingAuthor ? (
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
          ) : (
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={author?.avatar_url} />
              <AvatarFallback className="bg-[#388E3C] text-white text-sm">{author?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <p className="font-raleway font-bold text-sm text-white truncate">{author?.name || "Anonymous"}</p>
            <p className="font-raleway font-normal text-[11px] text-white/80">
              {timeAgo(post.timestamp ? new Date(post.timestamp) : null)}
            </p>
          </div>
        </div>
        <span
          className="flex-shrink-0 px-3 py-1 rounded-[12.5px] font-raleway font-medium text-xs text-white"
          style={{ background: "#1E293B" }}
        >
          {post.category}
        </span>
      </div>

      {/* Post body text */}
      <div className="px-4 pb-3">
        <p className="font-raleway font-normal text-[13px] leading-[15px] text-white whitespace-pre-wrap">
          {post.text || ""}
        </p>
      </div>

      {/* Image collage: 1 large left + 2 right, or single/full grid */}
      {urls.length > 0 && (
        <div className="px-3 pb-4">
          {urls.length >= 3 ? (
            <div className="grid grid-cols-2 gap-1 rounded-[15px] overflow-hidden">
              <div className="row-span-2 relative aspect-[276/311] min-h-[180px] bg-[#D9D9D9]">
                <Image src={urls[0]} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 276px" />
              </div>
              <div className="relative aspect-[276/150] bg-[#D9D9D9]">
                <Image src={urls[1]} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 276px" />
              </div>
              <div className="relative aspect-[276/150] bg-[#D9D9D9]">
                <Image src={urls[2]} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 276px" />
              </div>
            </div>
          ) : urls.length === 2 ? (
            <div className="grid grid-cols-2 gap-1 rounded-[15px] overflow-hidden">
              <div className="relative aspect-square bg-[#D9D9D9]">
                <Image src={urls[0]} alt="" fill className="object-cover" sizes="50vw" />
              </div>
              <div className="relative aspect-square bg-[#D9D9D9]">
                <Image src={urls[1]} alt="" fill className="object-cover" sizes="50vw" />
              </div>
            </div>
          ) : (
            <div className="relative w-full aspect-[4/3] rounded-[15px] overflow-hidden bg-[#D9D9D9]">
              <Image src={urls[0]} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 626px" />
            </div>
          )}
        </div>
      )}

      {/* Engagement row */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleLike}
              className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#D9D9D9]/20 hover:bg-white/10"
            >
              <Heart className={cn("w-5 h-5", isLiked && "fill-[#ED1111] text-[#ED1111]")} />
            </button>
            <span className="font-raleway font-light italic text-xs text-white">{formatCount(likes)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="font-raleway font-light text-xs text-white">{formatCount(commentCount)}</span>
          </div>
          <button onClick={handleShare} className="p-1 rounded hover:bg-white/10">
            <Share2 className="w-6 h-6" />
          </button>
        </div>
        {currentUser?.id === post.user_id && (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-white/10">
                  <MoreHorizontal className="w-6 h-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1E2126] border-white/10">
                {post.category === "Event" ? (
                  <CreateEventDialog
                    postToEdit={post}
                    open={isEventEditDialogOpen}
                    onOpenChange={setIsEventEditDialogOpen}
                  >
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-white focus:bg-white/10">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  </CreateEventDialog>
                ) : (
                  <CreatePostDialog
                    postToEdit={post}
                    createPost={createPost}
                    open={isPostEditDialogOpen}
                    onOpenChange={setIsPostEditDialogOpen}
                  >
                    <DropdownMenuItem
                      onSelect={() => setIsPostEditDialogOpen(true)}
                      className="text-white focus:bg-white/10"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  </CreatePostDialog>
                )}
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent className="bg-[#1E2126] border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your post and all comments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/10 text-white border-0">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Comment input + CommentSection (inline, dark) */}
      <div className="border-t border-white/10">
        <CommentSection
          postId={post.id}
          post={post}
          author={author}
          onCommentCountChange={handleCommentCountChange}
          variant="inline"
          hidePostPreview
        />
      </div>
    </div>
  );
}
