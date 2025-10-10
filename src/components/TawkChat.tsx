"use client";

import { useEffect } from "react";
// @ts-ignore - Tawk.to doesn't have TypeScript definitions
import TawkMessengerReact from "@tawk.to/tawk-messenger-react";

interface TawkChatProps {
  className?: string;
}

export function TawkChat({ className }: TawkChatProps) {
  useEffect(() => {
    // Optional: You can add any initialization logic here
    console.log("Tawk.to chat widget loaded");
  }, []);

  // Required callback functions to prevent errors
  const handleBeforeLoad = () => {
    console.log("Tawk.to widget is about to load");
  };

  const handleLoad = () => {
    console.log("Tawk.to widget has loaded");
  };

  const handleStatusChange = (status: string) => {
    console.log("Tawk.to widget status changed:", status);
  };

  const handleChatMessageSystem = (message: any) => {
    console.log("Tawk.to system message:", message);
  };

  const handleUnreadCountChanged = (count: number) => {
    console.log("Tawk.to unread count changed:", count);
  };

  return (
    <div className={`${className} relative`}>
      <div className="fixed bottom-20 right-4 z-40">
        <TawkMessengerReact
          propertyId="68bdbf72eb582f19258cedd9"
          widgetId="1j4ij7mb2"
          onBeforeLoad={handleBeforeLoad}
          onLoad={handleLoad}
          onStatusChange={handleStatusChange}
          onChatMessageSystem={handleChatMessageSystem}
          onUnreadCountChanged={handleUnreadCountChanged}
        />
      </div>
    </div>
  );
}
