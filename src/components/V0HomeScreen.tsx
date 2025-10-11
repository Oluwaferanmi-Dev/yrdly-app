"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-supabase-auth";
import { usePosts } from "@/hooks/use-posts";
import { useHaptics } from "@/hooks/use-haptics";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyFeed } from "@/components/EmptyFeed";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { PostCard } from "@/components/PostCard";

interface V0HomeScreenProps {
  onViewProfile?: (user: any) => void;
}

export function V0HomeScreen({ onViewProfile }: V0HomeScreenProps) {
  const { user, profile } = useAuth();
  const { triggerHaptic } = useHaptics();
  const { posts, loading, refreshPosts, deletePost, createPost } = usePosts();



  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-20 sm:pb-24 max-w-2xl mx-auto">
      {/* Email verification banner removed - users verify during registration */}

      {/* Welcome banner removed as requested */}

      {/* Create Post Card */}
      <Card className="p-3 sm:p-4 yrdly-shadow">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || "/diverse-user-avatars.png"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
              {profile?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <CreatePostDialog createPost={createPost}>
            <Button
              variant="outline"
              className="flex-1 justify-start text-muted-foreground bg-transparent text-left px-2 sm:px-3 py-2 h-auto min-h-[36px] sm:min-h-[40px]"
            >
              <span className="truncate text-xs sm:text-sm">What&apos;s happening in your neighborhood?</span>
            </Button>
          </CreatePostDialog>
        </div>
      </Card>

      {/* Feed Posts */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            <Skeleton className="h-40 sm:h-48 w-full rounded-lg" />
            <Skeleton className="h-40 sm:h-48 w-full rounded-lg" />
            <Skeleton className="h-40 sm:h-48 w-full rounded-lg" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={deletePost} onCreatePost={createPost} />
          ))
        ) : (
          <EmptyFeed createPost={createPost} />
        )}
      </div>

    </div>
  );
}

