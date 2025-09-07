import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useDeepLinking() {
  const router = useRouter();

  const handleAppUrlOpen = useCallback(async (url: string) => {
    try {
      // Parse the URL and navigate accordingly
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      // Map deep link paths to app routes
      switch (path) {
        case '/post':
          const postId = urlObj.searchParams.get('id');
          if (postId) {
            router.push(`/post/${postId}`);
          }
          break;
        case '/user':
          const userId = urlObj.searchParams.get('id');
          if (userId) {
            router.push(`/user/${userId}`);
          }
          break;
        case '/event':
          const eventId = urlObj.searchParams.get('id');
          if (eventId) {
            router.push(`/event/${eventId}`);
          }
          break;
        case '/business':
          const businessId = urlObj.searchParams.get('id');
          if (businessId) {
            router.push(`/business/${businessId}`);
          }
          break;
        case '/messages':
          const conversationId = urlObj.searchParams.get('conv');
          if (conversationId) {
            router.push(`/messages/${conversationId}`);
          } else {
            router.push('/messages');
          }
          break;
        default:
          // Default navigation
          router.push(path);
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }, [router]);

  useEffect(() => {
    let appUrlOpenListener: any;

    const setupDeepLinking = async () => {
      try {
        // Only setup on mobile
        if (typeof window !== 'undefined' && 'Capacitor' in window) {
          const { App } = await import('@capacitor/app');
          
          // Listen for app URL open events
          appUrlOpenListener = await App.addListener('appUrlOpen', (event) => {
            handleAppUrlOpen(event.url);
          });

          // Handle initial URL if app was opened via deep link
          const launchUrl = await App.getLaunchUrl();
          if (launchUrl?.url) {
            handleAppUrlOpen(launchUrl.url);
          }
        }
      } catch (error) {
        console.log('Deep linking not available:', error);
      }
    };

    setupDeepLinking();

    return () => {
      if (appUrlOpenListener) {
        appUrlOpenListener.remove();
      }
    };
  }, [handleAppUrlOpen]);

  return { handleAppUrlOpen };
}
