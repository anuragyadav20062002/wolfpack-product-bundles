-- CreateEnum
CREATE TYPE "public"."BundleStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('publish', 'unpublish', 'sync');

-- CreateEnum
CREATE TYPE "public"."DiscountMethodType" AS ENUM ('fixed_amount_off', 'percentage_off', 'fixed_bundle_price', 'free_shipping');

-- CreateEnum
CREATE TYPE "public"."DiscountImplementationType" AS ENUM ('cart_transformation');

-- CreateEnum
CREATE TYPE "public"."BundleType" AS ENUM ('cart_transform');

-- CreateTable
CREATE TABLE "public"."Session" (
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
CREATE TABLE "public"."Bundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shopId" TEXT NOT NULL,
    "shopifyProductId" TEXT,
    "templateName" TEXT,
    "bundleType" "public"."BundleType" NOT NULL DEFAULT 'cart_transform',
    "status" "public"."BundleStatus" NOT NULL DEFAULT 'draft',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "settings" JSONB,
    "matching" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BundleStep" (
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
    "conditionOperator" TEXT,
    "conditionValue" INTEGER,
    "bundleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StepProduct" (
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
CREATE TABLE "public"."BundlePricing" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "enableDiscount" BOOLEAN NOT NULL DEFAULT false,
    "discountMethod" "public"."DiscountMethodType" NOT NULL DEFAULT 'fixed_amount_off',
    "rules" JSONB,
    "discountId" TEXT,
    "showFooter" BOOLEAN NOT NULL DEFAULT true,
    "showBar" BOOLEAN NOT NULL DEFAULT false,
    "messages" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundlePricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BundleAnalytics" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BundleAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopSettings" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "theme" JSONB,
    "defaultSettings" JSONB,
    "discountImplementation" "public"."DiscountImplementationType" NOT NULL DEFAULT 'cart_transformation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QueuedJob" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "type" "public"."JobType" NOT NULL DEFAULT 'publish',
    "status" "public"."JobStatus" NOT NULL DEFAULT 'pending',
    "data" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueuedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplianceRecord" (
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
CREATE INDEX "Session_shop_idx" ON "public"."Session"("shop");

-- CreateIndex
CREATE INDEX "Bundle_shopId_idx" ON "public"."Bundle"("shopId");

-- CreateIndex
CREATE INDEX "Bundle_status_idx" ON "public"."Bundle"("status");

-- CreateIndex
CREATE INDEX "Bundle_bundleType_idx" ON "public"."Bundle"("bundleType");

-- CreateIndex
CREATE INDEX "BundleStep_bundleId_idx" ON "public"."BundleStep"("bundleId");

-- CreateIndex
CREATE INDEX "StepProduct_stepId_idx" ON "public"."StepProduct"("stepId");

-- CreateIndex
CREATE INDEX "StepProduct_productId_idx" ON "public"."StepProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "BundlePricing_bundleId_key" ON "public"."BundlePricing"("bundleId");

-- CreateIndex
CREATE INDEX "BundlePricing_bundleId_idx" ON "public"."BundlePricing"("bundleId");

-- CreateIndex
CREATE INDEX "BundleAnalytics_bundleId_idx" ON "public"."BundleAnalytics"("bundleId");

-- CreateIndex
CREATE INDEX "BundleAnalytics_shopId_idx" ON "public"."BundleAnalytics"("shopId");

-- CreateIndex
CREATE INDEX "BundleAnalytics_event_idx" ON "public"."BundleAnalytics"("event");

-- CreateIndex
CREATE INDEX "BundleAnalytics_createdAt_idx" ON "public"."BundleAnalytics"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shopId_key" ON "public"."ShopSettings"("shopId");

-- CreateIndex
CREATE INDEX "ShopSettings_shopId_idx" ON "public"."ShopSettings"("shopId");

-- CreateIndex
CREATE INDEX "QueuedJob_shopId_idx" ON "public"."QueuedJob"("shopId");

-- CreateIndex
CREATE INDEX "QueuedJob_status_idx" ON "public"."QueuedJob"("status");

-- CreateIndex
CREATE INDEX "QueuedJob_type_idx" ON "public"."QueuedJob"("type");

-- CreateIndex
CREATE INDEX "ComplianceRecord_shop_idx" ON "public"."ComplianceRecord"("shop");

-- CreateIndex
CREATE INDEX "ComplianceRecord_type_idx" ON "public"."ComplianceRecord"("type");

-- CreateIndex
CREATE INDEX "ComplianceRecord_status_idx" ON "public"."ComplianceRecord"("status");

-- AddForeignKey
ALTER TABLE "public"."BundleStep" ADD CONSTRAINT "BundleStep_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StepProduct" ADD CONSTRAINT "StepProduct_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "public"."BundleStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundlePricing" ADD CONSTRAINT "BundlePricing_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundleAnalytics" ADD CONSTRAINT "BundleAnalytics_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
