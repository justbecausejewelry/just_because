CREATE TABLE IF NOT EXISTS "RingSetting" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text NOT NULL,
  "style" text,
  "description" text,
  "basePrice" decimal(10,2) NOT NULL DEFAULT 0,
  "metals" text[] DEFAULT ARRAY['White Gold','Yellow Gold','Rose Gold','Platinum'],
  "compatibleShapes" text[] DEFAULT ARRAY[]::text[],
  "imageUrl" text,
  "images" jsonb DEFAULT '{}',
  "isActive" boolean DEFAULT true,
  "sortOrder" integer DEFAULT 0,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

ALTER TABLE "RingSetting" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active settings" ON "RingSetting";
CREATE POLICY "Public can view active settings"
ON "RingSetting" FOR SELECT USING ("isActive" = true);

DROP POLICY IF EXISTS "Service role manages settings" ON "RingSetting";
CREATE POLICY "Service role manages settings"
ON "RingSetting" FOR ALL USING (true);
