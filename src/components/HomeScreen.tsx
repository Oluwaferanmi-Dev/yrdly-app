"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-supabase-auth";
import { usePosts } from "@/hooks/use-posts";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyFeed } from "@/components/EmptyFeed";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { PostCard } from "@/components/PostCard";
import { Handshake, Ticket, MapPin } from "lucide-react";

interface HomeScreenProps {
  onViewProfile?: (user: unknown) => void;
}

export function HomeScreen({ onViewProfile }: HomeScreenProps) {
  const { user, profile } = useAuth();
  const { posts, loading, deletePost, createPost } = usePosts();

  return (
    <div className="w-full pb-4">
      {/* What's going on? post bar - design #1E2126 */}
      <Card
        className="rounded-[11px] border-0 overflow-hidden mb-4"
        style={{ background: "#1E2126" }}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 rounded-full flex-shrink-0">
              <AvatarImage src={profile?.avatar_url || "/diverse-user-avatars.png"} />
              <AvatarFallback className="bg-[#388E3C] text-white text-sm">
                {profile?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <CreatePostDialog createPost={createPost}>
              <Button
                variant="ghost"
                className="flex-1 justify-start text-left h-11 rounded-full font-raleway font-light text-xs text-white hover:bg-[#15181D] border border-[#388E3C] bg-[#15181D] px-4"
                style={{ border: "0.5px solid #388E3C" }}
              >
                What&apos;s going on?
              </Button>
            </CreatePostDialog>
          </div>

          <div className="my-3 border-t border-white/20" style={{ borderWidth: "0.2px" }} />

          <div className="flex flex-wrap items-center gap-2">
            <CreatePostDialog createPost={createPost}>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-[20.5px] font-raleway font-semibold text-xs text-white hover:bg-white/10 gap-2"
              >
                <Handshake className="w-4 h-4" />
                Sell
              </Button>
            </CreatePostDialog>
            <CreateEventDialog>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-[20.5px] font-raleway font-semibold text-xs text-white hover:bg-white/10 gap-2"
              >
                <Ticket className="w-4 h-4" />
                Event
              </Button>
            </CreateEventDialog>
            <CreatePostDialog createPost={createPost}>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-[20.5px] font-raleway font-semibold text-xs text-white hover:bg-white/10 gap-2"
              >
                <MapPin className="w-4 h-4" />
                Location
              </Button>
            </CreatePostDialog>
          </div>
        </div>
      </Card>

      {/* Feed */}
      <div className="w-full">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[40vh] w-full rounded-[11px]" style={{ background: "#1E2126" }} />
            <Skeleton className="h-[40vh] w-full rounded-[11px]" style={{ background: "#1E2126" }} />
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={deletePost}
                onCreatePost={createPost}
              />
            ))}
          </div>
        ) : (
          <div className="py-8">
            <EmptyFeed createPost={createPost} />
          </div>
        )}
      </div>
    </div>
  );
}
