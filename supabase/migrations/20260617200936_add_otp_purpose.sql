-- Add purpose column to email_otps for distinguishing
-- signup verification from password reset OTPs
ALTER TABLE public.email_otps
ADD COLUMN IF NOT EXISTS purpose text NOT NULL
DEFAULT 'email_verification';

-- Index for fast lookups by email + purpose
CREATE INDEX IF NOT EXISTS idx_email_otps_email_purpose
  ON public.email_otps (email, purpose);
