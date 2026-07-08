import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import {
  enqueueBundleStorefrontSync,
  getBundleStorefrontSyncState,
  type StorefrontSyncReason,
} from "../../../services/bundles/storefront-sync.server";

export async function handleQueueStorefrontSync(
  session: Session,
  bundleId: string,
  bundleType: "full_page" | "product_page",
  reason: StorefrontSyncReason,
) {
  const storefrontSync = await enqueueBundleStorefrontSync({
    shopDomain: session.shop,
    bundleId,
    bundleType,
    reason,
  });

  return json({
    success: true,
    queued: storefrontSync.status === "queued",
    storefrontSync,
    message:
      storefrontSync.status === "failed"
        ? "Bundle saved, but storefront sync could not be queued"
        : "Storefront sync queued",
  });
}

export async function handleGetStorefrontSyncStatus(
  session: Session,
  bundleId: string,
) {
  return json({
    success: true,
    storefrontSync: await getBundleStorefrontSyncState(session.shop, bundleId),
  });
}
