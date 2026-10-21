-- Caracterización de Juventudes MIRA Cali
-- Database Schema for Supabase (Safe to execute multiple times)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing (Optional, use with caution in production)
-- DROP TABLE IF EXISTS characterization_records CASCADE;
-- DROP TABLE IF EXISTS admin_users CASCADE;

-- Tables
CREATE TABLE IF NOT EXISTS characterization_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT NOT NULL,
  military_status TEXT,
  guardian_relationship TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  commune TEXT NOT NULL,
  education_level TEXT NOT NULL,
  study_area TEXT[] NOT NULL,
  is_working BOOLEAN DEFAULT false,
  profession TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  registration_source TEXT NOT NULL,
  church_headquarters TEXT,
  is_infomira_subscribed BOOLEAN DEFAULT false,
  is_entrepreneur BOOLEAN DEFAULT false,
  entrepreneur_name TEXT,
  is_in_organization BOOLEAN DEFAULT false,
  organization_name TEXT,
  interests TEXT[] NOT NULL,
  talents TEXT,
  open_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Admin Roles table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Admin Editor', 'Admin Viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security)
ALTER TABLE characterization_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policies for characterization_records
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public insert" ON characterization_records;
    DROP POLICY IF EXISTS "Admins can read" ON characterization_records;
    DROP POLICY IF EXISTS "Admins can update" ON characterization_records;
    DROP POLICY IF EXISTS "Admins can delete" ON characterization_records;
END $$;

CREATE POLICY "Public insert" ON characterization_records FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read" ON characterization_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

CREATE POLICY "Admins can update" ON characterization_records FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('Super Admin', 'Admin Editor'))
);

CREATE POLICY "Admins can delete" ON characterization_records FOR DELETE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'Super Admin')
);

-- Policies for admin_users
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow select for all" ON admin_users;
    DROP POLICY IF EXISTS "Admins can see other admins" ON admin_users;
END $$;

-- This policy avoids recursion by allowing all authenticated users (and public) to read admin list
-- It is the simplest way to allow policy-based role checks without triggering infinite loops
CREATE POLICY "Allow select for all" ON admin_users FOR SELECT USING (true);

-- Functions
-- (Any future functions here)

