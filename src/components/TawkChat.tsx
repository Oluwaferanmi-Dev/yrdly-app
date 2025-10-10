"use client";

import { useEffect, useRef } from "react";
// @ts-ignore - Tawk.to doesn't have TypeScript definitions
import TawkMessengerReact from "@tawk.to/tawk-messenger-react";

// Declare Tawk API for TypeScript
declare global {
  interface Window {
    Tawk_API?: {
      showWidget: () => void;
      hideWidget: () => void;
      isWidgetReady: boolean;
    };
  }
}

interface TawkChatProps {
  className?: string;
}

export function TawkChat({ className }: TawkChatProps) {
  const tawkRef = useRef<any>(null);

  useEffect(() => {
    // Wait for Tawk API to be ready before trying to show widget
    const checkAndShowWidget = () => {
      if (window.Tawk_API && window.Tawk_API.isWidgetReady) {
        window.Tawk_API.showWidget();
      } else {
        // Retry after a short delay if API is not ready
        setTimeout(checkAndShowWidget, 100);
      }
    };

    // Start checking for the API
    checkAndShowWidget();

    // Cleanup function to hide widget when component unmounts
    return () => {
      if (window.Tawk_API && window.Tawk_API.isWidgetReady) {
        window.Tawk_API.hideWidget();
      }
    };
  }, []);

  // Required callback functions to prevent errors
  const handleBeforeLoad = () => {
    // Widget is about to load
  };

  const handleLoad = () => {
    // Widget has loaded - now we can safely show it
    if (window.Tawk_API) {
      window.Tawk_API.showWidget();
    }
  };

  const handleStatusChange = (status: string) => {
    // Widget status changed
  };

  const handleChatMessageSystem = (message: any) => {
    // System message received
  };

  const handleUnreadCountChanged = (count: number) => {
    // Unread count changed
  };

  const handleChatHidden = () => {
    // Chat was hidden
  };

  const handleChatShown = () => {
    // Chat was shown
  };

  return (
    <div className={`${className} relative`}>
      <div className="fixed bottom-20 right-4 z-40">
        <TawkMessengerReact
          ref={tawkRef}
          propertyId="68bdbf72eb582f19258cedd9"
          widgetId="1j4ij7mb2"
          onBeforeLoad={handleBeforeLoad}
          onLoad={handleLoad}
          onStatusChange={handleStatusChange}
          onChatMessageSystem={handleChatMessageSystem}
          onUnreadCountChanged={handleUnreadCountChanged}
          onChatHidden={handleChatHidden}
          onChatShown={handleChatShown}
        />
      </div>
    </div>
  );
}
