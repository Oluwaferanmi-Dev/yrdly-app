# Yrdly App Database Migration Guide

This directory contains organized SQL migration files for the Yrdly app database schema. The original 1,600+ line schema has been broken down into logical, manageable categories.

## Migration Files

### 1. Core Tables (`01-core-tables.sql`)
- **Users table** - Extended Supabase auth with profile data, onboarding status
- **Posts table** - Multi-purpose content system (General, Event, For Sale, Business)
- **Comments table** - Post comments with reactions system
- **Custom types** - post_category, onboarding_step enums
- **Basic indexes** and RLS policies

### 2. Messaging System (`02-messaging-system.sql`)
- **Conversations table** - Multi-participant chats with different types
- **Messages table** - Individual messages with read status
- **Item chats** - Marketplace-specific conversations
- **Chat messages** - Messages within item chats
- **Comprehensive RLS policies** for messaging security
- **Note**: Business messages moved to migration 03 to avoid dependency issues

### 3. Business & Marketplace (`03-business-marketplace.sql`)
- **Businesses table** - Business profiles with ratings and contact info
- **Catalog items** - Business product listings
- **Business reviews** - Rating and review system
- **Business messages** - Business-specific messaging (moved from migration 02)
- **Foreign key constraints** - Adds business_id constraint to conversations table
- **RLS policies** for business management

### 4. Escrow & Payments (`04-escrow-payments.sql`)
- **Escrow transactions** - Payment processing with status tracking
- **Seller accounts** - Payment method management
- **Verification documents** - Identity verification system
- **Payout requests** - Seller payout management
- **Custom types** - escrow_status, payment_method, etc.

### 5. Social Features (`05-social-features.sql`)
- **Friend requests** - Friend management system
- **Notifications** - Comprehensive notification system
- **Push subscriptions** - Push notification management
- **Notification stats view** - Aggregated notification data

### 6. Storage Buckets (`06-storage-buckets.sql`)
- **Storage bucket creation** - post-images, chat-images, user-avatars
- **RLS policies** for file upload/access
- **File type restrictions** - Including HEIC/HEIF support

### 7. Functions & Triggers (`07-functions-triggers.sql`)
- **Conversation management** - Auto-update last message
- **Notification functions** - Create, mark read, clear notifications
- **Message read tracking** - Mark messages as read
- **Updated_at triggers** - Automatic timestamp updates
- **Security definer functions** with proper permissions

### 8. Real-time & Performance (`08-realtime-performance.sql`)
- **Real-time subscriptions** - Enable live updates for all tables
- **Performance indexes** - GIN indexes for arrays and JSONB
- **Composite indexes** - Multi-column indexes for common queries
- **Partial indexes** - Optimized indexes for specific conditions
- **Text search indexes** - Full-text search capabilities

## Migration Order

Run these migrations in the exact order listed above (01 through 08). Each migration builds upon the previous ones and includes all necessary dependencies.

## Key Features

- **Row Level Security (RLS)** - Comprehensive security policies
- **Real-time subscriptions** - Live updates for messaging and notifications
- **File storage** - Organized buckets with proper access controls
- **Geographic data** - Location support with PostGIS
- **Escrow system** - Secure payment processing
- **Multi-step verification** - Identity and account verification
- **Performance optimized** - Extensive indexing strategy

## Usage

1. Create a new Supabase project
2. Run each migration file in order using the Supabase SQL Editor
3. Verify all tables, functions, and policies are created correctly
4. Test the RLS policies and real-time subscriptions

## Notes

- All migrations use `IF NOT EXISTS` and `IF EXISTS` clauses for safety
- Functions are created with `SECURITY DEFINER` where appropriate
- Comprehensive error handling and rollback capabilities
- All tables include proper foreign key constraints and cascading deletes
