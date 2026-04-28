-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN "showProductPrices" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Bundle" ADD COLUMN "showCompareAtPrices" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Bundle" ADD COLUMN "cartRedirectToCheckout" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Bundle" ADD COLUMN "allowQuantityChanges" BOOLEAN NOT NULL DEFAULT true;
