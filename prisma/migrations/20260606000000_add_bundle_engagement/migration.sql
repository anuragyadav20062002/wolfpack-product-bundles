-- CreateTable
CREATE TABLE "BundleEngagement" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "presetId" TEXT,
    "bundleType" TEXT,
    "eventName" TEXT NOT NULL,
    "landingPage" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BundleEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BundleEngagement_shopId_bundleId_sessionId_key" ON "BundleEngagement"("shopId", "bundleId", "sessionId");

-- CreateIndex
CREATE INDEX "BundleEngagement_shopId_idx" ON "BundleEngagement"("shopId");

-- CreateIndex
CREATE INDEX "BundleEngagement_bundleId_idx" ON "BundleEngagement"("bundleId");

-- CreateIndex
CREATE INDEX "BundleEngagement_shopId_createdAt_idx" ON "BundleEngagement"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "BundleEngagement_bundleId_createdAt_idx" ON "BundleEngagement"("bundleId", "createdAt");
