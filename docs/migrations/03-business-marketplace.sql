-- Business and Marketplace Migration
-- This migration creates business profiles and marketplace functionality

-- Businesses table
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    location JSONB NOT NULL, -- { address, geopoint }
    image_urls TEXT[] DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT NULL,
    review_count INTEGER DEFAULT 0,
    hours TEXT DEFAULT NULL,
    phone TEXT DEFAULT NULL,
    email TEXT DEFAULT NULL,
    website TEXT DEFAULT NULL,
    owner_name TEXT DEFAULT NULL,
    owner_avatar TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catalog items table (business products)
CREATE TABLE public.catalog_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    images TEXT[],
    category TEXT,
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business reviews table
CREATE TABLE public.business_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for business tables
CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX idx_businesses_category ON public.businesses(category);
CREATE INDEX idx_businesses_created_at ON public.businesses(created_at DESC);

CREATE INDEX idx_catalog_items_business_id ON public.catalog_items(business_id);
CREATE INDEX idx_catalog_items_category ON public.catalog_items(category);

CREATE INDEX idx_business_reviews_business_id ON public.business_reviews(business_id);
CREATE INDEX idx_business_reviews_user_id ON public.business_reviews(user_id);

-- Enable Row Level Security
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
CREATE POLICY "Users can view all businesses" ON public.businesses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create their own businesses" ON public.businesses
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = owner_id
    );

CREATE POLICY "Users can update their own businesses" ON public.businesses
    FOR UPDATE USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own businesses" ON public.businesses
    FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for catalog items
CREATE POLICY "Users can view all catalog items" ON public.catalog_items
    FOR SELECT USING (true);

CREATE POLICY "Business owners can manage their catalog items" ON public.catalog_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.businesses 
            WHERE id = business_id AND owner_id = auth.uid()
        )
    );

-- RLS Policies for business reviews
CREATE POLICY "Users can view all business reviews" ON public.business_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.business_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.business_reviews
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.business_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Business messages table
CREATE TABLE public.business_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    item_id UUID REFERENCES catalog_items(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for business messages
CREATE INDEX idx_business_messages_business_id ON public.business_messages(business_id);
CREATE INDEX idx_business_messages_sender_id ON public.business_messages(sender_id);
CREATE INDEX idx_business_messages_item_id ON public.business_messages(item_id);

-- Enable Row Level Security for business messages
ALTER TABLE public.business_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business messages
CREATE POLICY "Users can view business messages they sent" ON public.business_messages
    FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can create business messages" ON public.business_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own business messages" ON public.business_messages
    FOR UPDATE USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own business messages" ON public.business_messages
    FOR DELETE USING (auth.uid() = sender_id);

-- Add foreign key constraint for business_id in conversations table
-- This was deferred from 02-messaging-system.sql to avoid dependency issues
ALTER TABLE public.conversations 
ADD CONSTRAINT fk_conversations_business_id 
FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
