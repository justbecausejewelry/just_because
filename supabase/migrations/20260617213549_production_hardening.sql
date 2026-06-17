-- Production hardening: RLS, order integrity, duplicate column cleanup, and indexes.

CREATE OR REPLACE FUNCTION public.is_current_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."AdminUser"
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND role IN ('admin', 'super_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_admin() TO authenticated;

-- Canonicalize legacy order data before dropping duplicates.
UPDATE public."Order"
SET
  "isGuest" = COALESCE("isGuest", is_guest, false),
  "guestEmail" = COALESCE("guestEmail", guest_email),
  "guestName" = COALESCE("guestName", guest_name),
  "shippingAmount" = COALESCE("shippingAmount", "shippingCost", 0),
  "taxAmount" = COALESCE("taxAmount", tax, 0),
  "discountAmount" = COALESCE("discountAmount", discount, 0);

UPDATE public."Order"
SET status = 'confirmed'
WHERE status IN ('received', 'in_production');

ALTER TABLE public."Order"
  DROP CONSTRAINT IF EXISTS valid_order_status;

ALTER TABLE public."Order"
  ADD CONSTRAINT valid_order_status
  CHECK (status IN (
    'pending', 'confirmed', 'processing',
    'shipped', 'delivered', 'completed',
    'cancelled', 'refunded'
  ));

ALTER TABLE public."Order"
  DROP CONSTRAINT IF EXISTS order_user_integrity;

ALTER TABLE public."Order"
  DROP CONSTRAINT IF EXISTS order_userid_required_for_non_guest;

ALTER TABLE public."Order"
  DROP CONSTRAINT IF EXISTS order_userid_required;

ALTER TABLE public."Order"
  ADD CONSTRAINT order_user_integrity
  CHECK (
    ("isGuest" = true AND "userId" IS NULL)
    OR ("isGuest" = false AND "userId" IS NOT NULL)
  ) NOT VALID;

ALTER TABLE public."Order" DROP COLUMN IF EXISTS is_guest;
ALTER TABLE public."Order" DROP COLUMN IF EXISTS guest_email;
ALTER TABLE public."Order" DROP COLUMN IF EXISTS guest_name;
ALTER TABLE public."Order" DROP COLUMN IF EXISTS "shippingCost";
ALTER TABLE public."Order" DROP COLUMN IF EXISTS tax;
ALTER TABLE public."Order" DROP COLUMN IF EXISTS discount;

-- RLS enablement.
ALTER TABLE public."AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CartItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ConversationMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Diamond" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DiscountCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PriceLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SavedAddress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserCart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Wishlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

-- Remove overly-broad or legacy policies.
DROP POLICY IF EXISTS "Admins full access" ON public.return_requests;
DROP POLICY IF EXISTS "admin_read_cart_events" ON public.cart_events;
DROP POLICY IF EXISTS "admin_read_page_views" ON public.page_views;
DROP POLICY IF EXISTS "Users can manage own conversations" ON public."Conversation";
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public."ConversationMessage";
DROP POLICY IF EXISTS "Users can manage own addresses" ON public."SavedAddress";
DROP POLICY IF EXISTS "Users can manage own cart" ON public."UserCart";
DROP POLICY IF EXISTS "Users can manage own wishlist" ON public."Wishlist";
DROP POLICY IF EXISTS "Users can insert own profile" ON public."UserProfile";
DROP POLICY IF EXISTS "Users can update own profile" ON public."UserProfile";
DROP POLICY IF EXISTS "Users can view own profile" ON public."UserProfile";
DROP POLICY IF EXISTS "Customers can read own orders" ON public."Order";
DROP POLICY IF EXISTS "Customers can read own order items" ON public."OrderItem";
DROP POLICY IF EXISTS "Public can read diamonds" ON public."Diamond";
DROP POLICY IF EXISTS "Users can check own admin status" ON public."AdminUser";
DROP POLICY IF EXISTS "Admins full access order events" ON public.order_events;
DROP POLICY IF EXISTS "Users see own order events" ON public.order_events;
DROP POLICY IF EXISTS "Users can create returns" ON public.return_requests;
DROP POLICY IF EXISTS "Users see own returns" ON public.return_requests;

-- Admin-owned tables.
CREATE POLICY "admins_manage_admin_users"
  ON public."AdminUser" FOR ALL TO authenticated
  USING (public.is_current_admin())
  WITH CHECK (public.is_current_admin());

CREATE POLICY "admins_manage_discount_codes"
  ON public."DiscountCode" FOR ALL TO authenticated
  USING (public.is_current_admin())
  WITH CHECK (public.is_current_admin());

CREATE POLICY "admins_manage_price_logs"
  ON public."PriceLog" FOR ALL TO authenticated
  USING (public.is_current_admin())
  WITH CHECK (public.is_current_admin());

-- Public catalog reads.
CREATE POLICY "public_read_active_products"
  ON public."Product" FOR SELECT TO anon, authenticated
  USING ("isActive" = true);

CREATE POLICY "public_read_diamonds"
  ON public."Diamond" FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_approved_reviews"
  ON public."Review" FOR SELECT TO anon, authenticated
  USING ("isApproved" = true AND "isHidden" = false);

-- Customer-owned tables.
CREATE POLICY "users_read_own_profile"
  ON public."UserProfile" FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text);

