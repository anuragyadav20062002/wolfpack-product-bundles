-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN "defaultProductsData" JSONB;
ALTER TABLE "Bundle" ADD COLUMN "boxSelection" JSONB;
ALTER TABLE "Bundle" ADD COLUMN "bundleUpsellConfig" JSONB;
ALTER TABLE "Bundle" ADD COLUMN "bundleTextConfig" JSONB;
ALTER TABLE "Bundle" ADD COLUMN "discountDisplayOverride" JSONB;
ALTER TABLE "Bundle" ADD COLUMN "individualSellingPlanSelection" JSONB;
ALTER TABLE "Bundle" ADD COLUMN "validateQuantityPerProduct" JSONB;
ALTER TABLE "Bundle" ADD COLUMN "useSingleStepCategoriesAsBundleSteps" BOOLEAN NOT NULL DEFAULT false;
