-- CreateEnum
CREATE TYPE "BundleStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('publish', 'unpublish', 'sync');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('percentage', 'fixed');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shopId" TEXT NOT NULL,
    "status" "BundleStatus" NOT NULL DEFAULT 'draft',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "settings" JSONB,
    "matching" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleStep" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT DEFAULT 'box',
    "position" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "productCategory" TEXT,
    "collections" JSONB,
    "products" JSONB,
    "displayVariantsAsIndividual" BOOLEAN NOT NULL DEFAULT false,
    "conditionType" TEXT,
    "conditionValue" INTEGER,
    "bundleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepProduct" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "variants" JSONB,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StepProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundlePricing" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "type" "PricingType" NOT NULL DEFAULT 'percentage',
    "status" BOOLEAN NOT NULL DEFAULT false,
    "rules" JSONB,
    "showFooter" BOOLEAN NOT NULL DEFAULT true,
    "showBar" BOOLEAN NOT NULL DEFAULT false,
    "messages" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundlePricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleAnalytics" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BundleAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "theme" JSONB,
    "defaultSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueuedJob" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "type" "JobType" NOT NULL DEFAULT 'publish',
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "data" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueuedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_shop_idx" ON "Session"("shop");

-- CreateIndex
CREATE INDEX "Bundle_shopId_idx" ON "Bundle"("shopId");

-- CreateIndex
CREATE INDEX "Bundle_status_idx" ON "Bundle"("status");

-- CreateIndex
CREATE INDEX "BundleStep_bundleId_idx" ON "BundleStep"("bundleId");

-- CreateIndex
CREATE INDEX "StepProduct_stepId_idx" ON "StepProduct"("stepId");

-- CreateIndex
CREATE INDEX "StepProduct_productId_idx" ON "StepProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "BundlePricing_bundleId_key" ON "BundlePricing"("bundleId");

-- CreateIndex
CREATE INDEX "BundlePricing_bundleId_idx" ON "BundlePricing"("bundleId");

-- CreateIndex
CREATE INDEX "BundleAnalytics_bundleId_idx" ON "BundleAnalytics"("bundleId");

-- CreateIndex
CREATE INDEX "BundleAnalytics_shopId_idx" ON "BundleAnalytics"("shopId");

-- CreateIndex
CREATE INDEX "BundleAnalytics_event_idx" ON "BundleAnalytics"("event");

-- CreateIndex
CREATE INDEX "BundleAnalytics_createdAt_idx" ON "BundleAnalytics"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shopId_key" ON "ShopSettings"("shopId");

-- CreateIndex
CREATE INDEX "ShopSettings_shopId_idx" ON "ShopSettings"("shopId");

-- CreateIndex
CREATE INDEX "QueuedJob_shopId_idx" ON "QueuedJob"("shopId");

-- CreateIndex
CREATE INDEX "QueuedJob_status_idx" ON "QueuedJob"("status");

-- CreateIndex
CREATE INDEX "QueuedJob_type_idx" ON "QueuedJob"("type");

-- CreateIndex
CREATE INDEX "ComplianceRecord_shop_idx" ON "ComplianceRecord"("shop");

-- CreateIndex
CREATE INDEX "ComplianceRecord_type_idx" ON "ComplianceRecord"("type");

-- CreateIndex
CREATE INDEX "ComplianceRecord_status_idx" ON "ComplianceRecord"("status");

-- AddForeignKey
ALTER TABLE "BundleStep" ADD CONSTRAINT "BundleStep_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepProduct" ADD CONSTRAINT "StepProduct_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "BundleStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundlePricing" ADD CONSTRAINT "BundlePricing_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleAnalytics" ADD CONSTRAINT "BundleAnalytics_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
