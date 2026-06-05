CREATE TABLE IF NOT EXISTS public.return_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id text REFERENCES public."Order"(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number text,
  customer_name text,
  customer_email text,
  item_name text,
  item_price numeric,
  reason text NOT NULL CHECK (reason IN (
    'wrong_size',
    'not_as_expected',
    'damaged_defective',
    'changed_mind',
    'wrong_item_received',
    'quality_issue'
  )),
  reason_details text,
  photos text[],
  status text DEFAULT 'requested' CHECK (status IN (
    'requested',
    'under_review',
    'approved',
    'rejected',
    'item_received',
    'refunded',
    'closed'
  )),
  authorization_number text UNIQUE,
  admin_notes text,
  rejection_reason text,
  refund_amount numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  received_at timestamptz,
  refunded_at timestamptz
);

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own returns" ON public.return_requests;
CREATE POLICY "Users see own returns"
  ON public.return_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create returns" ON public.return_requests;
CREATE POLICY "Users can create returns"
  ON public.return_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins full access" ON public.return_requests;
CREATE POLICY "Admins full access"
  ON public.return_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public."AdminUser"
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE OR REPLACE FUNCTION public.update_return_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS return_requests_updated_at ON public.return_requests;
CREATE TRIGGER return_requests_updated_at
  BEFORE UPDATE ON public.return_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_return_timestamp();

