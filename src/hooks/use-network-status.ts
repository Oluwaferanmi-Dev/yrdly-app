import { useState, useEffect, useCallback } from 'react';
import { enableFirestoreNetwork, disableFirestoreNetwork } from '@/lib/firebase';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isFirestoreOnline, setIsFirestoreOnline] = useState(true);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    // Re-enable Firestore network when coming back online
    enableFirestoreNetwork();
    setIsFirestoreOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    // Keep Firestore offline for better offline experience
    // setIsFirestoreOnline(false);
  }, []);

  const toggleFirestoreNetwork = useCallback(async (enable: boolean) => {
    try {
      if (enable) {
        await enableFirestoreNetwork();
        setIsFirestoreOnline(true);
      } else {
        await disableFirestoreNetwork();
        setIsFirestoreOnline(false);
      }
    } catch (error) {
      console.error('Error toggling Firestore network:', error);
    }
  }, []);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    isFirestoreOnline,
    toggleFirestoreNetwork,
    // Helper to check if we should show offline UI
    shouldShowOfflineUI: !isOnline || !isFirestoreOnline,
    // Helper to check if we can make network requests
    canMakeRequests: isOnline
  };
}

