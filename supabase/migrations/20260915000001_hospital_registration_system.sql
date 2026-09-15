-- ====================================================================
-- MedEx — Hospital Registration System Migration
-- Enhances hospitals, hospital_documents, introduces hospital_campuses
-- and email_verifications for OTP verification lifecycle.
--
-- Security: Least-privilege RLS policies applied.
-- No sensitive OTP verification data is exposed to public/anonymous clients.
-- Campus records are restricted to respective hospital owners and platform admins.
-- Server-side operations via service_role bypass or explicit policies.
-- ====================================================================

-- 1. Enhance hospitals table with registration Step 1 & Step 2 fields
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS issuing_authority VARCHAR(255);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS organization_type VARCHAR(100);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS receiving_gate VARCHAR(255);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Update hospitals status check constraint to include all workflow states
ALTER TABLE hospitals DROP CONSTRAINT IF EXISTS hospitals_status_check;
ALTER TABLE hospitals ADD CONSTRAINT hospitals_status_check CHECK (
  status IN (
    'draft',
    'pending_approval',
    'approved',
    'requires_correction',
    'rejected',
    'suspended',
    'REGISTERED',
    'PENDING_APPROVAL',
    'ADMIN_REVIEW',
    'APPROVED',
    'REJECTED',
    'SUSPENDED',
    'pending',
    'under_review',
    'verified'
  )
);

-- 2. Multi-Campus Architecture: hospital_campuses table
CREATE TABLE IF NOT EXISTS hospital_campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  campus_name VARCHAR(255) NOT NULL DEFAULT 'Main Campus',
  is_primary BOOLEAN NOT NULL DEFAULT true,
  address TEXT NOT NULL,
  state VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  receiving_gate VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_hospital_campuses_hospital_id UNIQUE (hospital_id)
);

-- Ensure unique constraint exists on hospital_id for ON CONFLICT (hospital_id) upserts,
-- and safely handle existing databases where hospital_campuses was already created without the constraint.
DO $$
BEGIN
  -- Deduplicate hospital_campuses keeping the latest updated record per hospital_id if any duplicates exist
  DELETE FROM hospital_campuses a USING hospital_campuses b
  WHERE a.hospital_id = b.hospital_id
    AND (a.updated_at < b.updated_at OR (a.updated_at = b.updated_at AND a.ctid < b.ctid));

  -- Drop legacy non-unique index if present to avoid redundant indexing once unique constraint is active
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'hospital_campuses' 
      AND indexname = 'idx_hospital_campuses_hospital_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'idx_hospital_campuses_hospital_id'
  ) THEN
    DROP INDEX IF EXISTS idx_hospital_campuses_hospital_id;
  END IF;

  -- Add unique constraint if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'hospital_campuses'::regclass
      AND conname = 'uq_hospital_campuses_hospital_id'
  ) THEN
    ALTER TABLE hospital_campuses ADD CONSTRAINT uq_hospital_campuses_hospital_id UNIQUE (hospital_id);
  END IF;
EXCEPTION
  WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_hospital_campuses_city ON hospital_campuses(city);
CREATE INDEX IF NOT EXISTS idx_hospital_campuses_state ON hospital_campuses(state);

-- 3. Enhance hospital_documents with statutory metadata fields
ALTER TABLE hospital_documents ADD COLUMN IF NOT EXISTS document_number VARCHAR(150);
ALTER TABLE hospital_documents ADD COLUMN IF NOT EXISTS issuing_authority VARCHAR(255);
ALTER TABLE hospital_documents ADD COLUMN IF NOT EXISTS issue_date DATE;
ALTER TABLE hospital_documents ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE hospital_documents ADD COLUMN IF NOT EXISTS custom_document_name VARCHAR(255);

-- 4. Email OTP Verification lifecycle table
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);

-- 5. Helper Functions for RLS Policies (Security Definer)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_hospital_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT hospital_id FROM users
    WHERE id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Row Level Security (RLS) Configuration

-- Enable RLS
ALTER TABLE hospital_campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Clean up legacy or overly permissive policies if previously created
DROP POLICY IF EXISTS "Allow public insert email_verifications" ON email_verifications;
DROP POLICY IF EXISTS "Allow service/authenticated read email_verifications" ON email_verifications;
DROP POLICY IF EXISTS "Allow public select campuses" ON hospital_campuses;
DROP POLICY IF EXISTS "Allow authenticated manage campuses" ON hospital_campuses;
DROP POLICY IF EXISTS "Service role full access on email_verifications" ON email_verifications;
DROP POLICY IF EXISTS "Admins read email_verifications" ON email_verifications;
DROP POLICY IF EXISTS "Service role full access on hospital_campuses" ON hospital_campuses;
DROP POLICY IF EXISTS "Admins full access on hospital_campuses" ON hospital_campuses;
DROP POLICY IF EXISTS "Hospitals manage own campuses" ON hospital_campuses;
DROP POLICY IF EXISTS "Authenticated users view approved hospital campuses" ON hospital_campuses;

-- --------------------------------------------------------------------
-- Least-Privilege Policies: email_verifications
-- --------------------------------------------------------------------
-- A. Service Role: Full access for backend OTP services
CREATE POLICY "Service role full access on email_verifications"
  ON email_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- B. Platform Admins: Read-only access for audit/security inspection
CREATE POLICY "Admins read email_verifications"
  ON email_verifications
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- (Public/anonymous users and regular authenticated users have NO access.
--  All OTP requests are handled securely server-side via the backend API.)

-- --------------------------------------------------------------------
-- Least-Privilege Policies: hospital_campuses
-- --------------------------------------------------------------------
-- A. Service Role: Full access for server-side persistence & registration
CREATE POLICY "Service role full access on hospital_campuses"
  ON hospital_campuses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- B. Platform Admins: Full administrative access
CREATE POLICY "Admins full access on hospital_campuses"
  ON hospital_campuses
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- C. Hospital Users: Manage only campuses belonging to their own hospital
CREATE POLICY "Hospitals manage own campuses"
  ON hospital_campuses
  FOR ALL
  TO authenticated
  USING (hospital_id = get_user_hospital_id())
  WITH CHECK (hospital_id = get_user_hospital_id());

-- D. Authenticated Directory: View campuses of approved/verified hospitals only
CREATE POLICY "Authenticated users view approved hospital campuses"
  ON hospital_campuses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals h
      WHERE h.id = hospital_campuses.hospital_id
        AND h.status IN ('APPROVED', 'approved', 'verified')
    )
  );

-- (Public/anonymous clients have NO read or write access to campus records.)
