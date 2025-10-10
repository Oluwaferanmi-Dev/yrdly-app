
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
          .select(`
            *,
            user:users!posts_user_id_fkey(
              id,
              name,
              avatar_url,
              created_at
            )
          `)
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
        console.log('Event type:', payload.eventType);
        console.log('Payload new:', payload.new);
        console.log('Payload old:', payload.old);
        
        if (payload.eventType === 'INSERT') {
          // Add new post to the beginning of the list
          const newPost = payload.new as Post;
          console.log('Adding new post:', newPost.id);
          
          // Fetch user data for the new post
          const fetchUserData = async () => {
            try {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, name, avatar_url, created_at')
                .eq('id', newPost.user_id)
                .single();
              
              if (!userError && userData) {
                const postWithUser = {
                  ...newPost,
                  user: userData
                };
                setPosts(prevPosts => [postWithUser, ...prevPosts]);
              } else {
                // Fallback to post without user data
                setPosts(prevPosts => [newPost, ...prevPosts]);
              }
            } catch (error) {
              console.error('Error fetching user data for new post:', error);
              setPosts(prevPosts => [newPost, ...prevPosts]);
            }
          };
          
          fetchUserData();
        } else if (payload.eventType === 'UPDATE') {
          // Update existing post in the list
          const updatedPost = payload.new as Post;
          console.log('Updating post:', updatedPost.id);
          
          // Fetch user data for the updated post
          const fetchUserData = async () => {
            try {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, name, avatar_url, created_at')
                .eq('id', updatedPost.user_id)
                .single();
              
              if (!userError && userData) {
                const postWithUser = {
                  ...updatedPost,
                  user: userData
                };
                setPosts(prevPosts => 
                  prevPosts.map(post => 
                    post.id === updatedPost.id ? postWithUser : post
                  )
                );
              } else {
                // Fallback to post without user data
                setPosts(prevPosts => 
                  prevPosts.map(post => 
                    post.id === updatedPost.id ? updatedPost : post
                  )
                );
              }
            } catch (error) {
              console.error('Error fetching user data for updated post:', error);
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === updatedPost.id ? updatedPost : post
                )
              );
            }
          };
          
          fetchUserData();
        } else if (payload.eventType === 'DELETE') {
          // Remove deleted post from the list
          const deletedId = payload.old.id;
          console.log('Deleting post:', deletedId);
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
    
    // Check if files is valid and has items
    if (!files || files.length === 0) {
      console.warn('No files provided to uploadImages');
      return [];
    }
    
    const uploadedUrls = await Promise.all(
        Array.from(files).map(async (file) => {
            // Additional check for individual file
            if (!file || !file.name || !file.size || !(file instanceof File)) {
              console.warn('Invalid file in FileList:', file);
              return null;
            }
            
            try {
              const { url, error } = await StorageService.uploadPostImage(user.id, file);
              if (error) {
                  console.error('Upload error:', error);
                  return null;
              }
              return url;
            } catch (error) {
              console.error('Upload error:', error);
              return null;
            }
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
        let imageUrls: string[] = [];
        
        // For editing: preserve existing images
        if (postIdToUpdate && postData.image_urls) {
          imageUrls = [...postData.image_urls];
          console.log('Preserving existing images:', imageUrls.length);
        }
        
        // Add new images if any are uploaded
        if (imageFiles && imageFiles.length > 0) {
            console.log('Uploading new images:', imageFiles.length, 'files');
            const uploadedUrls = await uploadImages(imageFiles, postData.category === 'Event' ? 'event_images' : 'posts');
            imageUrls = [...imageUrls, ...uploadedUrls];
        } else {
            console.log('No new image files to upload');
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
            image_urls: imageUrls,
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
            console.log('Deleting post:', postId);
            
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
            
            console.log('Post deleted successfully from database:', postId);

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

  const refreshPosts = useCallback(async () => {
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
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, []);

  return { posts, loading, createPost, createBusiness, deletePost, deleteBusiness, refreshPosts };
};
