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
CREATE TYPE "public"."BundleType" AS ENUM ('product_page', 'full_page');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('pending', 'active', 'cancelled', 'frozen', 'expired', 'declined');

-- CreateEnum
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('free', 'grow');

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "storefrontAccessToken" TEXT,
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
    "bundleType" "public"."BundleType" NOT NULL DEFAULT 'product_page',
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
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "method" "public"."DiscountMethodType" NOT NULL DEFAULT 'percentage_off',
    "rules" JSONB,
    "showFooter" BOOLEAN NOT NULL DEFAULT true,
    "showProgressBar" BOOLEAN NOT NULL DEFAULT false,
    "messages" JSONB,
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
CREATE TABLE "public"."DesignSettings" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "bundleType" "public"."BundleType" NOT NULL DEFAULT 'product_page',
    "productCardBgColor" TEXT DEFAULT '#FFFFFF',
    "productCardFontColor" TEXT DEFAULT '#000000',
    "productCardFontSize" INTEGER DEFAULT 16,
    "productCardFontWeight" INTEGER DEFAULT 400,
    "productCardImageFit" TEXT DEFAULT 'cover',
    "productCardsPerRow" INTEGER DEFAULT 3,
    "productPriceVisibility" BOOLEAN NOT NULL DEFAULT true,
    "productStrikePriceColor" TEXT DEFAULT '#8D8D8D',
    "productStrikeFontSize" INTEGER DEFAULT 14,
    "productStrikeFontWeight" INTEGER DEFAULT 400,
    "productFinalPriceColor" TEXT DEFAULT '#000000',
    "productFinalPriceFontSize" INTEGER DEFAULT 18,
    "productFinalPriceFontWeight" INTEGER DEFAULT 700,
    "buttonBgColor" TEXT DEFAULT '#000000',
    "buttonTextColor" TEXT DEFAULT '#FFFFFF',
    "buttonFontSize" INTEGER DEFAULT 16,
    "buttonFontWeight" INTEGER DEFAULT 600,
    "buttonBorderRadius" INTEGER DEFAULT 8,
    "buttonHoverBgColor" TEXT DEFAULT '#333333',
    "buttonAddToCartText" TEXT DEFAULT 'Add to cart',
    "quantitySelectorBgColor" TEXT DEFAULT '#000000',
    "quantitySelectorTextColor" TEXT DEFAULT '#FFFFFF',
    "quantitySelectorFontSize" INTEGER DEFAULT 16,
    "quantitySelectorBorderRadius" INTEGER DEFAULT 8,
    "footerSettings" JSONB,
    "stepBarSettings" JSONB,
    "generalSettings" JSONB,
    "imagesSettings" JSONB,
    "customCss" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignSettings_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "public"."Shop" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMP(3),
    "currentSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "shopifySubscriptionId" TEXT,
    "plan" "public"."SubscriptionPlan" NOT NULL DEFAULT 'free',
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'pending',
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "trialDaysRemaining" INTEGER,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "test" BOOLEAN NOT NULL DEFAULT false,
    "confirmationUrl" TEXT,
    "returnUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "webhookId" TEXT,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "DesignSettings_shopId_idx" ON "public"."DesignSettings"("shopId");

-- CreateIndex
CREATE INDEX "DesignSettings_bundleType_idx" ON "public"."DesignSettings"("bundleType");

-- CreateIndex
CREATE UNIQUE INDEX "DesignSettings_shopId_bundleType_key" ON "public"."DesignSettings"("shopId", "bundleType");

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

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopDomain_key" ON "public"."Shop"("shopDomain");

-- CreateIndex
CREATE INDEX "Shop_shopDomain_idx" ON "public"."Shop"("shopDomain");

-- CreateIndex
CREATE INDEX "Shop_currentSubscriptionId_idx" ON "public"."Shop"("currentSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_shopifySubscriptionId_key" ON "public"."Subscription"("shopifySubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_shopId_idx" ON "public"."Subscription"("shopId");

-- CreateIndex
CREATE INDEX "Subscription_shopifySubscriptionId_idx" ON "public"."Subscription"("shopifySubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "public"."Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_plan_idx" ON "public"."Subscription"("plan");

-- CreateIndex
CREATE INDEX "WebhookEvent_shopDomain_idx" ON "public"."WebhookEvent"("shopDomain");

-- CreateIndex
CREATE INDEX "WebhookEvent_topic_idx" ON "public"."WebhookEvent"("topic");

-- CreateIndex
CREATE INDEX "WebhookEvent_processed_idx" ON "public"."WebhookEvent"("processed");

-- CreateIndex
CREATE INDEX "WebhookEvent_createdAt_idx" ON "public"."WebhookEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_shopDomain_topic_webhookId_key" ON "public"."WebhookEvent"("shopDomain", "topic", "webhookId");

-- AddForeignKey
ALTER TABLE "public"."BundleStep" ADD CONSTRAINT "BundleStep_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StepProduct" ADD CONSTRAINT "StepProduct_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "public"."BundleStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundlePricing" ADD CONSTRAINT "BundlePricing_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundleAnalytics" ADD CONSTRAINT "BundleAnalytics_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
