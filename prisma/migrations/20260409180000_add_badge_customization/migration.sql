-- AlterTable: add badge position and included badge fields to DesignSettings
ALTER TABLE "DesignSettings" ADD COLUMN IF NOT EXISTS "freeGiftBadgePosition" TEXT NOT NULL DEFAULT 'top-left';
ALTER TABLE "DesignSettings" ADD COLUMN IF NOT EXISTS "includedBadgeUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DesignSettings" ADD COLUMN IF NOT EXISTS "includedBadgePosition" TEXT NOT NULL DEFAULT 'top-left';
