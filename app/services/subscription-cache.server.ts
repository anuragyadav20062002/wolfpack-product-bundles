import { BillingService, type SubscriptionInfo } from "./billing.server";
import { loaderCache } from "../lib/loader-cache.server";

const BILLING_SUBSCRIPTION_CACHE_TTL_MS = 30_000;
const BILLING_SUBSCRIPTION_CACHE_PREFIX = "billing:subscription:";

function subscriptionCacheKey(shopDomain: string): string {
  return `${BILLING_SUBSCRIPTION_CACHE_PREFIX}${shopDomain}`;
}

export function getCachedSubscriptionInfo(shopDomain: string): SubscriptionInfo | null | undefined {
  return loaderCache.get<SubscriptionInfo | null>(subscriptionCacheKey(shopDomain));
}

export function getSubscriptionInfoFromCache(shopDomain: string): Promise<SubscriptionInfo | null> {
  return loaderCache.memo(
    subscriptionCacheKey(shopDomain),
    () => BillingService.getSubscriptionInfo(shopDomain),
    BILLING_SUBSCRIPTION_CACHE_TTL_MS,
  );
}
