CREATE TABLE IF NOT EXISTS "SystemLog" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "type" text NOT NULL,
  "status" text NOT NULL,
  "message" text,
  "metadata" jsonb DEFAULT '{}',
  "createdAt" timestamptz DEFAULT now()
);

ALTER TABLE "SystemLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages system logs" ON "SystemLog";
CREATE POLICY "Service role manages system logs"
ON "SystemLog" FOR ALL USING (true);
