-- AlterTable: Add globalColorsSettings and remove imagesSettings
ALTER TABLE "DesignSettings" ADD COLUMN "globalColorsSettings" JSONB;
ALTER TABLE "DesignSettings" DROP COLUMN IF EXISTS "imagesSettings";
