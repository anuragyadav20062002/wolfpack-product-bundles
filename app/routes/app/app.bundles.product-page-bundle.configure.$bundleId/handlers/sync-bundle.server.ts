import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import db from "../../../../db.server";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../../../../services/bundles/metafield-sync.server";
import { ensureBundleParentProduct } from "../../../../services/bundles/bundle-parent-product.server";
import {
  convertBundleToStandardMetafields,
  updateProductStandardMetafields,
} from "../../../../services/bundles/standard-metafields.server";
import { syncThemeColors } from "../../../../services/theme-colors.server";
import { buildSyncBundleConfiguration } from "./runtime-config.server";
import { ensureShopIdentity, recordBusinessEvent } from "../../../../services/app-events.server";

/**
 * Enforce the shared parent-product contract and rewrite runtime metafields.
 */
export async function handleSyncBundle(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
) {
  const correlationId = `bundle-sync:${bundleId}:${Date.now()}`;
  const startedAt = Date.now();
  const shopifyShopGid = await ensureShopIdentity(admin, session.shop);
  await recordBusinessEvent({
    eventHandle: "bundle_sync_started",
    shopDomain: session.shop,
    shopifyShopGid,
    bundleId,
    bundleType: "product_page",
    surface: "admin",
    actor: "merchant",
    routeFamily: "ppb_configure",
    correlationId,
  });
  AppLogger.info(
    "[SYNC_BUNDLE] Starting hard-reset sync for product-page bundle",
    { bundleId, shopId: session.shop },
  );

  try {
    // 1. Load bundle + steps + pricing from DB
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      include: {
        steps: {
          include: {
            StepProduct: { orderBy: { position: "asc" } },
            StepCategory: { orderBy: { sortOrder: "asc" } },
          },
          orderBy: { position: "asc" },
        },
        pricing: true,
      },
    });

    if (!bundle) {
      return json(
        { success: false, error: "Bundle not found" },
        { status: 404 },
      );
    }

    const parent = await ensureBundleParentProduct({
      admin,
      shopDomain: session.shop,
      appUrl: process.env.SHOPIFY_APP_URL,
      bundle,
    });
    const productId = parent.productId;
    const bundleConfig = buildSyncBundleConfiguration(
      {
        ...bundle,
        shopifyProductId: productId,
        shopifyProductHandle: parent.handle,
      },
      productId,
    );

    AppLogger.info("[SYNC_BUNDLE] Re-running metafield operations", {
      bundleId,
      productId,
    });

    const [standardResult, componentResult, variantResult] =
      await Promise.allSettled([
        (async () => {
          const { metafields: standardMetafields } =
            await convertBundleToStandardMetafields(admin, bundleConfig);
          if (Object.keys(standardMetafields).length > 0) {
            await updateProductStandardMetafields(
              admin,
              productId,
              standardMetafields,
            );
          }
        })(),
        updateComponentProductMetafields(admin, productId, bundleConfig),
        updateBundleProductMetafields(admin, productId, bundleConfig),
      ]);

    if (standardResult.status === "rejected") {
      AppLogger.warn(
        "[SYNC_BUNDLE] Standard metafields update failed (non-critical)",
        { bundleId },
        standardResult.reason,
      );
    }
    if (componentResult.status === "rejected") {
      throw new Error(
        `Failed to update component metafields: ${componentResult.reason}`,
      );
    }
    if (variantResult.status === "rejected") {
      throw new Error(
        `Failed to update bundle variant metafields: ${variantResult.reason}`,
      );
    }

    AppLogger.info("[SYNC_BUNDLE] All metafields re-synced successfully", {
      bundleId,
    });

    // Sync theme colors for bundle widget color inheritance (non-critical, silent fail)
    syncThemeColors(admin, session.shop).catch(() => {
      /* swallowed — syncThemeColors handles logging */
    });

    await recordBusinessEvent({
      eventHandle: "bundle_synced",
      shopDomain: session.shop,
      shopifyShopGid,
      bundleId,
      bundleType: "product_page",
      surface: "admin",
      actor: "merchant",
      routeFamily: "ppb_configure",
      correlationId,
      result: "success",
      attributes: {
        duration_ms: Date.now() - startedAt,
        resources_synced: "product,metafields,theme_colors",
      },
    });

    return json({
      success: true,
      synced: true,
      message: "Bundle synced successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    AppLogger.error(
      "[SYNC_BUNDLE] Error during sync:",
      { bundleId },
      error as any,
    );
    await recordBusinessEvent({
      eventHandle: "bundle_sync_failed",
      shopDomain: session.shop,
      shopifyShopGid,
      bundleId,
      bundleType: "product_page",
      surface: "admin",
      actor: "merchant",
      routeFamily: "ppb_configure",
      correlationId,
      result: "failure",
      errorCode: "sync_failed",
      attributes: {
        error_message_safe: message,
        duration_ms: Date.now() - startedAt,
      },
    });
    return json(
      { success: false, error: `Sync failed: ${message}` },
      { status: 500 },
    );
  }
}
