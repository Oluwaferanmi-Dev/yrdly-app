-- Quick Fix for Users Table RLS Policies
-- Run this to fix the authentication issues with the users table

-- Drop existing problematic policies
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

-- Also ensure the users table has proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
