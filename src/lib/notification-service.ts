import { supabase } from './supabase';
import { PushNotificationService } from './push-notification-service';

export interface NotificationData {
  id: string;
  user_id: string;
  type: NotificationType;
  sender_id?: string;
  related_id?: string;
  related_type?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 
  | 'friend_request'
  | 'friend_request_accepted'
  | 'friend_request_declined'
  | 'message'
  | 'message_reaction'
  | 'post_like'
  | 'post_comment'
  | 'post_share'
  | 'event_invite'
  | 'event_reminder'
  | 'event_cancelled'
  | 'event_updated'
  | 'marketplace_item_sold'
  | 'marketplace_item_interest'
  | 'marketplace_message'
  | 'community_update'
  | 'system_announcement'
  | 'welcome'
  | 'profile_view'
  | 'mention';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  senderId?: string;
  relatedId?: string;
  relatedType?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(params: CreateNotificationParams): Promise<string> {
    try {
      // Try using the RPC function first
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: params.userId,
        p_type: params.type,
        p_title: params.title,
        p_message: params.message,
        p_sender_id: params.senderId || null,
        p_related_id: params.relatedId || null,
        p_related_type: params.relatedType || null,
        p_data: params.data || {}
      });

      if (error) {
        console.error('Error creating notification via RPC:', error);
        throw error;
      }

      // Send push notification
      try {
        await PushNotificationService.sendToUser(params.userId, {
          title: params.title,
          body: params.message,
          data: params.data,
          url: getNotificationUrl(params.type, params.relatedId)
        });
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
        // Don't throw error - notification was created successfully
      }

