/*
  Warnings:

  - Made the column `productTitleVisibility` on table `DesignSettings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."DesignSettings" ADD COLUMN     "themeColors" JSONB,
ALTER COLUMN "productTitleVisibility" SET NOT NULL,
ALTER COLUMN "variantSelectorBgColor" SET DATA TYPE TEXT,
ALTER COLUMN "variantSelectorTextColor" SET DATA TYPE TEXT;
