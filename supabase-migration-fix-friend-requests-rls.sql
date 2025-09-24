-- Fix RLS policies for friend_requests table
-- This migration adds the missing RLS policies for friend_requests table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can insert friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can delete friend requests" ON public.friend_requests;

-- Create RLS policies for friend_requests table

-- Users can view friend requests where they are either the sender or receiver
CREATE POLICY "Users can view friend requests" ON public.friend_requests 
FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
);

-- Users can insert friend requests where they are the sender
CREATE POLICY "Users can insert friend requests" ON public.friend_requests 
FOR INSERT WITH CHECK (
    auth.uid() = from_user_id
);

-- Users can update friend requests where they are either the sender or receiver
CREATE POLICY "Users can update friend requests" ON public.friend_requests 
FOR UPDATE USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
);

-- Users can delete friend requests where they are either the sender or receiver
CREATE POLICY "Users can delete friend requests" ON public.friend_requests 
FOR DELETE USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
);
