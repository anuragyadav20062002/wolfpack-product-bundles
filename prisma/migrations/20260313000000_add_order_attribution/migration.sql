-- CreateTable (IF NOT EXISTS: safe to run against DBs that already have this table via db push)
CREATE TABLE IF NOT EXISTS "OrderAttribution" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "bundleId" TEXT,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "landingPage" TEXT,
    "revenue" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderAttribution_shopId_idx" ON "OrderAttribution"("shopId");
CREATE INDEX IF NOT EXISTS "OrderAttribution_shopId_createdAt_idx" ON "OrderAttribution"("shopId", "createdAt");
CREATE INDEX IF NOT EXISTS "OrderAttribution_bundleId_idx" ON "OrderAttribution"("bundleId");
CREATE INDEX IF NOT EXISTS "OrderAttribution_bundleId_createdAt_idx" ON "OrderAttribution"("bundleId", "createdAt");
CREATE INDEX IF NOT EXISTS "OrderAttribution_orderId_idx" ON "OrderAttribution"("orderId");
CREATE INDEX IF NOT EXISTS "OrderAttribution_utmSource_idx" ON "OrderAttribution"("utmSource");
CREATE INDEX IF NOT EXISTS "OrderAttribution_utmCampaign_idx" ON "OrderAttribution"("utmCampaign");
