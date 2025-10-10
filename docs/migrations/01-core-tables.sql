-- Core Tables Migration
-- This migration creates the fundamental tables for the Yrdly app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE post_category AS ENUM ('General', 'Event', 'For Sale', 'Business');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE onboarding_step AS ENUM ('signup', 'email_verification', 'profile_setup', 'welcome', 'tour', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    location JSONB, -- { state, lga, city, ward }
    friends UUID[] DEFAULT '{}',
    blocked_users UUID[] DEFAULT '{}',
    notification_settings JSONB DEFAULT '{
        "friendRequests": true,
        "messages": true,
        "postUpdates": true,
        "comments": true,
        "postLikes": true,
        "eventInvites": true
    }',
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ,
    onboarding_status onboarding_step DEFAULT 'signup',
    profile_completed BOOLEAN DEFAULT false,
    onboarding_completed_at TIMESTAMPTZ,
    tour_completed BOOLEAN DEFAULT false,
    welcome_message_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_image TEXT,
    text TEXT NOT NULL,
    description TEXT, -- For marketplace listings
    image_url TEXT,
    image_urls TEXT[],
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    comment_count INTEGER DEFAULT 0,
    category post_category NOT NULL,
    
    -- Event-specific fields
    title TEXT,
    event_date TEXT,
    event_time TEXT,
    event_link TEXT,
    event_location JSONB, -- { address, geopoint }
    attendees TEXT[] DEFAULT '{}',
    
    -- For Sale specific fields
    price DECIMAL(10,2),
    
    liked_by UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_image TEXT,
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reactions JSONB DEFAULT '{}', -- { emoji: [userIds] }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for core tables
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_onboarding_status ON public.users(onboarding_status);
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_timestamp ON public.posts(timestamp DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_timestamp ON public.comments(timestamp);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for core tables
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- Create proper RLS policies for users table
CREATE POLICY "Users can read all users" ON public.users 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own data" ON public.users 
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON public.users 
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Posts are readable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to like/unlike posts" ON public.posts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update comment_count" ON public.posts FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Comments are readable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update comment reactions" ON public.comments FOR UPDATE USING (true) WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
