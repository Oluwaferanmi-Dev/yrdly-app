-- =============================================
-- YRDLY DATABASE SETUP - CORE EXTENSIONS
-- =============================================
-- Run this first to enable required PostgreSQL extensions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================
-- CUSTOM TYPES
-- =============================================

-- Create custom types for the application
CREATE TYPE post_category AS ENUM ('General', 'Event', 'For Sale', 'Business');
CREATE TYPE escrow_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'completed', 'disputed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'mobile_money');
CREATE TYPE delivery_option AS ENUM ('face_to_face', 'partnered_service', 'own_logistics');
CREATE TYPE account_type AS ENUM ('bank_account', 'mobile_money', 'digital_wallet');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');
CREATE TYPE verification_level AS ENUM ('basic', 'bank_account', 'identity', 'address');
CREATE TYPE onboarding_step AS ENUM ('signup', 'email_verification', 'profile_setup', 'welcome', 'tour', 'completed');
