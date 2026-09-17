-- ====================================================================
-- MedEx — Administrator Registration System Migration
-- Enhances users table, introduces admin_profiles and admin_documents
-- for full regulatory administrator registration lifecycle.
--
-- Security: Least-privilege RLS policies applied.
-- Public/anonymous clients have NO access.
-- Documents stored privately; accessible only by admins.
-- Server-side operations executed via service_role.
-- ====================================================================

-- 1. Enhance users table with administrative identity columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS regulatory_authority VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Ensure username uniqueness constraint on users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_users_username'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT uq_users_username UNIQUE (username);
  END IF;
EXCEPTION
  WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2. Dedicated admin_profiles table for regulatory administrative credentials
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE NOT NULL,
  legal_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  regulatory_authority VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  employee_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'suspended', 'revoked')),
  email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_profiles_username ON admin_profiles(username);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_email ON admin_profiles(email);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_status ON admin_profiles(status);

-- 3. Dedicated admin_documents table for regulatory authorization letters
CREATE TABLE IF NOT EXISTS admin_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL DEFAULT 'AUTHORIZATION_LETTER',
  document_name VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size VARCHAR(50),
  file_size_bytes BIGINT,
  mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  document_status VARCHAR(50) NOT NULL DEFAULT 'verified'
    CHECK (document_status IN ('pending', 'verified', 'rejected', 'superseded')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_documents_admin_id ON admin_documents(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_documents_user_id ON admin_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_documents_document_type ON admin_documents(document_type);

-- 4. Row Level Security (RLS) Configuration
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_documents ENABLE ROW LEVEL SECURITY;

-- Clean up any preexisting policies
DROP POLICY IF EXISTS "Service role full access on admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Admins full access on admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Service role full access on admin_documents" ON admin_documents;
DROP POLICY IF EXISTS "Admins full access on admin_documents" ON admin_documents;

-- A. Service Role: Full access for backend registration & management
CREATE POLICY "Service role full access on admin_profiles"
  ON admin_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on admin_documents"
  ON admin_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- B. Platform Admins: View and manage admin records
CREATE POLICY "Admins full access on admin_profiles"
  ON admin_profiles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins full access on admin_documents"
  ON admin_documents
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- (Public and Hospital roles have NO access to admin_profiles or admin_documents)
