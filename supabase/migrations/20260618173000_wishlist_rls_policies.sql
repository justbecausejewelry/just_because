-- Ensure authenticated customers can persist and manage their own wishlist rows.

ALTER TABLE public."Wishlist" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_wishlist" ON public."Wishlist";
DROP POLICY IF EXISTS "users_insert_own_wishlist" ON public."Wishlist";
DROP POLICY IF EXISTS "users_read_own_wishlist" ON public."Wishlist";
DROP POLICY IF EXISTS "users_delete_own_wishlist" ON public."Wishlist";

CREATE POLICY "users_insert_own_wishlist"
  ON public."Wishlist" FOR INSERT
  TO authenticated
  WITH CHECK ("userId"::uuid = auth.uid());

CREATE POLICY "users_read_own_wishlist"
  ON public."Wishlist" FOR SELECT
  TO authenticated
  USING ("userId"::uuid = auth.uid());

CREATE POLICY "users_delete_own_wishlist"
  ON public."Wishlist" FOR DELETE
  TO authenticated
  USING ("userId"::uuid = auth.uid());
