import { collection, query, orderBy, limit, getDocs, doc, getDoc, onSnapshot, Query, CollectionReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Generic fetcher for Firestore collections
export const firestoreFetcher = async (key: string) => {
  try {
    // Parse the key to extract collection and options
    const [collectionName, ...options] = key.split('|');
    
    if (options.length === 0) {
      // Simple collection fetch
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    // Parse options
    const parsedOptions: any = {};
    options.forEach(option => {
      const [key, value] = option.split(':');
      if (key === 'orderBy') {
        const [field, direction] = value.split(',');
        parsedOptions.orderBy = { field, direction: direction || 'asc' };
      } else if (key === 'limit') {
        parsedOptions.limit = parseInt(value);
      } else if (key === 'where') {
        if (!parsedOptions.where) parsedOptions.where = [];
        const [field, operator, whereValue] = value.split(',');
        parsedOptions.where.push({ field, operator, value: whereValue });
      }
    });
    
    // Build query
    let q: Query | CollectionReference = collection(db, collectionName);
    
    if (parsedOptions.orderBy) {
      const orderDirection = (parsedOptions.orderBy.direction === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc';
      q = query(q, orderBy(parsedOptions.orderBy.field, orderDirection));
    }
    
    if (parsedOptions.limit) {
      q = query(q, limit(parsedOptions.limit));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Fetcher for single documents
export const documentFetcher = async (key: string) => {
  try {
    const [collectionName, docId] = key.split('/');
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

// Real-time fetcher for live updates
export const realtimeFetcher = (key: string, callback: (data: any) => void) => {
  try {
    const [collectionName, ...options] = key.split('|');
    
    let q: Query | CollectionReference = collection(db, collectionName);
    
    // Parse options for real-time query
    if (options.length > 0) {
      options.forEach(option => {
        const [key, value] = option.split(':');
        if (key === 'orderBy') {
          const [field, direction] = value.split(',');
          const orderDirection = (direction === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc';
          q = query(q, orderBy(field, orderDirection));
        } else if (key === 'limit') {
          q = query(q, limit(parseInt(value)));
        }
      });
    }
    
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    });
  } catch (error) {
    console.error('Error setting up real-time listener:', error);
    throw error;
  }
};

// Helper function to create SWR keys
export const createSWRKey = {
  // For collections
  collection: (name: string, options?: { orderBy?: string; limit?: number; where?: Array<{ field: string; operator: string; value: any }> }) => {
    let key = name;
    if (options?.orderBy) key += `|orderBy:${options.orderBy}`;
    if (options?.limit) key += `|limit:${options.limit}`;
    if (options?.where) {
      options.where.forEach(where => {
        key += `|where:${where.field},${where.operator},${where.value}`;
      });
    }
    return key;
  },
  
  // For documents
  document: (collectionName: string, docId: string) => `${collectionName}/${docId}`,
  
  // For user-specific data
  userData: (userId: string, dataType: string) => `users/${userId}|dataType:${dataType}`,
  
  // For posts with filters
  posts: (filters?: { category?: string; userId?: string; limit?: number }) => {
    let key = 'posts';
    if (filters?.category) key += `|category:${filters.category}`;
    if (filters?.userId) key += `|userId:${filters.userId}`;
    if (filters?.limit) key += `|limit:${filters.limit}`;
    key += '|orderBy:timestamp,desc';
    return key;
  }
};
