CREATE TABLE IF NOT EXISTS "EmailOTP" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "email" text NOT NULL,
  "code" text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "used" boolean DEFAULT false,
  "createdAt" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "EmailOTP_email_code_active_idx"
ON "EmailOTP" ("email", "code", "used", "expiresAt");

CREATE INDEX IF NOT EXISTS "EmailOTP_email_createdAt_idx"
ON "EmailOTP" ("email", "createdAt");
