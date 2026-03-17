-- AlterTable: Add free gift and default product fields to BundleStep
ALTER TABLE "BundleStep" ADD COLUMN "isFreeGift" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BundleStep" ADD COLUMN "freeGiftName" TEXT;
ALTER TABLE "BundleStep" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BundleStep" ADD COLUMN "defaultVariantId" TEXT;
