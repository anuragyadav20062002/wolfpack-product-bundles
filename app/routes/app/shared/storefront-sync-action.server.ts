import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../lib/auth-guards.server";
import {
  syncBundleStorefrontNow,
  type StorefrontSyncReason,
} from "../../../services/bundles/storefront-sync.server";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Storefront sync failed";
}

export async function handleSyncStorefrontNow(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  bundleType: "full_page" | "product_page",
  reason: StorefrontSyncReason,
) {
  try {
    await syncBundleStorefrontNow({
      admin,
      shopDomain: session.shop,
      bundleId,
      bundleType,
      reason,
    });

    return json({
      success: true,
      statusCode: 200,
      synced: true,
      message: "Updated Successfully!",
    });
  } catch (error) {
    return json(
      {
        success: false,
        statusCode: 500,
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}

export async function handlePrepareStorefrontPreview(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  bundleType: "full_page" | "product_page",
) {
  try {
    await syncBundleStorefrontNow({
      admin,
      shopDomain: session.shop,
      bundleId,
      bundleType,
      reason: "preview",
    });

    return json({
      success: true,
      statusCode: 200,
      ready: true,
      message: "success",
    });
  } catch (error) {
    return json(
      {
        success: false,
        statusCode: 500,
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
