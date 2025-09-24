
import { useState, useEffect, useCallback } from 'react';
// Removed Firebase imports - now using Supabase
import { useAuth } from '@/hooks/use-supabase-auth';
import { supabase } from '@/lib/supabase';
import { StorageService } from '@/lib/storage-service';
import { Post, Business } from '@/types';
import { useToast } from './use-toast';

export const usePosts = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('Error fetching posts:', error);
          return;
        }

        setPosts(data as Post[]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setLoading(false);
      }
    };

    fetchPosts();

    // Set up real-time subscription
    const channel = supabase
      .channel('posts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'posts' 
      }, (payload) => {
        console.log('usePosts realtime change received!', payload);
        
        if (payload.eventType === 'INSERT') {
          // Add new post to the beginning of the list
          const newPost = payload.new as Post;
          setPosts(prevPosts => [newPost, ...prevPosts]);
        } else if (payload.eventType === 'UPDATE') {
          // Update existing post in the list
          const updatedPost = payload.new as Post;
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === updatedPost.id ? updatedPost : post
            )
          );
        } else if (payload.eventType === 'DELETE') {
          // Remove deleted post from the list
          const deletedId = payload.old.id;
          setPosts(prevPosts => 
            prevPosts.filter(post => post.id !== deletedId)
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const uploadImages = useCallback(async (
    files: FileList,
    path: 'posts' | 'event_images' | 'businesses' | 'avatars'
  ): Promise<string[]> => {
    if (!user) return [];
    const uploadedUrls = await Promise.all(
        Array.from(files).map(async (file) => {
            const { url, error } = await StorageService.uploadPostImage(user.id, file);
            if (error) {
                console.error('Upload error:', error);
                return null;
            }
            return url;
        })
    );
    return uploadedUrls.filter(url => url !== null) as string[];
  }, [user]);

  const createPost = useCallback(
    async (
      postData: Partial<Omit<Post, 'id'>>,
      postIdToUpdate?: string,
      imageFiles?: FileList
    ) => {
      if (!user || !profile) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
      }

      try {
        let imageUrls: string[] = postData.image_urls || [];
        if (imageFiles && imageFiles.length > 0) {
            const uploadedUrls = await uploadImages(imageFiles, postData.category === 'Event' ? 'event_images' : 'posts');
            imageUrls = postIdToUpdate ? [...imageUrls, ...uploadedUrls] : uploadedUrls;
        }

        // Clean up the data to remove undefined values and exclude imageFiles
        const cleanedPostData = Object.fromEntries(
          Object.entries(postData).filter(([key, value]) => 
            value !== undefined && key !== 'imageFiles'
          )
        );

        const finalPostData = {
          ...cleanedPostData,
          user_id: user.id,
          author_name: profile.name || 'Anonymous',
          author_image: profile.avatar_url || '',
          image_urls: imageUrls.length > 0 ? imageUrls : [],
          timestamp: postIdToUpdate ? postData.timestamp : new Date().toISOString(),
          category: postData.category || 'General', // Ensure category is always provided
        };

        if (postIdToUpdate) {
            const { error } = await supabase
              .from('posts')
              .update(finalPostData)
              .eq('id', postIdToUpdate);
            
            if (error) throw error;
            toast({ title: 'Success', description: 'Post updated successfully.' });
        } else {
            const { error } = await supabase
              .from('posts')
              .insert({
                ...finalPostData,
                comment_count: 0,
                liked_by: [],
              });
            
            if (error) throw error;
            toast({ title: 'Success', description: 'Post created successfully.' });
        }
      } catch (error) {
        console.error('Error creating/updating post:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save post.' });
      }
    },
    [user, profile, toast, uploadImages]
  );

  const createBusiness = useCallback(
    async (
      businessData: Omit<Business, 'id' | 'owner_id' | 'created_at'>,
      businessIdToUpdate?: string,
      imageFiles?: FileList
    ) => {
      if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
      }

      try {
        let imageUrls: string[] = businessData.image_urls || [];
        if (imageFiles && imageFiles.length > 0) {
            const uploadedUrls = await uploadImages(imageFiles, 'businesses');
            imageUrls = businessIdToUpdate ? [...imageUrls, ...uploadedUrls] : uploadedUrls;
        }

        const finalBusinessData = {
            ...businessData,
            owner_id: user.id,
            imageUrls,
        }

        if (businessIdToUpdate) {
            const { error } = await supabase
                .from('businesses')
                .update(finalBusinessData)
                .eq('id', businessIdToUpdate);
            
            if (error) throw error;
            toast({ title: 'Success', description: 'Business updated successfully.' });
        } else {
            const { error } = await supabase
                .from('businesses')
                .insert({
                    ...finalBusinessData,
                    created_at: new Date().toISOString(),
                });
            
            if (error) throw error;
            toast({ title: 'Success', description: 'Business added successfully.' });
        }
      } catch (error) {
        console.error('Error adding/updating business:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save business.' });
      }
    },
    [user, toast, uploadImages]
  );

  const deletePost = useCallback(
    async (postId: string) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to delete a post.' });
            return;
        }
        try {
            // First, get the post to retrieve image URLs
            const { data: postData, error: fetchError } = await supabase
                .from('posts')
                .select('image_urls')
                .eq('id', postId)
                .single();

            if (fetchError) {
                console.error('Error fetching post for deletion:', fetchError);
            }

            // Delete the post from database
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId);
            
            if (error) throw error;

            // Delete associated images from storage
            if (postData?.image_urls && postData.image_urls.length > 0) {
                const deletePromises = postData.image_urls.map(async (imageUrl: string) => {
                    try {
                        // Extract the path from the full URL
                        const url = new URL(imageUrl);
                        const pathParts = url.pathname.split('/');
                        const bucket = pathParts[2]; // post-images
                        const path = pathParts.slice(3).join('/'); // posts/userId/filename
                        
                        const { error: deleteError } = await supabase.storage
                            .from(bucket)
                            .remove([path]);
                        
                        if (deleteError) {
                            console.error('Error deleting image:', deleteError);
                        }
                    } catch (error) {
                        console.error('Error processing image deletion:', error);
                    }
                });

                await Promise.all(deletePromises);
            }

            toast({ title: 'Success', description: 'Post deleted successfully.' });
        } catch (error) {
            console.error('Error deleting post:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete post.' });
        }
    },
    [user, toast]
  );

  const deleteBusiness = useCallback(
    async (businessId: string) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to delete a business.' });
            return;
        }
        try {
            const { error } = await supabase
                .from('businesses')
                .delete()
                .eq('id', businessId);
            
            if (error) throw error;
            toast({ title: 'Success', description: 'Business deleted successfully.' });
        } catch (error) {
            console.error('Error deleting business:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete business.' });
        }
    },
    [user, toast]
  );

  return { posts, loading, createPost, createBusiness, deletePost, deleteBusiness };
};
