ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "isBestSeller" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "isNewArrival" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "isGift" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "collections" text[] DEFAULT '{}';
