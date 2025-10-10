-- Messaging System Migration
-- This migration creates the messaging system with conversations and messages

-- Conversations table
CREATE TABLE public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_ids UUID[] NOT NULL,
    last_message_id UUID,
    last_message_text TEXT,
    last_message_sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    last_message_timestamp TIMESTAMP WITH TIME ZONE,
    last_message_is_read BOOLEAN DEFAULT false,
    last_message_read_by TEXT[] DEFAULT '{}',
    typing JSONB DEFAULT '{}', -- { userId: boolean }
    
    -- Conversation type and context
    type TEXT DEFAULT 'friend' CHECK (type IN ('friend', 'marketplace', 'business')),
    
    -- Marketplace-specific columns
    item_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    item_title TEXT,
    item_image TEXT,
    item_price DECIMAL(10,2),
    
    -- Business-specific columns (will be added later when businesses table exists)
    business_id UUID,
    business_name TEXT,
    business_logo TEXT,
    
    -- Additional context
    context JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT,
    image_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    read_by TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Item chats table (marketplace-specific chats)
CREATE TABLE public.item_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id TEXT NOT NULL,
    buyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    item_title TEXT NOT NULL,
    item_image_url TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_message TEXT,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table (for item chats)
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES public.item_chats(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business messages table (will be created later when businesses and catalog_items tables exist)
-- This table is moved to 03-business-marketplace.sql to avoid dependency issues

-- Create indexes for messaging tables
CREATE INDEX idx_conversations_participant_ids ON public.conversations USING GIN(participant_ids);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX idx_conversations_type ON public.conversations(type);
CREATE INDEX idx_conversations_item_id ON public.conversations(item_id);
CREATE INDEX idx_conversations_business_id ON public.conversations(business_id);

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON public.messages(timestamp ASC);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);

CREATE INDEX idx_item_chats_buyer_id ON public.item_chats(buyer_id);
CREATE INDEX idx_item_chats_seller_id ON public.item_chats(seller_id);
CREATE INDEX idx_item_chats_item_id ON public.item_chats(item_id);
CREATE INDEX idx_item_chats_last_message_at ON public.item_chats(last_message_at DESC);

CREATE INDEX idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX idx_chat_messages_timestamp ON public.chat_messages(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
    FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can update conversations they participate in" ON public.conversations
    FOR UPDATE USING (auth.uid() = ANY(participant_ids))
    WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can delete conversations they participate in" ON public.conversations
    FOR DELETE USING (auth.uid() = ANY(participant_ids));

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND auth.uid() = ANY(participant_ids)
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND auth.uid() = ANY(participant_ids)
        )
    );

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (auth.uid() = sender_id);

-- RLS Policies for item chats
CREATE POLICY "Users can read own item chats" ON public.item_chats 
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create item chats" ON public.item_chats 
    FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS Policies for chat messages
CREATE POLICY "Users can read own chat messages" ON public.chat_messages 
    FOR SELECT USING (auth.uid()::text = sender_id);

CREATE POLICY "Users can create chat messages" ON public.chat_messages 
    FOR INSERT WITH CHECK (auth.uid()::text = sender_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_chats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
