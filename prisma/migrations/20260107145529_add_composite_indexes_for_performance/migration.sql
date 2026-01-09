-- CreateIndex
CREATE INDEX "Bundle_shopifyProductId_idx" ON "public"."Bundle"("shopifyProductId");

-- CreateIndex
CREATE INDEX "Bundle_shopId_status_idx" ON "public"."Bundle"("shopId", "status");

-- CreateIndex
CREATE INDEX "Bundle_shopId_bundleType_status_idx" ON "public"."Bundle"("shopId", "bundleType", "status");

-- CreateIndex
CREATE INDEX "Bundle_shopId_updatedAt_idx" ON "public"."Bundle"("shopId", "updatedAt");

-- CreateIndex
CREATE INDEX "BundleAnalytics_shopId_event_createdAt_idx" ON "public"."BundleAnalytics"("shopId", "event", "createdAt");

-- CreateIndex
CREATE INDEX "BundleAnalytics_bundleId_event_createdAt_idx" ON "public"."BundleAnalytics"("bundleId", "event", "createdAt");

-- CreateIndex
CREATE INDEX "BundleStep_bundleId_position_idx" ON "public"."BundleStep"("bundleId", "position");

-- CreateIndex
CREATE INDEX "BundleStep_bundleId_enabled_idx" ON "public"."BundleStep"("bundleId", "enabled");

-- CreateIndex
CREATE INDEX "Session_shop_expires_idx" ON "public"."Session"("shop", "expires");

-- CreateIndex
CREATE INDEX "Session_shop_storefrontAccessToken_idx" ON "public"."Session"("shop", "storefrontAccessToken");

-- CreateIndex
CREATE INDEX "StepProduct_stepId_position_idx" ON "public"."StepProduct"("stepId", "position");

-- CreateIndex
CREATE INDEX "StepProduct_productId_stepId_idx" ON "public"."StepProduct"("productId", "stepId");
