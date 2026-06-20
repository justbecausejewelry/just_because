-- Make discount usage consumption atomic.
-- Validation is helpful for UX, but checkout must re-check limits while
-- consuming the usage so simultaneous orders cannot overrun max uses.

DROP FUNCTION IF EXISTS public.increment_discount_usage(text, uuid, text, numeric);

CREATE OR REPLACE FUNCTION public.increment_discount_usage(
  code_id text,
  user_id uuid,
  order_id text,
  amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  discount_record public."DiscountCode"%ROWTYPE;
  existing_user_uses integer;
BEGIN
  SELECT *
  INTO discount_record
  FROM public."DiscountCode"
  WHERE id = code_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF COALESCE(discount_record."isActive", false) = false
    OR COALESCE(discount_record."isArchived", false) = true
    OR COALESCE(discount_record."pausedForFraud", false) = true THEN
    RETURN false;
  END IF;

  IF discount_record."maxUses" IS NOT NULL
    AND COALESCE(discount_record."currentUses", discount_record."usedCount", 0) >= discount_record."maxUses" THEN
    RETURN false;
  END IF;

  IF discount_record."maxUsesPerUser" IS NOT NULL THEN
    SELECT COUNT(*)
    INTO existing_user_uses
    FROM public."DiscountCodeUsage"
    WHERE "discountCodeId" = code_id
      AND "userId" = user_id;

    IF COALESCE(existing_user_uses, 0) >= discount_record."maxUsesPerUser" THEN
      RETURN false;
    END IF;
  END IF;

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

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_discount_usage(text, uuid, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_discount_usage(text, uuid, text, numeric) TO authenticated;
