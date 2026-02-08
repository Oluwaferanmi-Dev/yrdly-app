"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-supabase-auth";
import { usePosts } from "@/hooks/use-posts";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyFeed } from "@/components/EmptyFeed";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { PostCard } from "@/components/PostCard";

interface HomeScreenProps {
  onViewProfile?: (user: any) => void;
}

export function HomeScreen({ onViewProfile }: HomeScreenProps) {
  const { user, profile } = useAuth();
  const { posts, loading, refreshPosts, deletePost, createPost } = usePosts();



  return (
    <div className="w-full pb-14 md:pb-16">
      {/* Create Post Card - Minimal Header Style */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <Card className="rounded-none border-0 border-b border-border shadow-none">
          <div className="flex items-center gap-2 px-3 py-2">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={profile?.avatar_url || "/diverse-user-avatars.png"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {profile?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <CreatePostDialog createPost={createPost}>
              <Button
                variant="outline"
                className="flex-1 justify-start text-muted-foreground bg-transparent text-left px-3 py-2 h-auto min-h-[32px] text-sm"
              >
                <span className="truncate">What&apos;s happening in your neighborhood?</span>
              </Button>
            </CreatePostDialog>
          </div>
        </Card>
      </div>

      {/* Feed Posts - Full Width */}
      <div className="w-full">
        {loading ? (
          <div className="w-full">
            <Skeleton className="h-[60vh] w-full rounded-none" />
            <Skeleton className="h-[60vh] w-full rounded-none" />
            <Skeleton className="h-[60vh] w-full rounded-none" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={deletePost} onCreatePost={createPost} />
          ))
        ) : (
          <div className="px-4 py-8">
            <EmptyFeed createPost={createPost} />
          </div>
        )}
      </div>

    </div>
  );
}

