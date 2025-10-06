import { supabase } from './supabase';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  url?: string;
}

export class PushNotificationService {
  /**
   * Send push notification to a specific user
   */
  static async sendToUser(userId: string, payload: PushNotificationPayload): Promise<boolean> {
    try {
      // Get user's push subscription
      const { data: subscription, error: fetchError } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)
        .single();

      if (fetchError || !subscription) {
        console.log('No push subscription found for user:', userId);
        return false;
      }

      // Send push notification via service worker (client-side approach)
      if (typeof window !== 'undefined') {
        const registration = await navigator.serviceWorker.ready;
        
        const notificationPayload = {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/favicon.ico',
          badge: payload.badge || '/favicon.ico',
          data: {
            ...payload.data,
            url: payload.url,
            timestamp: Date.now()
          },
          actions: [
            {
              action: 'view',
              title: 'View',
              icon: '/favicon.ico'
            },
            {
              action: 'close',
              title: 'Close',
              icon: '/favicon.ico'
            }
          ]
        };

        // Send message to service worker to show notification
        registration.active?.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: notificationPayload
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple users
   */
  static async sendToUsers(userIds: string[], payload: PushNotificationPayload): Promise<number> {
    let successCount = 0;
    
    for (const userId of userIds) {
      const success = await this.sendToUser(userId, payload);
      if (success) successCount++;
    }
    
    return successCount;
  }

  /**
   * Send push notification to all users
   */
  static async sendToAllUsers(payload: PushNotificationPayload): Promise<number> {
    try {
      // Get all push subscriptions
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('user_id, subscription');

      if (error || !subscriptions) {
        console.error('Error fetching push subscriptions:', error);
        return 0;
      }

      let successCount = 0;
      for (const sub of subscriptions) {
        const success = await this.sendToUser(sub.user_id, payload);
        if (success) successCount++;
      }

      return successCount;
    } catch (error) {
      console.error('Error sending push notification to all users:', error);
      return 0;
    }
  }

  /**
   * Test push notification (for development)
   */
  static async testNotification(userId: string): Promise<boolean> {
    return this.sendToUser(userId, {
      title: 'Test Notification',
      body: 'This is a test push notification from Yrdly!',
      url: '/home'
    });
  }
}
