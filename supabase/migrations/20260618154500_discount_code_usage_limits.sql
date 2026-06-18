-- Track per-user discount usage and support first-time-customer offers.

ALTER TABLE public."DiscountCode"
  ADD COLUMN IF NOT EXISTS "maxUsesPerUser" integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "firstTimeOnly" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public."DiscountCodeUsage" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "discountCodeId" uuid NOT NULL REFERENCES public."DiscountCode"(id) ON DELETE CASCADE,
  "userId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "orderId" uuid REFERENCES public."Order"(id) ON DELETE SET NULL,
  "discountAmount" numeric(10,2) NOT NULL,
  "usedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_usage_user_code
  ON public."DiscountCodeUsage" ("userId", "discountCodeId");

CREATE INDEX IF NOT EXISTS idx_discount_usage_order
  ON public."DiscountCodeUsage" ("orderId");

ALTER TABLE public."DiscountCodeUsage" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_manage_discount_usage" ON public."DiscountCodeUsage";
CREATE POLICY "admins_manage_discount_usage"
  ON public."DiscountCodeUsage" FOR ALL TO authenticated
  USING (public.is_current_admin())
  WITH CHECK (public.is_current_admin());

DROP POLICY IF EXISTS "users_read_own_discount_usage" ON public."DiscountCodeUsage";
CREATE POLICY "users_read_own_discount_usage"
  ON public."DiscountCodeUsage" FOR SELECT TO authenticated
  USING ("userId" = auth.uid());

CREATE OR REPLACE FUNCTION public.increment_discount_usage(code_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public."DiscountCode"
  SET "usedCount" = COALESCE("usedCount", 0) + 1
  WHERE id = code_id;
$$;

REVOKE ALL ON FUNCTION public.increment_discount_usage(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_discount_usage(uuid) TO authenticated;
