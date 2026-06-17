-- Keep non-guest orders tied to an authenticated account.
-- Historical rows created before the checkout auth wall are backfilled by
-- matching the order email to the customer profile email where possible.
UPDATE public."Order" AS orders
SET "userId" = profiles."userId"
FROM public."UserProfile" AS profiles
WHERE orders."userId" IS NULL
  AND COALESCE(orders."isGuest", false) = false
  AND COALESCE(orders.is_guest, false) = false
  AND profiles."userId" IS NOT NULL
  AND lower(orders."customerEmail") = lower(profiles.email);

ALTER TABLE public."Order"
  ADD CONSTRAINT order_userid_required_for_non_guest
  CHECK (
    (
      (COALESCE("isGuest", false) = true OR COALESCE(is_guest, false) = true)
      AND "userId" IS NULL
    )
    OR "userId" IS NOT NULL
  ) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_order_user_id
  ON public."Order" ("userId");

CREATE INDEX IF NOT EXISTS idx_order_customer_email_lower
  ON public."Order" (lower("customerEmail"));

ALTER TABLE public."Order" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can read own orders" ON public."Order";
CREATE POLICY "Customers can read own orders"
  ON public."Order"
  FOR SELECT
  TO authenticated
  USING (
    "userId" = auth.uid()::text
    OR lower("customerEmail") = lower(auth.jwt() ->> 'email')
  );

ALTER TABLE public."OrderItem" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can read own order items" ON public."OrderItem";
CREATE POLICY "Customers can read own order items"
  ON public."OrderItem"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."Order" AS orders
      WHERE orders.id = "OrderItem"."orderId"
        AND (
          orders."userId" = auth.uid()::text
          OR lower(orders."customerEmail") = lower(auth.jwt() ->> 'email')
        )
    )
  );

DO $$
BEGIN
  IF to_regclass('public."Wishlist"') IS NOT NULL
    AND to_regclass('public."Product"') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'wishlist_product_fk'
        AND conrelid = to_regclass('public."Wishlist"')
    ) THEN
    ALTER TABLE public."Wishlist"
      ADD CONSTRAINT wishlist_product_fk
      FOREIGN KEY ("productId")
      REFERENCES public."Product"(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;
