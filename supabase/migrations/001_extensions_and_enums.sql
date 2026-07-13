CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

DO $$ BEGIN CREATE TYPE member_status AS ENUM ('active', 'inactive', 'blocked', 'left'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE blood_group AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE monthly_tier AS ENUM ('base', 'premium', 'custom', 'flexible'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE pin_status AS ENUM ('not_issued', 'issued', 'reset_required'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_category AS ENUM ('monthly_dues', 'special_event'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('upi', 'qr_code', 'cash_handover', 'admin_cash_entry'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed', 'refunded', 'cancelled', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE cash_entry_status AS ENUM ('received', 'recorded', 'verified', 'disputed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE admin_status AS ENUM ('active', 'inactive'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE admin_role AS ENUM ('super_admin', 'president', 'secretary', 'treasurer', 'collector', 'viewer', 'custom'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE audit_severity AS ENUM ('info', 'warning', 'error', 'critical'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE audit_entity_type AS ENUM ('member', 'payment', 'admin', 'settings', 'storage', 'system'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('payment_reminder', 'event_announcement', 'system_alert'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE storage_visibility AS ENUM ('public', 'private', 'restricted'); EXCEPTION WHEN duplicate_object THEN null; END $$;
