CREATE TYPE "StorefrontSyncStatus" AS ENUM ('queued', 'syncing', 'synced', 'failed');

ALTER TABLE "Bundle"
  ADD COLUMN "storefrontSyncStatus" "StorefrontSyncStatus" NOT NULL DEFAULT 'synced',
  ADD COLUMN "storefrontSyncQueuedAt" TIMESTAMP(3),
  ADD COLUMN "storefrontSyncStartedAt" TIMESTAMP(3),
  ADD COLUMN "storefrontSyncedAt" TIMESTAMP(3),
  ADD COLUMN "storefrontSyncFailedAt" TIMESTAMP(3),
  ADD COLUMN "storefrontSyncLastError" TEXT,
  ADD COLUMN "storefrontSyncAttemptId" TEXT,
  ADD COLUMN "storefrontSyncStats" JSONB;

CREATE INDEX "Bundle_shopId_storefrontSyncStatus_idx" ON "Bundle"("shopId", "storefrontSyncStatus");
