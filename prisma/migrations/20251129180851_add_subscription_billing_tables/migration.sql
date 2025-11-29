-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('pending', 'active', 'cancelled', 'frozen', 'expired', 'declined');

-- CreateEnum
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('free', 'grow');

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
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
