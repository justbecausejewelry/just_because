ALTER TABLE public."Order"
  ADD COLUMN IF NOT EXISTS "trackingNumber" text,
  ADD COLUMN IF NOT EXISTS "carrier" text,
  ADD COLUMN IF NOT EXISTS "trackingUrl" text,
  ADD COLUMN IF NOT EXISTS "estimatedDelivery" date,
  ADD COLUMN IF NOT EXISTS "shippedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "deliveredAt" timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Order_carrier_check'
  ) THEN
    ALTER TABLE public."Order"
      ADD CONSTRAINT "Order_carrier_check"
      CHECK (
        "carrier" IS NULL OR
        "carrier" IN ('fedex', 'ups', 'usps', 'dhl', 'other')
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.order_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id text REFERENCES public."Order"(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text,
  tracking_number text,
  carrier text,
  tracking_url text,
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'system'
);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own order events" ON public.order_events;
CREATE POLICY "Users see own order events"
  ON public.order_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public."Order" o
      WHERE o.id = order_events.order_id
      AND o."userId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Admins full access order events" ON public.order_events;
CREATE POLICY "Admins full access order events"
  ON public.order_events FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public."AdminUser"
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS order_events_order_id_created_at_idx
  ON public.order_events(order_id, created_at);
