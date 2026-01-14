-- Performance Optimization Migration
-- This migration optimizes RLS performance for location-aware filtering

-- Create a lookup function that can be cached/optimized by PostgreSQL
CREATE OR REPLACE FUNCTION public.get_my_state() 
RETURNS TEXT AS $$
  SELECT location->>'state' 
  FROM public.users 
  WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Update Posts RLS Policy
DROP POLICY IF EXISTS "Users see content from their state" ON public.posts;
CREATE POLICY "Users see content from their state" ON public.posts
  FOR SELECT USING (
    (posts.state = get_my_state())
    OR (posts.user_id = auth.uid())
    OR (posts.state IS NULL)
  );

-- Update Businesses RLS Policy
DROP POLICY IF EXISTS "Users see businesses from their state" ON public.businesses;
CREATE POLICY "Users see businesses from their state" ON public.businesses
  FOR SELECT USING (
    (businesses.state = get_my_state())
    OR (businesses.owner_id = auth.uid())
    OR (businesses.state IS NULL)
  );

COMMENT ON FUNCTION public.get_my_state() IS 'Retrieves the current authenticated user''s state. Optimized for use in RLS policies.';
