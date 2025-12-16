/*
  Warnings:

  - You are about to drop the column `active` on the `Bundle` table. All the data in the column will be lost.
  - You are about to drop the column `matching` on the `Bundle` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `Bundle` table. All the data in the column will be lost.
  - You are about to drop the column `settings` on the `Bundle` table. All the data in the column will be lost.
  - You are about to drop the column `productCategory` on the `BundleStep` table. All the data in the column will be lost.
  - You are about to drop the column `imagesSettings` on the `DesignSettings` table. All the data in the column will be lost.
  - You are about to drop the column `test` on the `Subscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Bundle" DROP COLUMN "active",
DROP COLUMN "matching",
DROP COLUMN "publishedAt",
DROP COLUMN "settings";

-- AlterTable
ALTER TABLE "public"."BundleStep" DROP COLUMN "productCategory";

-- AlterTable
ALTER TABLE "public"."DesignSettings" DROP COLUMN "imagesSettings",
ADD COLUMN     "globalColorsSettings" JSONB;

-- AlterTable
ALTER TABLE "public"."Subscription" DROP COLUMN "test";

-- DropTable
DROP TABLE IF EXISTS "public"."ShopSettings";
