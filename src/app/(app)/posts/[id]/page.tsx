import { Suspense } from 'react';
import { PostPageClient } from './PostPageClient';

// Required for static export compatibility
export async function generateStaticParams() {
  return [];
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostPageClient postId={resolvedParams.id} />
    </Suspense>
  );
}
