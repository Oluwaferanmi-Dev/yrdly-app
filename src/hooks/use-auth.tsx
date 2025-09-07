
"use client";

import { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import type { User } from '@/types';
import { onlineStatusService } from '@/lib/online-status';

interface AuthContextType {
  user: FirebaseUser | null;
  userDetails: User | null;
  loading: boolean;
  pendingRequestCount: number;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userDetails: null, 
  loading: true,
  pendingRequestCount: 0 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserDetails({ id: doc.id, ...doc.data() } as User);
          } else {
            setUserDetails(null);
          }
          setLoading(false);
        });

        const requestsQuery = query(
          collection(db, "friend_requests"),
          where("toUserId", "==", user.uid),
          where("status", "==", "pending")
        );
        const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
          setPendingRequestCount(snapshot.size);
        });

        // Initialize online status tracking
        onlineStatusService.initialize(user.uid);

        return () => {
          unsubscribeSnapshot();
          unsubscribeRequests();
          onlineStatusService.cleanup();
        };
      } else {
        setUserDetails(null);
        setPendingRequestCount(0);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userDetails, loading, pendingRequestCount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
