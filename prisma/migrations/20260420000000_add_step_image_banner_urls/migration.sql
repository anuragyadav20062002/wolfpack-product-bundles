-- AlterTable: add step icon image URL and per-step banner image URL to BundleStep
ALTER TABLE "BundleStep" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "BundleStep" ADD COLUMN "bannerImageUrl" TEXT;
