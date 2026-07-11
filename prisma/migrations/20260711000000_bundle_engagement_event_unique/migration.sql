-- Allow one persisted storefront analytics row per event type in a browser session.
-- This keeps retries idempotent while letting add-to-cart success coexist with
-- the earlier session-engaged row for the same bundle/session.
DROP INDEX "BundleEngagement_shopId_bundleId_sessionId_key";

CREATE UNIQUE INDEX "BundleEngagement_shopId_bundleId_sessionId_eventName_key"
  ON "BundleEngagement"("shopId", "bundleId", "sessionId", "eventName");