CREATE POLICY "users_insert_own_profile"
  ON public."UserProfile" FOR INSERT TO authenticated
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "users_update_own_profile"
  ON public."UserProfile" FOR UPDATE TO authenticated
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "users_read_own_orders"
  ON public."Order" FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text);

CREATE POLICY "users_insert_own_orders"
  ON public."Order" FOR INSERT TO authenticated
  WITH CHECK ("userId" = auth.uid()::text AND "isGuest" = false);

CREATE POLICY "users_read_own_order_items"
  ON public."OrderItem" FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Order" orders
      WHERE orders.id = "OrderItem"."orderId"
        AND orders."userId" = auth.uid()::text
    )
  );

CREATE POLICY "users_insert_own_order_items"
  ON public."OrderItem" FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Order" orders
      WHERE orders.id = "OrderItem"."orderId"
        AND orders."userId" = auth.uid()::text
    )
  );

CREATE POLICY "users_manage_own_cart"
  ON public."UserCart" FOR ALL TO authenticated
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "users_manage_own_wishlist"
  ON public."Wishlist" FOR ALL TO authenticated
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "users_manage_own_addresses"
  ON public."SavedAddress" FOR ALL TO authenticated
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "users_manage_own_conversations"
  ON public."Conversation" FOR ALL TO authenticated
  USING ("customerId" = auth.uid()::text)
  WITH CHECK ("customerId" = auth.uid()::text);

CREATE POLICY "users_read_own_conversation_messages"
  ON public."ConversationMessage" FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Conversation" conversations
      WHERE conversations.id = "ConversationMessage"."conversationId"
        AND conversations."customerId" = auth.uid()::text
    )
  );

CREATE POLICY "users_insert_own_conversation_messages"
  ON public."ConversationMessage" FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Conversation" conversations
      WHERE conversations.id = "ConversationMessage"."conversationId"
        AND conversations."customerId" = auth.uid()::text
    )
  );

CREATE POLICY "users_read_own_order_events"
  ON public.order_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Order" orders
      WHERE orders.id = order_events.order_id
        AND orders."userId" = auth.uid()::text
    )
  );

CREATE POLICY "users_create_own_returns"
  ON public.return_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_read_own_returns"
  ON public.return_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admins_manage_returns"
  ON public.return_requests FOR ALL TO authenticated
  USING (public.is_current_admin())
  WITH CHECK (public.is_current_admin());

CREATE POLICY "admins_manage_order_events"
  ON public.order_events FOR ALL TO authenticated
  USING (public.is_current_admin())
  WITH CHECK (public.is_current_admin());

-- email_otps and legacy CartItem intentionally have no client policies.
-- They are service-role only through API routes.

-- Indexes for common query paths.
CREATE INDEX IF NOT EXISTS idx_order_userid
  ON public."Order" ("userId");

CREATE INDEX IF NOT EXISTS idx_order_customeremail
  ON public."Order" ("customerEmail");

CREATE INDEX IF NOT EXISTS idx_order_customer_email_lower
  ON public."Order" (lower("customerEmail"));

CREATE INDEX IF NOT EXISTS idx_orderitem_orderid
  ON public."OrderItem" ("orderId");

CREATE INDEX IF NOT EXISTS idx_product_active_type
  ON public."Product" ("isActive", "productType");

CREATE INDEX IF NOT EXISTS idx_diamond_shape_carat
  ON public."Diamond" (shape, carat);

CREATE INDEX IF NOT EXISTS idx_email_otps_lookup
  ON public.email_otps (email, purpose, expires_at)
  WHERE used = false;
