-- Add cached Shopify Shop GID for Shopify App Events.
ALTER TABLE "Shop" ADD COLUMN "shopifyShopGid" TEXT;

-- Append-only canonical WPB business events with optional Shopify App Events delivery metadata.
CREATE TABLE "BusinessEvent" (
    "id" TEXT NOT NULL,
    "eventHandle" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "shopifyShopGid" TEXT,
    "bundleId" TEXT,
    "bundleType" TEXT,
    "surface" TEXT,
    "actor" TEXT,
    "routeFamily" TEXT,
    "correlationId" TEXT,
    "result" TEXT,
    "errorCode" TEXT,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "idempotencyKey" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shopifyDeliveryStatus" TEXT NOT NULL DEFAULT 'not_sent',
    "shopifyDeliveredAt" TIMESTAMP(3),
    "shopifyRetryCount" INTEGER NOT NULL DEFAULT 0,
    "shopifyLastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessEvent_idempotencyKey_key" ON "BusinessEvent"("idempotencyKey");
CREATE INDEX "Shop_shopifyShopGid_idx" ON "Shop"("shopifyShopGid");
CREATE INDEX "BusinessEvent_eventHandle_idx" ON "BusinessEvent"("eventHandle");
CREATE INDEX "BusinessEvent_shopDomain_idx" ON "BusinessEvent"("shopDomain");
CREATE INDEX "BusinessEvent_shopifyShopGid_idx" ON "BusinessEvent"("shopifyShopGid");
CREATE INDEX "BusinessEvent_bundleId_idx" ON "BusinessEvent"("bundleId");
CREATE INDEX "BusinessEvent_occurredAt_idx" ON "BusinessEvent"("occurredAt");
CREATE INDEX "BusinessEvent_shopifyDeliveryStatus_idx" ON "BusinessEvent"("shopifyDeliveryStatus");
