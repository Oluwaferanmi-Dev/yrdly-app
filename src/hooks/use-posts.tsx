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
  arrayUnion,
  arrayRemove,
  increment,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

  const createPost = useCallback(
    async (postData: Omit<Post, 'id' | 'userId' | 'authorName' | 'authorImage' | 'timestamp' | 'commentCount' | 'likedBy'>) => {
      if (!user || !userDetails) {
        toast({ title: 'Error', description: 'You must be logged in to create a post.' });
        return;
      }

      try {
        await addDoc(collection(db, 'posts'), {
          ...postData,
          userId: user.uid,
          authorName: userDetails.name || 'Anonymous',
          authorImage: userDetails.avatarUrl || '',
          timestamp: serverTimestamp(),
          commentCount: 0,
          likedBy: [],
        });
        // No local state update needed here. The onSnapshot listener will handle it.
        toast({ title: 'Success', description: 'Post created successfully.' });
      } catch (error) {
        console.error('Error creating post:', error);
        toast({ title: 'Error', description: 'Failed to create post.' });
      }
    },
    [user, userDetails, toast]
  );
  
  const createBusiness = useCallback(
    async (businessData: Omit<Business, 'id' | 'ownerId' | 'createdAt'>) => {
      if (!user) {
        toast({ title: 'Error', description: 'You must be logged in to add a business.' });
        return;
      }

      try {
        await addDoc(collection(db, 'businesses'), {
          ...businessData,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Success', description: 'Business added successfully.' });
      } catch (error) {
        console.error('Error adding business:', error);
        toast({ title: 'Error', description: 'Failed to add business.' });
      }
    },
    [user, toast]
  );

  const likePost = useCallback(
    async (postId: string) => {
      if (!user) return;
      const postRef = doc(db, 'posts', postId);
      const post = posts.find((p) => p.id === postId);
      if (post?.likedBy.includes(user.uid)) {
        await updateDoc(postRef, { likedBy: arrayRemove(user.uid) });
      } else {
        await updateDoc(postRef, { likedBy: arrayUnion(user.uid) });
      }
    },
    [user, posts]
  );

  const addComment = useCallback(
    async (postId: string, commentText: string) => {
      if (!user || !userDetails) return;
      const commentData = {
        userId: user.uid,
        authorName: userDetails.name || 'Anonymous',
        authorImage: userDetails.avatarUrl || '',
        text: commentText,
        timestamp: serverTimestamp(),
        parentId: null,
        reactions: {},
      };
      await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
      await updateDoc(doc(db, 'posts', postId), {
        commentCount: increment(1),
      });
    },
    [user, userDetails]
  );

  const updatePost = useCallback(
    async (postId: string, postData: Partial<Post>) => {
      if (!user) {
        toast({ title: 'Error', description: 'You must be logged in to update a post.' });
        return;
      }

      try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, postData);
        toast({ title: 'Success', description: 'Post updated successfully.' });
      } catch (error) {
        console.error('Error updating post:', error);
        toast({ title: 'Error', description: 'Failed to update post.' });
      }
    },
    [user, toast]
  );

  const deletePost = useCallback(
    async (postId: string) => {
        if (!user) {
            toast({ title: 'Error', description: 'You must be logged in to delete a post.' });
            return;
        }

        try {
            const postRef = doc(db, 'posts', postId);
            await deleteDoc(postRef);
            toast({ title: 'Success', description: 'Post deleted successfully.' });
        } catch (error) {
            console.error('Error deleting post:', error);
            toast({ title: 'Error', description: 'Failed to delete post.' });
        }
    },
    [user, toast]
  );

  const updateBusiness = useCallback(
    async (businessId: string, businessData: Partial<Business>) => {
        if (!user) {
            toast({ title: 'Error', description: 'You must be logged in to update a business.' });
            return;
        }
        try {
            const businessRef = doc(db, 'businesses', businessId);
            await updateDoc(businessRef, businessData);
            toast({ title: 'Success', description: 'Business updated successfully.' });
        } catch (error) {
            console.error('Error updating business:', error);
            toast({ title: 'Error', description: 'Failed to update business.' });
        }
    }, [user, toast]
  );

  const deleteBusiness = useCallback(
    async (businessId: string) => {
        if (!user) {
            toast({ title: 'Error', description: 'You must be logged in to delete a business.' });
            return;
        }

        try {
            const businessRef = doc(db, 'businesses', businessId);
            await deleteDoc(businessRef);
            toast({ title: 'Success', description: 'Business deleted successfully.' });
        } catch (error) {
            console.error('Error deleting business:', error);
            toast({ title: 'Error', description: 'Failed to delete business.' });
        }
    },
    [user, toast]
  );

  return { posts, loading, createPost, createBusiness, likePost, addComment, updatePost, deletePost, updateBusiness, deleteBusiness };
};