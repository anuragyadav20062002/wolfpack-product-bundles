-- Fix drift: add Bundle promo banner image columns (already exist in DB, safe with IF NOT EXISTS)
ALTER TABLE "public"."Bundle" ADD COLUMN IF NOT EXISTS "promoBannerBgImage" TEXT;
ALTER TABLE "public"."Bundle" ADD COLUMN IF NOT EXISTS "promoBannerBgImageCrop" TEXT;

-- Remove dead code: drop showProgressBar from BundlePricing (feature was never active, default false)
ALTER TABLE "public"."BundlePricing" DROP COLUMN IF EXISTS "showProgressBar";
