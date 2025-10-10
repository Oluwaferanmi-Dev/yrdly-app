-- Escrow and Payments Migration
-- This migration creates the escrow system and payment processing tables

-- Create custom types for escrow and payments (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE escrow_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'completed', 'disputed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'mobile_money');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_option AS ENUM ('face_to_face', 'partnered_service', 'own_logistics');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('bank_account', 'mobile_money', 'digital_wallet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_level AS ENUM ('basic', 'bank_account', 'identity', 'address');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Escrow transactions table
CREATE TABLE public.escrow_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id TEXT NOT NULL,
    buyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    seller_amount DECIMAL(10,2) NOT NULL,
    status escrow_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL,
    delivery_details JSONB NOT NULL, -- { option, address, meetingPoint, etc. }
    paid_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    dispute_reason TEXT,
    dispute_resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seller accounts table
CREATE TABLE public.seller_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    account_type account_type NOT NULL,
    account_details JSONB NOT NULL, -- BankAccountDetails | MobileMoneyDetails | DigitalWalletDetails
    verification_status verification_status NOT NULL DEFAULT 'pending',
    verification_level verification_level NOT NULL DEFAULT 'basic',
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    verified_at TIMESTAMPTZ,
    rejected_reason TEXT,
    verification_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification documents table
CREATE TABLE public.verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('government_id', 'utility_bill', 'bank_statement')),
    document_url TEXT NOT NULL,
    status verification_status NOT NULL DEFAULT 'pending',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    rejected_reason TEXT
);

-- Payout requests table
CREATE TABLE public.payout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.seller_accounts(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    failure_reason TEXT,
    transaction_reference TEXT
);

-- Create indexes for escrow and payment tables
CREATE INDEX idx_escrow_buyer_id ON public.escrow_transactions(buyer_id);
CREATE INDEX idx_escrow_seller_id ON public.escrow_transactions(seller_id);
CREATE INDEX idx_escrow_status ON public.escrow_transactions(status);
CREATE INDEX idx_escrow_item_id ON public.escrow_transactions(item_id);

CREATE INDEX idx_seller_accounts_user_id ON public.seller_accounts(user_id);
CREATE INDEX idx_seller_accounts_verification_status ON public.seller_accounts(verification_status);

CREATE INDEX idx_verification_documents_user_id ON public.verification_documents(user_id);
CREATE INDEX idx_verification_documents_status ON public.verification_documents(status);

CREATE INDEX idx_payout_requests_seller_id ON public.payout_requests(seller_id);
CREATE INDEX idx_payout_requests_status ON public.payout_requests(status);

-- Enable Row Level Security
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for escrow transactions
CREATE POLICY "Users can read own escrow transactions" ON public.escrow_transactions 
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create escrow transactions" ON public.escrow_transactions 
    FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update own escrow transactions" ON public.escrow_transactions 
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
    WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS Policies for seller accounts
CREATE POLICY "Users can manage own seller accounts" ON public.seller_accounts 
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for verification documents
CREATE POLICY "Users can manage own verification documents" ON public.verification_documents 
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for payout requests
CREATE POLICY "Users can manage own payout requests" ON public.payout_requests 
    FOR ALL USING (auth.uid() = seller_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.escrow_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payout_requests TO authenticated;
