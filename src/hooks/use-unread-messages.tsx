
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let count = 0;
      querySnapshot.forEach((doc) => {
        const conversation = doc.data();
        if (
          conversation.lastMessage &&
          conversation.lastMessage.senderId !== user.uid &&
          !conversation.lastMessage.readBy.includes(user.uid)
        ) {
          count++;
        }
      });
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return unreadCount;
};
