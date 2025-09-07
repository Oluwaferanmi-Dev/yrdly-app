
import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Post, Business } from '@/types';
import { useToast } from './use-toast';

export const usePosts = () => {
  const { user, userDetails } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const uploadImages = useCallback(async (
    files: FileList,
    path: 'posts' | 'event_images' | 'businesses' | 'avatars'
  ): Promise<string[]> => {
    if (!user) return [];
    const uploadedUrls = await Promise.all(
        Array.from(files).map(async (file) => {
            const storagePath = `${path}/${user.uid}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, file);
            return getDownloadURL(storageRef);
        })
    );
    return uploadedUrls;
  }, [user]);

  const createPost = useCallback(
    async (
      postData: Partial<Omit<Post, 'id'>>,
      postIdToUpdate?: string,
      imageFiles?: FileList
    ) => {
      if (!user || !userDetails) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
      }

      try {
        let imageUrls: string[] = postData.imageUrls || [];
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
          userId: user.uid,
          authorName: userDetails.name || 'Anonymous',
          authorImage: userDetails.avatarUrl || '',
          imageUrls: imageUrls.length > 0 ? imageUrls : [],
          timestamp: postIdToUpdate ? postData.timestamp : Timestamp.now(),
        };

        if (postIdToUpdate) {
            const postRef = doc(db, 'posts', postIdToUpdate);
            await updateDoc(postRef, finalPostData);
            toast({ title: 'Success', description: 'Post updated successfully.' });
        } else {
            await addDoc(collection(db, 'posts'), {
                ...finalPostData,
                commentCount: 0,
                likedBy: [],
            });
            toast({ title: 'Success', description: 'Post created successfully.' });
        }
      } catch (error) {
        console.error('Error creating/updating post:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save post.' });
      }
    },
    [user, userDetails, toast, uploadImages]
  );

  const createBusiness = useCallback(
    async (
      businessData: Omit<Business, 'id' | 'ownerId' | 'createdAt'>,
      businessIdToUpdate?: string,
      imageFiles?: FileList
    ) => {
      if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
      }

      try {
        let imageUrls: string[] = businessData.imageUrls || [];
        if (imageFiles && imageFiles.length > 0) {
            const uploadedUrls = await uploadImages(imageFiles, 'businesses');
            imageUrls = businessIdToUpdate ? [...imageUrls, ...uploadedUrls] : uploadedUrls;
        }

        const finalBusinessData = {
            ...businessData,
            ownerId: user.uid,
            imageUrls,
        }

        if (businessIdToUpdate) {
            const businessRef = doc(db, 'businesses', businessIdToUpdate);
            await updateDoc(businessRef, finalBusinessData);
            toast({ title: 'Success', description: 'Business updated successfully.' });
        } else {
            await addDoc(collection(db, 'businesses'), {
                ...finalBusinessData,
                createdAt: serverTimestamp(),
            });
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
            const postRef = doc(db, 'posts', postId);
            await deleteDoc(postRef);
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
            const businessRef = doc(db, 'businesses', businessId);
            await deleteDoc(businessRef);
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
