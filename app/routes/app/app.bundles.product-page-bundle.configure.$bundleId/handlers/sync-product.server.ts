import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import db from "../../../../db.server";
import { ERROR_MESSAGES } from "../../../../constants/errors";
import { ensureBundleParentProduct } from "../../../../services/bundles/bundle-parent-product.server";
import {
  convertBundleToStandardMetafields,
  updateProductStandardMetafields,
} from "../../../../services/bundles/standard-metafields.server";
import {
  buildSyncBundleConfiguration,
  updateSyncMetafields,
} from "./runtime-config.server";

export async function handleSyncProduct(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  _formData: FormData,
) {
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
      { success: false, error: ERROR_MESSAGES.BUNDLE_NOT_FOUND },
      { status: 404 },
    );
  }

  try {
    const parent = await ensureBundleParentProduct({
      admin,
      shopDomain: session.shop,
      appUrl: process.env.SHOPIFY_APP_URL,
      bundle,
    });
    const syncedBundle = {
      ...bundle,
      shopifyProductId: parent.productId,
      shopifyProductHandle: parent.handle,
    };
    const bundleConfiguration = buildSyncBundleConfiguration(
      syncedBundle,
      parent.productId,
      {
        lastSynced: new Date().toISOString(),
        shopifyProduct: {
          id: parent.productId,
          handle: parent.handle,
          status: parent.status,
        },
      },
    );
    const { metafields: standardMetafields, errors } =
      await convertBundleToStandardMetafields(admin, bundleConfiguration);
    if (errors.length > 0) {
      AppLogger.warn("[PRODUCT_SYNC] Standard metafield conversion warnings", {
        component: "app.bundles.product-page.configure",
        bundleId,
      }, errors);
    }
    if (Object.keys(standardMetafields).length > 0) {
      await updateProductStandardMetafields(
        admin,
        parent.productId,
        standardMetafields,
      );
    }
    await updateSyncMetafields(admin, parent.productId, syncedBundle, {
      lastSynced: new Date().toISOString(),
      shopifyProduct: {
        id: parent.productId,
        handle: parent.handle,
        status: parent.status,
      },
    });

    return json({
      success: true,
      statusCode: 200,
      productId: parent.productId,
      productHandle: parent.handle,
      message: "Updated Successfully!",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    AppLogger.error(
      "[PRODUCT_SYNC] Failed to sync PPB parent product",
      { component: "app.bundles.product-page.configure", bundleId },
      error as any,
    );
    return json(
      { success: false, error: `Failed to sync product: ${message}` },
      { status: 500 },
    );
  }
}
