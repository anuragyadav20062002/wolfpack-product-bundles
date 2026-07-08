import db from "../../db.server";
import { inngest } from "../../inngest/client";
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

export type StorefrontSyncReason = "save" | "retry" | "sync_bundle";

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

type QueueInput = {
  shopDomain: string;
  bundleId: string;
  bundleType: `${BundleType}` | "full_page" | "product_page";
  reason: StorefrontSyncReason;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Storefront sync enqueue failed";
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

export async function enqueueBundleStorefrontSync({
  shopDomain,
  bundleId,
  bundleType,
  reason,
}: QueueInput): Promise<BundleStorefrontSyncState> {
  const attemptId = createStorefrontSyncAttemptId(bundleId);
  const queuedAt = new Date();

  await (db.bundle as any).update({
    where: { id: bundleId, shopId: shopDomain },
    data: {
      storefrontSyncStatus: StorefrontSyncStatus.QUEUED,
      storefrontSyncQueuedAt: queuedAt,
      storefrontSyncStartedAt: null,
      storefrontSyncedAt: null,
      storefrontSyncFailedAt: null,
      storefrontSyncLastError: null,
      storefrontSyncAttemptId: attemptId,
      storefrontSyncStats: null,
    },
  });

  try {
    await inngest.send({
      name: "bundle/storefront-sync.requested",
      data: {
        shopDomain,
        bundleId,
        bundleType,
        reason,
        attemptId,
      },
    });

    AppLogger.info("[STOREFRONT_SYNC] Queued storefront sync", {
      component: "storefront-sync",
      shopDomain,
      bundleId,
      bundleType,
      reason,
      attemptId,
    });

    return {
      status: StorefrontSyncStatus.QUEUED,
      attemptId,
      error: null,
      queuedAt,
      startedAt: null,
      syncedAt: null,
      failedAt: null,
      stats: null,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    const failedAt = new Date();
    const failedBundle = await (db.bundle as any).update({
      where: { id: bundleId, shopId: shopDomain },
      data: {
        storefrontSyncStatus: StorefrontSyncStatus.FAILED,
        storefrontSyncFailedAt: failedAt,
        storefrontSyncLastError: message,
        storefrontSyncAttemptId: attemptId,
      },
    });

    AppLogger.error("[STOREFRONT_SYNC] Failed to queue storefront sync", {
      component: "storefront-sync",
      shopDomain,
      bundleId,
      bundleType,
      reason,
      attemptId,
    }, error);

    return formatBundleStorefrontSync(failedBundle);
  }
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

async function markStorefrontSyncing(input: {
  shopDomain: string;
  bundleId: string;
  attemptId: string;
}) {
  const result = await (db.bundle as any).updateMany({
    where: {
      id: input.bundleId,
      shopId: input.shopDomain,
      storefrontSyncAttemptId: input.attemptId,
    },
    data: {
      storefrontSyncStatus: StorefrontSyncStatus.SYNCING,
      storefrontSyncStartedAt: new Date(),
      storefrontSyncLastError: null,
    },
  });
  return result.count > 0;
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

export async function runBundleStorefrontSync(input: {
  shopDomain: string;
  bundleId: string;
  bundleType: "full_page" | "product_page";
  reason: StorefrontSyncReason;
  attemptId: string;
}) {
  const started = await markStorefrontSyncing(input);
  if (!started) {
    AppLogger.info("[STOREFRONT_SYNC] Ignoring stale storefront sync attempt", {
      component: "storefront-sync",
      ...input,
    });
    return { skipped: true, reason: "stale_attempt" };
  }

  try {
    const bundle = await loadBundleForStorefrontSync(input.shopDomain, input.bundleId);
    if (!bundle) {
      throw new Error("Bundle not found");
    }

    const { unauthenticated } = await import("../../shopify.server");
    const { admin } = await unauthenticated.admin(input.shopDomain);
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
  } catch (error) {
    const message = getErrorMessage(error);
    await markStorefrontSyncFailed({
      shopDomain: input.shopDomain,
      bundleId: input.bundleId,
      attemptId: input.attemptId,
      error: message,
    });
    throw error;
  }
}
