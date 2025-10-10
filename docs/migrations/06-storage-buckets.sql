-- Storage Buckets and Policies Migration
-- This migration sets up Supabase Storage buckets and RLS policies

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('post-images', 'post-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']),
  ('chat-images', 'chat-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']),
  ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']);

-- Create RLS policies for post-images bucket
-- Path structure: posts/{userId}/{fileName}
CREATE POLICY "Users can upload their own post images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'post-images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can view post images" ON storage.objects
FOR SELECT USING (bucket_id = 'post-images');

CREATE POLICY "Users can update their own post images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'post-images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own post images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'post-images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Create RLS policies for chat-images bucket
-- Path structure: chats/{userId}/{fileName}
CREATE POLICY "Users can upload their own chat images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can view chat images" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-images');

CREATE POLICY "Users can update their own chat images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'chat-images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own chat images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Create RLS policies for user-avatars bucket
-- Path structure: avatars/{userId}/{fileName}
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
