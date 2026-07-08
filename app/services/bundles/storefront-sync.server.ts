import db from "../../db.server";
import { StorefrontSyncStatus, BundleType } from "../../constants/bundle";
import { AppLogger } from "../../lib/logger";
import type { ShopifyAdmin } from "../../lib/auth-guards.server";
import { CartTransformService } from "../cart-transform-service.server";
import {
  updateBundleProductMetafields,
} from "./metafield-sync.server";
import {
  convertBundleToStandardMetafields,
  updateProductStandardMetafields,
} from "./standard-metafields.server";
import {
  refreshFullPageBundlePageBody,
  writeBundleConfigPageMetafield,
} from "../widget-installation/widget-full-page-bundle.server";
import { syncThemeColors } from "../theme-colors.server";
import { syncFpbProductStatus } from "../../routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/product-status.server";
import { buildFullPageBundleMetafieldConfig } from "../../routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/shared.server";
import {
  buildSyncBundleConfiguration,
} from "../../routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/runtime-config.server";
import { syncBundleProductToShopify } from "../../routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/product-sync.server";

export type StorefrontSyncReason = "save" | "retry" | "sync_bundle" | "preview";

export type BundleStorefrontSyncState = {
  status: StorefrontSyncStatus;
  attemptId: string | null;
  error: string | null;
  queuedAt: Date | string | null;
  startedAt: Date | string | null;
  syncedAt: Date | string | null;
  failedAt: Date | string | null;
  stats: unknown;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Storefront sync failed";
}

export function createStorefrontSyncAttemptId(bundleId: string) {
  return `${bundleId}:${Date.now()}`;
}

export function formatBundleStorefrontSync(bundle: any): BundleStorefrontSyncState {
  return {
    status: bundle.storefrontSyncStatus ?? StorefrontSyncStatus.SYNCED,
    attemptId: bundle.storefrontSyncAttemptId ?? null,
    error: bundle.storefrontSyncLastError ?? null,
    queuedAt: bundle.storefrontSyncQueuedAt ?? null,
    startedAt: bundle.storefrontSyncStartedAt ?? null,
    syncedAt: bundle.storefrontSyncedAt ?? null,
    failedAt: bundle.storefrontSyncFailedAt ?? null,
    stats: bundle.storefrontSyncStats ?? null,
  };
}

export async function getBundleStorefrontSyncState(
  shopDomain: string,
  bundleId: string,
) {
  const bundle = await (db.bundle as any).findUnique({
    where: { id: bundleId, shopId: shopDomain },
    select: {
      storefrontSyncStatus: true,
      storefrontSyncAttemptId: true,
      storefrontSyncQueuedAt: true,
      storefrontSyncStartedAt: true,
      storefrontSyncedAt: true,
      storefrontSyncFailedAt: true,
      storefrontSyncLastError: true,
      storefrontSyncStats: true,
    },
  });
  return formatBundleStorefrontSync(bundle ?? {});
}

