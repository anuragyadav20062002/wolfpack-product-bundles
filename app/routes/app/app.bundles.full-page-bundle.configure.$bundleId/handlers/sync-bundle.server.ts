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
import { buildFullPageBundleMetafieldConfig } from "./shared.server";
import { buildFpbStorefrontUrl } from "../../../../lib/fpb-storefront-url";

export async function handleSyncBundle(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
) {
  try {
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
      return json({ success: false, error: "Bundle not found" }, { status: 404 });
    }

    const parent = await ensureBundleParentProduct({
      admin,
      shopDomain: session.shop,
      appUrl: process.env.SHOPIFY_APP_URL,
      bundle,
    });
    const bundleConfig = buildFullPageBundleMetafieldConfig({
      ...bundle,
      shopifyProductId: parent.productId,
      shopifyProductHandle: parent.handle,
    });
    const { metafields: standardMetafields } =
      await convertBundleToStandardMetafields(admin, bundleConfig);
    if (Object.keys(standardMetafields).length > 0) {
      await updateProductStandardMetafields(
        admin,
        parent.productId,
        standardMetafields,
      );
    }
    await updateComponentProductMetafields(admin, parent.productId, bundleConfig);
    await updateBundleProductMetafields(admin, parent.productId, bundleConfig);
    syncThemeColors(admin, session.shop).catch(() => undefined);

    return json({
      success: true,
      synced: true,
      message: "Bundle synced successfully",
      storefrontUrl: buildFpbStorefrontUrl(session.shop, bundleId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    AppLogger.error("[SYNC_BUNDLE] Proxy-hosted FPB sync failed", {
      component: "fpb.sync-bundle",
      bundleId,
      shop: session.shop,
    }, error);
    return json({ success: false, error: `Sync failed: ${message}` }, { status: 500 });
  }
}
