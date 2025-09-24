-- Enable real-time for posts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

-- Enable real-time for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable real-time for conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Enable real-time for comments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- Enable real-time for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
