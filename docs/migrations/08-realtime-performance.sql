-- Real-time and Performance Optimization Migration
-- This migration enables real-time subscriptions and adds performance optimizations

-- Enable real-time for all tables (only if not already added)
DO $$ 
BEGIN
    -- Add tables to realtime publication if not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'users' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'posts' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'comments' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'conversations' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'businesses' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'catalog_items' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.catalog_items;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'business_reviews' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.business_reviews;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'escrow_transactions' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_transactions;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'seller_accounts' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_accounts;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'verification_documents' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_documents;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'payout_requests' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_requests;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'item_chats' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.item_chats;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'chat_messages' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'friend_requests' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'push_subscriptions' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.push_subscriptions;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'business_messages' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.business_messages;
    END IF;
END $$;

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_liked_by ON public.posts USING GIN(liked_by);
CREATE INDEX IF NOT EXISTS idx_posts_attendees ON public.posts USING GIN(attendees);
CREATE INDEX IF NOT EXISTS idx_posts_image_urls ON public.posts USING GIN(image_urls);
CREATE INDEX IF NOT EXISTS idx_posts_price ON public.posts(price) WHERE price IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_friends ON public.users USING GIN(friends);
CREATE INDEX IF NOT EXISTS idx_users_blocked_users ON public.users USING GIN(blocked_users);
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users USING GIN(location);

CREATE INDEX IF NOT EXISTS idx_comments_reactions ON public.comments USING GIN(reactions);

CREATE INDEX IF NOT EXISTS idx_businesses_image_urls ON public.businesses USING GIN(image_urls);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON public.businesses USING GIN(location);

CREATE INDEX IF NOT EXISTS idx_catalog_items_images ON public.catalog_items USING GIN(images);

CREATE INDEX IF NOT EXISTS idx_escrow_transactions_delivery_details ON public.escrow_transactions USING GIN(delivery_details);

CREATE INDEX IF NOT EXISTS idx_seller_accounts_account_details ON public.seller_accounts USING GIN(account_details);
CREATE INDEX IF NOT EXISTS idx_seller_accounts_verification_data ON public.seller_accounts USING GIN(verification_data);

CREATE INDEX IF NOT EXISTS idx_notifications_data ON public.notifications USING GIN(data);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_subscription ON public.push_subscriptions USING GIN(subscription);

CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata ON public.chat_messages USING GIN(metadata);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_posts_user_category ON public.posts(user_id, category);
CREATE INDEX IF NOT EXISTS idx_posts_category_timestamp ON public.posts(category, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_posts_price_category ON public.posts(price, category) WHERE price IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comments_post_timestamp ON public.comments(post_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_comments_user_timestamp ON public.comments(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp ON public.messages(conversation_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_sender_timestamp ON public.messages(sender_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON public.notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_friend_requests_status_timestamp ON public.friend_requests(status, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_escrow_transactions_buyer_status ON public.escrow_transactions(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_seller_status ON public.escrow_transactions(seller_id, status);

-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_active_events ON public.posts(category, event_date) WHERE category = 'Event' AND event_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_marketplace_items ON public.posts(category, price) WHERE category = 'For Sale' AND price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_business_posts ON public.posts(category, timestamp DESC) WHERE category = 'Business';

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, created_at DESC) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_friend_requests_pending ON public.friend_requests(to_user_id, created_at DESC) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_escrow_transactions_pending ON public.escrow_transactions(status, created_at DESC) WHERE status = 'pending';

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_posts_text_search ON public.posts USING GIN(to_tsvector('english', text || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_businesses_text_search ON public.businesses USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_catalog_items_text_search ON public.catalog_items USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
