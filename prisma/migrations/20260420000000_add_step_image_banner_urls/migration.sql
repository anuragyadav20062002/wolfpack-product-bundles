-- AlterTable: add step icon image URL and per-step banner image URL to BundleStep
-- IF NOT EXISTS guards against re-runs on DBs where db push already applied these columns
ALTER TABLE "BundleStep" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "BundleStep" ADD COLUMN IF NOT EXISTS "bannerImageUrl" TEXT;
