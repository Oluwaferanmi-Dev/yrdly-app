import { supabase } from './supabase';
import { useToast } from '@/hooks/use-toast';

export interface DeleteOptions {
  showToast?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export class DeleteService {
  /**
   * Delete a post (including marketplace items, events, etc.)
   */
  static async deletePost(postId: string, userId: string, options: DeleteOptions = {}): Promise<boolean> {
    try {
      // First verify the user owns this post
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (fetchError) {
        console.error('Error fetching post:', fetchError);
        options.onError?.('Failed to verify post ownership');
        return false;
      }

      if (post.user_id !== userId) {
        options.onError?.('You can only delete your own posts');
        return false;
      }

      // Delete the post
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (deleteError) {
        console.error('Error deleting post:', deleteError);
        options.onError?.('Failed to delete post');
        return false;
      }

      if (options.showToast) {
        // Note: This would need to be called from a component with toast access
        console.log('Post deleted successfully');
      }

      options.onSuccess?.();
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      options.onError?.('An unexpected error occurred');
      return false;
    }
  }

  /**
   * Delete a business
   */
  static async deleteBusiness(businessId: string, userId: string, options: DeleteOptions = {}): Promise<boolean> {
    try {
      // First verify the user owns this business
      const { data: business, error: fetchError } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single();

      if (fetchError) {
        console.error('Error fetching business:', fetchError);
        options.onError?.('Failed to verify business ownership');
        return false;
      }

      if (business.owner_id !== userId) {
        options.onError?.('You can only delete your own businesses');
        return false;
      }

      // Delete the business
      const { error: deleteError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (deleteError) {
        console.error('Error deleting business:', deleteError);
        options.onError?.('Failed to delete business');
        return false;
      }

      if (options.showToast) {
        console.log('Business deleted successfully');
      }

      options.onSuccess?.();
      return true;
    } catch (error) {
      console.error('Error deleting business:', error);
      options.onError?.('An unexpected error occurred');
      return false;
    }
  }

  /**
   * Delete a conversation/message thread
   */
  static async deleteConversation(conversationId: string, userId: string, options: DeleteOptions = {}): Promise<boolean> {
    try {
      // First verify the user is a participant
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select('participant_ids')
        .eq('id', conversationId)
        .single();

      if (fetchError) {
        console.error('Error fetching conversation:', fetchError);
        options.onError?.('Failed to verify conversation access');
        return false;
      }

      if (!conversation.participant_ids?.includes(userId)) {
        options.onError?.('You can only delete conversations you participate in');
        return false;
      }

      // Delete all messages in the conversation first
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        options.onError?.('Failed to delete messages');
        return false;
      }

      // Delete the conversation
      const { error: deleteError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (deleteError) {
        console.error('Error deleting conversation:', deleteError);
        options.onError?.('Failed to delete conversation');
        return false;
      }

      if (options.showToast) {
        console.log('Conversation deleted successfully');
      }

      options.onSuccess?.();
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      options.onError?.('An unexpected error occurred');
      return false;
    }
  }
}