async function loadBundleForStorefrontSync(shopDomain: string, bundleId: string) {
  return (db.bundle as any).findUnique({
    where: { id: bundleId, shopId: shopDomain },
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
}

async function markStorefrontSyncingNow(input: {
  shopDomain: string;
  bundleId: string;
  attemptId: string;
}) {
  await (db.bundle as any).update({
    where: { id: input.bundleId, shopId: input.shopDomain },
    data: {
      storefrontSyncStatus: StorefrontSyncStatus.SYNCING,
      storefrontSyncQueuedAt: null,
      storefrontSyncStartedAt: new Date(),
      storefrontSyncedAt: null,
      storefrontSyncFailedAt: null,
      storefrontSyncLastError: null,
      storefrontSyncAttemptId: input.attemptId,
      storefrontSyncStats: null,
    },
  });
}

async function markStorefrontSynced(input: {
  shopDomain: string;
  bundleId: string;
  attemptId: string;
  stats: Record<string, unknown>;
}) {
  await (db.bundle as any).updateMany({
    where: {
      id: input.bundleId,
      shopId: input.shopDomain,
      storefrontSyncAttemptId: input.attemptId,
    },
    data: {
      storefrontSyncStatus: StorefrontSyncStatus.SYNCED,
      storefrontSyncedAt: new Date(),
      storefrontSyncFailedAt: null,
      storefrontSyncLastError: null,
      storefrontSyncStats: input.stats,
    },
  });
}

async function markStorefrontSyncFailed(input: {
  shopDomain: string;
  bundleId: string;
  attemptId: string;
  error: string;
}) {
  await (db.bundle as any).updateMany({
    where: {
      id: input.bundleId,
      shopId: input.shopDomain,
      storefrontSyncAttemptId: input.attemptId,
    },
    data: {
      storefrontSyncStatus: StorefrontSyncStatus.FAILED,
      storefrontSyncFailedAt: new Date(),
      storefrontSyncLastError: input.error,
    },
  });
}

async function updateStandardMetafields(
  admin: ShopifyAdmin,
  shopifyProductId: string,
  bundleConfig: Record<string, unknown>,
) {
  const { metafields: standardMetafields, errors } =
    await convertBundleToStandardMetafields(admin, bundleConfig);
  if (errors.length > 0) {
    AppLogger.warn("[STOREFRONT_SYNC] Standard metafield conversion warnings", {
      component: "storefront-sync",
      shopifyProductId,
    }, errors);
  }
  if (Object.keys(standardMetafields).length > 0) {
    await updateProductStandardMetafields(admin, shopifyProductId, standardMetafields);
  }
}

async function syncFullPageBundleFromDb(
  admin: ShopifyAdmin,
  shopDomain: string,
  bundle: any,
) {
  const stats = {
    bundleType: BundleType.FULL_PAGE,
    productMetafields: false,
    pageMetafield: false,
    pageBody: false,
    themeColors: false,
  };

  if (bundle.shopifyPageId) {
    const bodyRefresh = await refreshFullPageBundlePageBody(
      admin,
      bundle.shopifyPageId,
      bundle.id,
      shopDomain,
      bundle,
    );
    stats.pageBody = bodyRefresh.success === true;
    if (!bodyRefresh.success) {
      AppLogger.warn("[STOREFRONT_SYNC] Failed to refresh full-page body", {
        component: "storefront-sync",
        bundleId: bundle.id,
        pageId: bundle.shopifyPageId,
        error: bodyRefresh.error,
      });
    }

    await writeBundleConfigPageMetafield(admin, bundle.shopifyPageId, bundle);
    stats.pageMetafield = true;
  }

  if (!bundle.shopifyProductId) {
    return stats;
  }

  await syncFpbProductStatus(
    admin,
    bundle.shopifyProductId,
    bundle.id,
    bundle.status,
    bundle.name,
    bundle.description || "",
  );
  const bundleConfig = buildFullPageBundleMetafieldConfig(bundle);
  await updateStandardMetafields(admin, bundle.shopifyProductId, bundleConfig);
  await updateBundleProductMetafields(admin, bundle.shopifyProductId, bundleConfig);
  stats.productMetafields = true;
  syncThemeColors(admin, shopDomain).catch(() => {});
  stats.themeColors = true;
  return stats;
}

async function syncProductPageBundleFromDb(
  admin: ShopifyAdmin,
  shopDomain: string,
  bundle: any,
) {
  const stats = {
    bundleType: BundleType.PRODUCT_PAGE,
    productMetafields: false,
    productState: false,
    themeColors: false,
  };

  if (!bundle.shopifyProductId) {
    return stats;
  }

  const productSyncResult = await syncBundleProductToShopify(
    admin,
    bundle.shopifyProductId,
    bundle.status,
    bundle.name,
    bundle.description,
    bundle.id,
  );
  stats.productState = true;
  if (
    productSyncResult.handle &&
    productSyncResult.handle !== bundle.shopifyProductHandle
  ) {
    await (db.bundle as any).update({
      where: { id: bundle.id },
      data: { shopifyProductHandle: productSyncResult.handle },
    });
  }

  const bundleConfig = buildSyncBundleConfiguration(bundle, bundle.shopifyProductId);
  await updateStandardMetafields(admin, bundle.shopifyProductId, bundleConfig);
  await updateBundleProductMetafields(admin, bundle.shopifyProductId, bundleConfig);
  stats.productMetafields = true;
  syncThemeColors(admin, shopDomain).catch(() => {});
  stats.themeColors = true;
  return stats;
}

async function performBundleStorefrontSync(
  admin: ShopifyAdmin,
  input: {
    shopDomain: string;
    bundleId: string;
    bundleType: "full_page" | "product_page";
    reason: StorefrontSyncReason;
    attemptId: string;
  },
) {
  const bundle = await loadBundleForStorefrontSync(input.shopDomain, input.bundleId);
  if (!bundle) {
    throw new Error("Bundle not found");
  }

  const activation = await CartTransformService.completeSetup(
    admin,
    input.shopDomain,
  );
  if (!activation.success) {
    throw new Error(activation.error ?? "Cart Transform activation failed");
  }

  const stats =
    input.bundleType === BundleType.FULL_PAGE
      ? await syncFullPageBundleFromDb(admin, input.shopDomain, bundle)
      : await syncProductPageBundleFromDb(admin, input.shopDomain, bundle);

  await markStorefrontSynced({
    shopDomain: input.shopDomain,
    bundleId: input.bundleId,
    attemptId: input.attemptId,
    stats: {
      ...stats,
      cartTransformId: activation.cartTransformId ?? null,
      reason: input.reason,
    },
  });

  return { skipped: false, synced: true, stats };
}

export async function syncBundleStorefrontNow(input: {
  admin: ShopifyAdmin;
  shopDomain: string;
  bundleId: string;
  bundleType: "full_page" | "product_page";
  reason: StorefrontSyncReason;
}) {
  const attemptId = createStorefrontSyncAttemptId(input.bundleId);
  const syncInput = {
    shopDomain: input.shopDomain,
    bundleId: input.bundleId,
    bundleType: input.bundleType,
    reason: input.reason,
    attemptId,
  };

  await markStorefrontSyncingNow(syncInput);

  try {
    return await performBundleStorefrontSync(input.admin, syncInput);
  } catch (error) {
    await markStorefrontSyncFailed({
      shopDomain: input.shopDomain,
      bundleId: input.bundleId,
      attemptId,
      error: getErrorMessage(error),
    });
    throw error;
  }
}

export function compactBundleForConfigureResponse(bundle: any) {
  return {
    id: bundle.id,
    bundleType: bundle.bundleType,
    status: bundle.status,
    name: bundle.name,
    description: bundle.description ?? null,
    shopifyProductId: bundle.shopifyProductId ?? null,
    shopifyProductHandle: bundle.shopifyProductHandle ?? null,
    shopifyPageId: bundle.shopifyPageId ?? null,
    shopifyPageHandle: bundle.shopifyPageHandle ?? null,
    shopifyPreviewPageId: bundle.shopifyPreviewPageId ?? null,
    shopifyPreviewPageHandle: bundle.shopifyPreviewPageHandle ?? null,
  };
}
