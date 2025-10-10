-- Social Features Migration
-- This migration creates friend management and notification systems

-- Friend requests table
CREATE TABLE public.friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    participant_ids TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN (
        'friend_request',
        'friend_request_accepted', 
        'friend_request_declined',
        'message',
        'message_reaction',
        'post_like',
        'post_comment',
        'post_share',
        'event_invite',
        'event_reminder',
        'event_cancelled',
        'event_updated',
        'marketplace_item_sold',
        'marketplace_item_interest',
        'marketplace_message',
        'community_update',
        'system_announcement',
        'welcome',
        'profile_view',
        'mention'
    )),
    title VARCHAR(255) NOT NULL DEFAULT 'Notification',
    message TEXT NOT NULL,
    related_id UUID,
    related_type VARCHAR(50),
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for social features
CREATE INDEX idx_friend_requests_from_user_id ON public.friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to_user_id ON public.friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_status ON public.friend_requests(status);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_sender_id ON public.notifications(sender_id);

CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Enable Row Level Security
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend requests
CREATE POLICY "Users can view friend requests" ON public.friend_requests 
    FOR SELECT USING (
        auth.uid() = from_user_id OR auth.uid() = to_user_id
    );

CREATE POLICY "Users can insert friend requests" ON public.friend_requests 
    FOR INSERT WITH CHECK (
        auth.uid() = from_user_id
    );

CREATE POLICY "Users can update friend requests" ON public.friend_requests 
    FOR UPDATE USING (
        auth.uid() = from_user_id OR auth.uid() = to_user_id
    );

CREATE POLICY "Users can delete friend requests" ON public.friend_requests 
    FOR DELETE USING (
        auth.uid() = from_user_id OR auth.uid() = to_user_id
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert notifications" ON public.notifications 
    FOR INSERT WITH CHECK (true);

-- RLS Policies for push subscriptions
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Create notification stats view
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    user_id,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE is_read = FALSE) as unread_count,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as today_count,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as week_count
FROM public.notifications
GROUP BY user_id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friend_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT SELECT ON notification_stats TO authenticated;
