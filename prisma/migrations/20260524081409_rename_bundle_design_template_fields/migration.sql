/*
  Warnings:

  - You are about to drop the column `wpbLayoutTemplate` on the `Bundle` table. All the data in the column will be lost.
  - You are about to drop the column `wpbPresetId` on the `Bundle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bundle" DROP COLUMN "wpbLayoutTemplate",
DROP COLUMN "wpbPresetId",
ADD COLUMN     "bundleDesignPresetId" TEXT,
ADD COLUMN     "bundleDesignTemplate" TEXT;
