-- Enterprise discount-code system for Just Because.
-- Additive migration: keeps the existing DiscountCode and DiscountCodeUsage
-- tables, then layers targeting, audit, attempts, snapshots, and atomic usage.

ALTER TABLE public."DiscountCode"
  ADD COLUMN IF NOT EXISTS "startDate" timestamptz,
  ADD COLUMN IF NOT EXISTS "minItemCount" integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "maxDiscountAmount" numeric(10,2),
  ADD COLUMN IF NOT EXISTS "appliesTo" text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS "applicableProductIds" uuid[],
  ADD COLUMN IF NOT EXISTS "applicableCategories" text[],
  ADD COLUMN IF NOT EXISTS "applicableTypes" text[],
  ADD COLUMN IF NOT EXISTS "excludedProductIds" uuid[],
  ADD COLUMN IF NOT EXISTS "excludeSaleItems" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "canStackWithOthers" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "freeShipping" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "freeGift" jsonb,
  ADD COLUMN IF NOT EXISTS "customerSegment" text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS "specificEmails" text[],
  ADD COLUMN IF NOT EXISTS "minCustomerLifetimeValue" numeric(10,2),
  ADD COLUMN IF NOT EXISTS "countryRestrictions" text[],
  ADD COLUMN IF NOT EXISTS "campaignSource" text,
  ADD COLUMN IF NOT EXISTS "internalNotes" text,
  ADD COLUMN IF NOT EXISTS "createdBy" uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS "lastModifiedBy" uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS "isArchived" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "archivedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "currentUses" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalRevenueImpact" numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "tierThresholds" jsonb,
  ADD COLUMN IF NOT EXISTS "pausedForFraud" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "fraudReason" text;

ALTER TABLE public."DiscountCode"
  ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NOT NULL DEFAULT now();

UPDATE public."DiscountCode"
SET "currentUses" = COALESCE("currentUses", "usedCount", 0)
WHERE "currentUses" IS NULL OR "currentUses" = 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'discount_code_applies_to_check'
  ) THEN
    ALTER TABLE public."DiscountCode"
      ADD CONSTRAINT discount_code_applies_to_check
      CHECK ("appliesTo" IN ('all', 'specific_products', 'specific_categories', 'specific_types'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'discount_code_customer_segment_check'
  ) THEN
    ALTER TABLE public."DiscountCode"
      ADD CONSTRAINT discount_code_customer_segment_check
      CHECK ("customerSegment" IN ('all', 'new', 'returning', 'vip', 'win_back', 'specific_emails'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'discount_code_type_check'
  ) THEN
    ALTER TABLE public."DiscountCode"
      ADD CONSTRAINT discount_code_type_check
      CHECK (type IN ('percentage', 'fixed', 'free_shipping', 'free_gift'));
  END IF;
END $$;

ALTER TABLE public."Order"
  ADD COLUMN IF NOT EXISTS "discountCode" text,
  ADD COLUMN IF NOT EXISTS "discountCodeId" text REFERENCES public."DiscountCode"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "discountSnapshot" jsonb;

CREATE TABLE IF NOT EXISTS public."DiscountCodeAuditLog" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "discountCodeId" text NOT NULL REFERENCES public."DiscountCode"(id) ON DELETE CASCADE,
  "userId" uuid REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('created', 'modified', 'activated', 'deactivated', 'archived', 'restored')),
  "oldValues" jsonb,
  "newValues" jsonb,
  "ipAddress" text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."DiscountCodeAttempts" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "codeAttempted" text NOT NULL,
  "userId" uuid REFERENCES auth.users(id),
  "ipAddress" text NOT NULL,
  "wasValid" boolean NOT NULL,
  "attemptedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."CartDiscount" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "discountCodeId" text REFERENCES public."DiscountCode"(id) ON DELETE SET NULL,
  code text NOT NULL,
  "discountSnapshot" jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("userId")
);

CREATE INDEX IF NOT EXISTS idx_attempts_ip_time
  ON public."DiscountCodeAttempts" ("ipAddress", "attemptedAt");

CREATE INDEX IF NOT EXISTS idx_attempts_user_time
  ON public."DiscountCodeAttempts" ("userId", "attemptedAt");

CREATE INDEX IF NOT EXISTS idx_discount_audit_code_time
  ON public."DiscountCodeAuditLog" ("discountCodeId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_discount_usage_code_time
  ON public."DiscountCodeUsage" ("discountCodeId", "usedAt" DESC);

ALTER TABLE public."DiscountCodeAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DiscountCodeAttempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CartDiscount" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_manage_discount_audit_logs" ON public."DiscountCodeAuditLog";
CREATE POLICY "admins_manage_discount_audit_logs"
  ON public."DiscountCodeAuditLog" FOR ALL TO authenticated
  USING (public.is_current_admin())
  WITH CHECK (public.is_current_admin());

DROP POLICY IF EXISTS "admins_read_discount_attempts" ON public."DiscountCodeAttempts";
CREATE POLICY "admins_read_discount_attempts"
  ON public."DiscountCodeAttempts" FOR SELECT TO authenticated
  USING (public.is_current_admin());

DROP POLICY IF EXISTS "users_manage_own_cart_discount" ON public."CartDiscount";
CREATE POLICY "users_manage_own_cart_discount"
  ON public."CartDiscount" FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

DROP FUNCTION IF EXISTS public.check_discount_availability(uuid);
DROP FUNCTION IF EXISTS public.check_discount_availability(text);
CREATE OR REPLACE FUNCTION public.check_discount_availability(code_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  available boolean;
BEGIN
  SELECT (
    COALESCE("isActive", false) = true
    AND COALESCE("isArchived", false) = false
    AND COALESCE("pausedForFraud", false) = false
    AND ("maxUses" IS NULL OR COALESCE("currentUses", "usedCount", 0) < "maxUses")
  )
  INTO available
  FROM public."DiscountCode"
  WHERE id = code_id
  FOR UPDATE;

  RETURN COALESCE(available, false);
END;
$$;

DROP FUNCTION IF EXISTS public.increment_discount_usage(uuid);
DROP FUNCTION IF EXISTS public.increment_discount_usage(text);
DROP FUNCTION IF EXISTS public.increment_discount_usage(uuid, uuid, uuid, numeric);
DROP FUNCTION IF EXISTS public.increment_discount_usage(text, uuid, text, numeric);
CREATE OR REPLACE FUNCTION public.increment_discount_usage(
  code_id text,
  user_id uuid,
  order_id text,
  amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public."DiscountCode"
  SET
    "currentUses" = COALESCE("currentUses", 0) + 1,
    "usedCount" = COALESCE("usedCount", 0) + 1,
    "totalRevenueImpact" = COALESCE("totalRevenueImpact", 0) + COALESCE(amount, 0),
    "updatedAt" = now()
  WHERE id = code_id;

  INSERT INTO public."DiscountCodeUsage" (
    "discountCodeId", "userId", "orderId", "discountAmount"
  ) VALUES (
    code_id, user_id, order_id, COALESCE(amount, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_discount_availability(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_discount_usage(text, uuid, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_discount_availability(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_discount_usage(text, uuid, text, numeric) TO authenticated;
