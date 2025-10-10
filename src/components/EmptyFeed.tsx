"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreatePostDialog } from "@/components/CreatePostDialog";

interface EmptyFeedProps {
  createPost?: (postData: any, postId?: string, imageFiles?: FileList) => Promise<void>;
}

export function EmptyFeed({ createPost }: EmptyFeedProps) {
    return (
        <Card className="text-center p-8 md:p-16">
            <CardContent>
                <div className="flex justify-center mb-4">
                    <span className="text-5xl" role="img" aria-label="Waving hand">👋</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome to your neighborhood!</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">This is where you&apos;ll see updates from your neighbors. Be the first to share something with your community!</p>
                <CreatePostDialog createPost={createPost || (() => Promise.resolve())}>
                   <Button>Create Your First Post</Button>
                </CreatePostDialog>
            </CardContent>
        </Card>
    )
}
