# Push Notifications Setup

## Environment Variables

Add these to your `.env.local` file:

```bash
# Push Notifications (VAPID Keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEXoYt0SNFbgAdSHkImjz_Lk0GA5VJgUkBrWgdPxNTnmg1F27QdzPTLlq2UvBvIadThNKoChAtQfPkCFZ4IHUl8
VAPID_PRIVATE_KEY=uD1u0UOv2hC98haNFTQiYVrGiGCJCOrEeODpcpqub08
VAPID_EMAIL=admin@yrdly.com
```

## Database Table

Create the `push_subscriptions` table in your Supabase database:

```sql
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
```

## Testing

1. Make sure the environment variables are set
2. Restart your development server
3. Go to Settings > Notifications
4. Click "Send Test Notification"
5. Check if you receive the notification

## Troubleshooting

- **"missing applicationServerKey"**: Make sure `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is set in your `.env.local`
- **"manifest empty or missing"**: Make sure your service worker is properly registered
- **Permission denied**: Check browser notification settings