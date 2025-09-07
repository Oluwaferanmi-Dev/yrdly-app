import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface OfflineAction {
  id: string;
  type: 'create_post' | 'send_message' | 'create_event' | 'create_business' | 'update_profile';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastOnline: Date | null;
  offlineActions: OfflineAction[];
  canSync: boolean;
}

export function useOffline() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastOnline: navigator.onLine ? new Date() : null,
    offlineActions: [],
    canSync: false
  });

  const [isFirestoreOnline, setIsFirestoreOnline] = useState(true);
  const offlineActionsRef = useRef<OfflineAction[]>([]);
  const syncInProgressRef = useRef(false);

  // Save offline actions to localStorage
  const saveOfflineActions = useCallback((actions: OfflineAction[]) => {
    try {
      localStorage.setItem('yrdly-offline-actions', JSON.stringify(actions));
    } catch (error) {
      console.error('Failed to save offline actions:', error);
    }
  }, []);

  // Add offline action
  const addOfflineAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    const updatedActions = [...offlineActionsRef.current, newAction];
    offlineActionsRef.current = updatedActions;
    
    setStatus(prev => ({
      ...prev,
      offlineActions: updatedActions
    }));

    saveOfflineActions(updatedActions);
    
    console.log('Added offline action:', newAction);
    return newAction.id;
  }, [saveOfflineActions]);

  // Remove offline action
  const removeOfflineAction = useCallback((actionId: string) => {
    const updatedActions = offlineActionsRef.current.filter(action => action.id !== actionId);
    offlineActionsRef.current = updatedActions;
    
    setStatus(prev => ({
      ...prev,
      offlineActions: updatedActions
    }));

    saveOfflineActions(updatedActions);
  }, [saveOfflineActions]);

  // Update offline action retry count
  const updateActionRetryCount = useCallback((actionId: string, retryCount: number) => {
    const updatedActions = offlineActionsRef.current.map(action =>
      action.id === actionId ? { ...action, retryCount } : action
    );
    offlineActionsRef.current = updatedActions;
    
    setStatus(prev => ({
      ...prev,
      offlineActions: updatedActions
    }));

    saveOfflineActions(updatedActions);
  }, [saveOfflineActions]);

  // Create post from offline data
  const createPostFromOffline = useCallback(async (data: any) => {
    try {
      const postRef = doc(db, 'posts', `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      await setDoc(postRef, {
        ...data,
        createdAt: new Date(),
        isOfflineCreated: true,
        syncedAt: new Date(),
        status: 'pending_sync'
      });
      
      console.log('Successfully created offline post:', postRef.id);
      return postRef.id;
    } catch (error) {
      console.error('Failed to create offline post:', error);
      throw error;
    }
  }, []);

  // Send message from offline data
  const sendMessageFromOffline = useCallback(async (data: any) => {
    try {
      const messageRef = doc(db, 'messages', `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      await setDoc(messageRef, {
        ...data,
        timestamp: new Date(),
        isOfflineSent: true,
        syncedAt: new Date(),
        status: 'pending_sync'
      });
      
      console.log('Successfully created offline message:', messageRef.id);
      return messageRef.id;
    } catch (error) {
      console.error('Failed to create offline message:', error);
      throw error;
    }
  }, []);

  // Create event from offline data
  const createEventFromOffline = useCallback(async (data: any) => {
    try {
      const eventRef = doc(db, 'events', `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      await setDoc(eventRef, {
        ...data,
        createdAt: new Date(),
        isOfflineCreated: true,
        syncedAt: new Date(),
        status: 'pending_sync'
      });
      
      console.log('Successfully created offline event:', eventRef.id);
      return eventRef.id;
    } catch (error) {
      console.error('Failed to create offline event:', error);
      throw error;
    }
  }, []);

  // Create business from offline data
  const createBusinessFromOffline = useCallback(async (data: any) => {
    try {
      const businessRef = doc(db, 'businesses', `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      await setDoc(businessRef, {
        ...data,
        createdAt: new Date(),
        isOfflineCreated: true,
        syncedAt: new Date(),
        status: 'pending_sync'
      });
      
      console.log('Successfully created offline business:', businessRef.id);
      return businessRef.id;
    } catch (error) {
      console.error('Failed to create offline business:', error);
      throw error;
    }
  }, []);

  // Update profile from offline data
  const updateProfileFromOffline = useCallback(async (data: any) => {
    try {
      const { userId, ...profileData } = data;
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...profileData,
        updatedAt: new Date(),
        isOfflineUpdated: true,
        syncedAt: new Date(),
        status: 'pending_sync'
      }, { merge: true });
      
      console.log('Successfully updated offline profile for user:', userId);
      return userId;
    } catch (error) {
      console.error('Failed to update offline profile:', error);
      throw error;
    }
  }, []);

  // Perform specific offline action
  const performOfflineAction = useCallback(async (action: OfflineAction) => {
    try {
      switch (action.type) {
        case 'create_post':
          return await createPostFromOffline(action.data);
        case 'send_message':
          return await sendMessageFromOffline(action.data);
        case 'create_event':
          return await createEventFromOffline(action.data);
        case 'create_business':
          return await createBusinessFromOffline(action.data);
        case 'update_profile':
          return await updateProfileFromOffline(action.data);
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Failed to perform offline action ${action.type}:`, error);
      
      // If it's a network error, don't remove the action - let it retry
      if (error instanceof Error && error.message.includes('network')) {
        throw error;
      }
      
      // For other errors, log and continue
      console.warn(`Action ${action.type} failed with non-network error:`, error);
      return null; // Mark as "handled" but not successful
    }
  }, [createPostFromOffline, sendMessageFromOffline, createEventFromOffline, createBusinessFromOffline, updateProfileFromOffline]);

  // Sync offline data - now all functions are defined
  const syncOfflineData = useCallback(async () => {
    if (syncInProgressRef.current || !status.isOnline || !isFirestoreOnline) {
      return;
    }

    syncInProgressRef.current = true;
    setStatus(prev => ({ ...prev, isConnecting: true }));

    try {
      const actions = [...offlineActionsRef.current];
      console.log('Starting sync for', actions.length, 'offline actions');

      for (const action of actions) {
        try {
          await performOfflineAction(action);
          removeOfflineAction(action.id);
          console.log('Successfully synced action:', action.id);
        } catch (error) {
          console.error('Failed to sync action:', action.id, error);
          
          // Increment retry count
          const newRetryCount = action.retryCount + 1;
          updateActionRetryCount(action.id, newRetryCount);

          // Remove action if retry limit exceeded
          if (newRetryCount >= 3) {
            console.warn('Removing action after max retries:', action.id);
            removeOfflineAction(action.id);
          }
        }
      }

      console.log('Offline sync completed');
    } catch (error) {
      console.error('Offline sync failed:', error);
    } finally {
      syncInProgressRef.current = false;
      setStatus(prev => ({ ...prev, isConnecting: false }));
    }
  }, [status.isOnline, isFirestoreOnline, removeOfflineAction, updateActionRetryCount, performOfflineAction]);

  // Manual sync trigger
  const triggerSync = useCallback(() => {
    if (status.canSync && !status.isConnecting) {
      syncOfflineData();
    }
  }, [status.canSync, status.isConnecting, syncOfflineData]);

  // Clear all offline actions (for testing)
  const clearOfflineActions = useCallback(() => {
    offlineActionsRef.current = [];
    setStatus(prev => ({ ...prev, offlineActions: [] }));
    saveOfflineActions([]);
  }, [saveOfflineActions]);

  // Network status monitoring - now syncOfflineData is defined
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        lastOnline: new Date(),
        canSync: true
      }));
      
      // Trigger sync when back online
      if (offlineActionsRef.current.length > 0) {
        setTimeout(() => {
          syncOfflineData();
        }, 100);
      }
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        canSync: false
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineData]);

  // Check Firestore connection
  useEffect(() => {
    const checkFirestoreConnection = async () => {
      try {
        // Try to access a document to check connection
        const testDoc = doc(db, '_test', 'connection');
        await getDoc(testDoc);
        setIsFirestoreOnline(true);
      } catch (error) {
        setIsFirestoreOnline(false);
      }
    };

    const interval = setInterval(checkFirestoreConnection, 10000);
    checkFirestoreConnection();

    return () => clearInterval(interval);
  }, []);

  // Load offline actions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('yrdly-offline-actions');
      if (stored) {
        const actions = JSON.parse(stored);
        offlineActionsRef.current = actions;
        setStatus(prev => ({
          ...prev,
          offlineActions: actions
        }));
      }
    } catch (error) {
      console.error('Failed to load offline actions:', error);
    }
  }, []);

  return {
    // Status
    isOnline: status.isOnline,
    isConnecting: status.isConnecting,
    isFirestoreOnline,
    lastOnline: status.lastOnline,
    offlineActions: status.offlineActions,
    canSync: status.canSync,
    
    // Actions
    addOfflineAction,
    removeOfflineAction,
    syncOfflineData,
    triggerSync,
    clearOfflineActions,
    
    // Computed
    hasOfflineActions: status.offlineActions.length > 0,
    pendingActionsCount: status.offlineActions.length
  };
}