      return data;
    } catch (rpcError) {
      console.log('RPC function not available, using direct insert:', rpcError);
      
      // Fallback to direct insert if RPC function doesn't exist
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          type: params.type,
          sender_id: params.senderId || null,
          related_id: params.relatedId || null,
          related_type: params.relatedType || null,
          title: params.title,
          message: params.message,
          data: params.data || {}
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating notification via direct insert:', error);
        throw error;
      }

      // Send push notification
      try {
        await PushNotificationService.sendToUser(params.userId, {
          title: params.title,
          body: params.message,
          data: params.data,
          url: getNotificationUrl(params.type, params.relatedId)
        });
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
        // Don't throw error - notification was created successfully
      }

      return data.id;
    }
  }

  /**
   * Get notifications for a user
   */
  static async getNotifications(userId: string, limit = 50, offset = 0): Promise<NotificationData[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }

    return count || 0;
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      // Try using the RPC function first
      const { data, error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
        p_user_id: userId
      });

      if (error) {
        console.error('Error marking notification as read via RPC:', error);
        throw error;
      }

      return data;
    } catch (rpcError) {
      console.log('RPC function not available, using direct update:', rpcError);
      
      // Fallback to direct update
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking notification as read via direct update:', error);
        throw error;
      }

      return true;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    try {
      // Try using the RPC function first
      const { data, error } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error marking all notifications as read via RPC:', error);
        throw error;
      }

      return data;
    } catch (rpcError) {
      console.log('RPC function not available, using direct update:', rpcError);
      
      // Fallback to direct update
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read via direct update:', error);
        throw error;
      }

      return 0; // We can't get the count easily with direct update
    }
  }

  /**
   * Clear all notifications for a user
   */
  static async clearAllNotifications(userId: string): Promise<number> {
    try {
      // Try using the RPC function first
      const { data, error } = await supabase.rpc('clear_all_notifications', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error clearing all notifications via RPC:', error);
        throw error;
      }

      return data;
    } catch (rpcError) {
      console.log('RPC function not available, using direct delete:', rpcError);
      
      // Fallback to direct delete
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing all notifications via direct delete:', error);
        throw error;
      }

      return 0; // We can't get the count easily with direct delete
    }
  }

  /**
   * Delete a specific notification
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }

    return true;
  }

  /**
   * Get notification statistics for a user
   */
  static async getNotificationStats(userId: string) {
    const { data, error } = await supabase
      .from('notification_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create notification for friend request
   */
  static async createFriendRequestNotification(fromUserId: string, toUserId: string, fromUserName: string): Promise<string> {
    return this.createNotification({
      userId: toUserId,
      type: 'friend_request',
      senderId: fromUserId,
      relatedId: fromUserId,
      relatedType: 'user',
      title: 'New Friend Request',
      message: `${fromUserName} sent you a friend request`,
      data: { fromUserName }
    });
  }

  /**
   * Create notification for friend request accepted
   */
  static async createFriendRequestAcceptedNotification(fromUserId: string, toUserId: string, toUserName: string): Promise<string> {
    return this.createNotification({
      userId: fromUserId,
      type: 'friend_request_accepted',
      senderId: toUserId,
      relatedId: toUserId,
      relatedType: 'user',
      title: 'Friend Request Accepted',
      message: `${toUserName} accepted your friend request`,
      data: { toUserName }
    });
  }

  /**
   * Create notification for new message
   */
  static async createMessageNotification(
    toUserId: string, 
    fromUserId: string, 
    fromUserName: string, 
    conversationId: string, 
    messagePreview: string
  ): Promise<string> {
    return this.createNotification({
      userId: toUserId,
      type: 'message',
      senderId: fromUserId,
      relatedId: conversationId,
      relatedType: 'conversation',
      title: `New message from ${fromUserName}`,
      message: messagePreview,
      data: { fromUserName, conversationId, messagePreview }
    });
  }

  /**
   * Create notification for post like
   */
  static async createPostLikeNotification(
    postOwnerId: string, 
    likerId: string, 
    likerName: string, 
    postId: string
  ): Promise<string> {
    return this.createNotification({
      userId: postOwnerId,
      type: 'post_like',
      senderId: likerId,
      relatedId: postId,
      relatedType: 'post',
      title: 'Someone liked your post',
      message: `${likerName} liked your post`,
      data: { likerName, postId }
    });
  }

  /**
   * Create notification for post comment
   */
  static async createPostCommentNotification(
    postOwnerId: string, 
    commenterId: string, 
    commenterName: string, 
    postId: string, 
    commentPreview: string
  ): Promise<string> {
    return this.createNotification({
      userId: postOwnerId,
      type: 'post_comment',
      senderId: commenterId,
      relatedId: postId,
      relatedType: 'post',
      title: 'New comment on your post',
      message: `${commenterName} commented: "${commentPreview}"`,
      data: { commenterName, postId, commentPreview }
    });
  }

  /**
   * Create notification for event invite
   */
  static async createEventInviteNotification(
    inviteeId: string, 
    inviterId: string, 
    inviterName: string, 
    eventId: string, 
    eventTitle: string
  ): Promise<string> {
    return this.createNotification({
      userId: inviteeId,
      type: 'event_invite',
      senderId: inviterId,
      relatedId: eventId,
      relatedType: 'event',
      title: 'Event Invitation',
      message: `${inviterName} invited you to "${eventTitle}"`,
      data: { inviterName, eventId, eventTitle }
    });
  }

  /**
   * Create notification for marketplace item interest
   */
  static async createMarketplaceInterestNotification(
    sellerId: string, 
    buyerId: string, 
    buyerName: string, 
    itemId: string, 
    itemTitle: string
  ): Promise<string> {
    return this.createNotification({
      userId: sellerId,
      type: 'marketplace_item_interest',
      senderId: buyerId,
      relatedId: itemId,
      relatedType: 'marketplace_item',
      title: 'Interest in your item',
      message: `${buyerName} is interested in "${itemTitle}"`,
      data: { buyerName, itemId, itemTitle }
    });
  }

  /**
   * Create welcome notification for new users
   */
  static async createWelcomeNotification(userId: string, userName: string): Promise<string> {
    return this.createNotification({
      userId,
      type: 'welcome',
      title: 'Welcome to Yrdly!',
      message: `Welcome ${userName}! Start by exploring your neighborhood and connecting with neighbors.`,
      data: { userName }
    });
  }

  /**
   * Create system announcement notification
   */
  static async createSystemAnnouncementNotification(
    userId: string, 
    title: string, 
    message: string, 
    data?: Record<string, any>
  ): Promise<string> {
    return this.createNotification({
      userId,
      type: 'system_announcement',
      title,
      message,
      data
    });
  }
}

/**
 * Get notification URL based on type and related ID
 */
function getNotificationUrl(type: NotificationType, relatedId?: string | null): string {
  switch (type) {
    case 'friend_request':
    case 'friend_request_accepted':
    case 'friend_request_declined':
      return '/neighbors';
    case 'message':
    case 'message_reaction':
      return relatedId ? `/messages/${relatedId}` : '/messages';
    case 'post_like':
    case 'post_comment':
    case 'post_share':
      return relatedId ? `/posts/${relatedId}` : '/home';
    case 'event_invite':
    case 'event_reminder':
    case 'event_cancelled':
    case 'event_updated':
      return '/events';
    case 'marketplace_item_sold':
    case 'marketplace_item_interest':
    case 'marketplace_message':
      return '/marketplace';
    case 'community_update':
    case 'system_announcement':
    case 'profile_view':
    case 'mention':
    case 'welcome':
    default:
      return '/home';
  }
}
