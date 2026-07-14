export const DEPLOYMENT_BACKFILL_CONFIRMATION =
  "I_UNDERSTAND_THIS_CAN_MUTATE_PRODUCTION";

type BundleType = "full_page" | "product_page";

export interface DeploymentBackfillOptions {
  enabled: boolean;
  apply: boolean;
  confirm: string | null;
  shopDomain: string | null;
  bundleLimit: number | null;
  includeUninstalled: boolean;
}

export interface DeploymentBackfillSummary {
  mode: "disabled" | "dry-run" | "apply";
  scannedShops: number;
  scannedBundles: number;
  syncedBundles: number;
  failedBundles: number;
  failures: Array<{ shopDomain: string; bundleId: string; error: string }>;
  fpbProxyMigrations: number;
  publicPagesToDelete: number;
  previewPagesToDelete: number;
  pageRedirectsToCreate: number;
  productRedirectsToUpdate: number;
}

interface BackfillShop {
  shopDomain: string;
}

interface BackfillBundle {
  id: string;
  shopId: string;
  bundleType: BundleType | string;
  shopifyPageId: string | null;
  shopifyPageHandle: string | null;
  shopifyPreviewPageId: string | null;
  shopifyPreviewPageHandle: string | null;
  shopifyProductHandle: string | null;
}

interface PrismaBackfillClient {
  shop: {
    findMany: (args: unknown) => Promise<BackfillShop[]>;
  };
  bundle: {
    findMany: (args: unknown) => Promise<BackfillBundle[]>;
    update: (args: unknown) => Promise<unknown>;
  };
}

export interface DeploymentBackfillDependencies {
  prisma: PrismaBackfillClient;
  getAdmin: (shopDomain: string) => Promise<unknown>;
  syncBundle: (input: {
    admin: unknown;
    shopDomain: string;
    bundleId: string;
    bundleType: BundleType;
    reason: "sync_bundle";
  }) => Promise<unknown>;
  migrateFpbPageHost: (input: {
    admin: unknown;
    prisma: PrismaBackfillClient;
    bundle: BackfillBundle;
  }) => Promise<unknown>;
  logger?: Pick<Console, "info" | "warn" | "error">;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalString(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function parseDeploymentBackfillEnv(
  env: Record<string, string | undefined> = process.env,
): DeploymentBackfillOptions {
  return {
    enabled: parseBoolean(
      env.WPB_DEPLOYMENT_BACKFILL_ENABLED ?? env.RUN_DEPLOYMENT_BACKFILL,
    ),
    apply: parseBoolean(env.WPB_DEPLOYMENT_BACKFILL_APPLY),
    confirm: parseOptionalString(env.WPB_DEPLOYMENT_BACKFILL_CONFIRM),
    shopDomain: parseOptionalString(env.WPB_DEPLOYMENT_BACKFILL_SHOP),
    bundleLimit: parsePositiveInt(env.WPB_DEPLOYMENT_BACKFILL_LIMIT),
    includeUninstalled: parseBoolean(env.WPB_DEPLOYMENT_BACKFILL_INCLUDE_UNINSTALLED),
  };
}

function assertApplyConfirmed(options: DeploymentBackfillOptions) {
  if (!options.apply) return;
  if (options.confirm === DEPLOYMENT_BACKFILL_CONFIRMATION) return;

  throw new Error(
    `Deployment backfill apply mode requires WPB_DEPLOYMENT_BACKFILL_CONFIRM=${DEPLOYMENT_BACKFILL_CONFIRMATION}`,
  );
}

async function listTargetShops(
  options: DeploymentBackfillOptions,
  prisma: PrismaBackfillClient,
) {
  if (options.shopDomain) {
    return [{ shopDomain: options.shopDomain }];
  }

  return prisma.shop.findMany({
    where: options.includeUninstalled ? {} : { uninstalledAt: null },
    select: { shopDomain: true },
    orderBy: { shopDomain: "asc" },
  });
}

async function listTargetBundles(
  options: DeploymentBackfillOptions,
  prisma: PrismaBackfillClient,
  shopDomains: string[],
) {
  if (shopDomains.length === 0) return [];

  return prisma.bundle.findMany({
    where: {
      shopId: { in: shopDomains },
    },
    select: {
      id: true,
      shopId: true,
      bundleType: true,
      shopifyPageId: true,
      shopifyPageHandle: true,
      shopifyPreviewPageId: true,
      shopifyPreviewPageHandle: true,
      shopifyProductHandle: true,
    },
    orderBy: [
      { shopId: "asc" },
      { updatedAt: "desc" },
    ],
    take: options.bundleLimit ?? undefined,
  });
}

function isBundleType(value: string): value is BundleType {
  return value === "full_page" || value === "product_page";
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Deployment backfill failed";
}

export async function runDeploymentBackfill(
  options: DeploymentBackfillOptions,
  deps: DeploymentBackfillDependencies,
): Promise<DeploymentBackfillSummary> {
  if (!options.enabled) {
    deps.logger?.info?.("[DEPLOYMENT_BACKFILL] Disabled; skipping.");
    return {
      mode: "disabled",
      scannedShops: 0,
      scannedBundles: 0,
      syncedBundles: 0,
      failedBundles: 0,
      failures: [],
      fpbProxyMigrations: 0,
      publicPagesToDelete: 0,
      previewPagesToDelete: 0,
      pageRedirectsToCreate: 0,
      productRedirectsToUpdate: 0,
    };
  }

  assertApplyConfirmed(options);

  const shops = await listTargetShops(options, deps.prisma);
  const shopDomains = shops.map((shop) => shop.shopDomain);
  const bundles = await listTargetBundles(options, deps.prisma, shopDomains);
  const summary: DeploymentBackfillSummary = {
    mode: options.apply ? "apply" : "dry-run",
    scannedShops: shopDomains.length,
    scannedBundles: bundles.length,
    syncedBundles: 0,
    failedBundles: 0,
    failures: [],
    fpbProxyMigrations: bundles.filter((bundle) => bundle.bundleType === "full_page").length,
    publicPagesToDelete: bundles.filter((bundle) => bundle.bundleType === "full_page" && bundle.shopifyPageId).length,
    previewPagesToDelete: bundles.filter((bundle) => bundle.bundleType === "full_page" && bundle.shopifyPreviewPageId).length,
    pageRedirectsToCreate: bundles.filter((bundle) => bundle.bundleType === "full_page" && bundle.shopifyPageHandle).length,
    productRedirectsToUpdate: bundles.filter((bundle) => bundle.bundleType === "full_page" && bundle.shopifyProductHandle).length,
  };

  deps.logger?.info?.("[DEPLOYMENT_BACKFILL] Target scan complete.", {
    mode: summary.mode,
    scannedShops: summary.scannedShops,
    scannedBundles: summary.scannedBundles,
  });

  if (!options.apply) {
    return summary;
  }

  const adminByShop = new Map<string, unknown>();
  for (const bundle of bundles) {
    if (!isBundleType(bundle.bundleType)) {
      summary.failedBundles += 1;
      summary.failures.push({
        shopDomain: bundle.shopId,
        bundleId: bundle.id,
        error: `Unsupported bundle type: ${bundle.bundleType}`,
      });
      continue;
    }

    try {
      let admin = adminByShop.get(bundle.shopId);
      if (!admin) {
        admin = await deps.getAdmin(bundle.shopId);
        adminByShop.set(bundle.shopId, admin);
      }

      if (bundle.bundleType === "full_page") {
        await deps.migrateFpbPageHost({
          admin,
          prisma: deps.prisma,
          bundle,
        });
      }

      await deps.syncBundle({
        admin,
        shopDomain: bundle.shopId,
        bundleId: bundle.id,
        bundleType: bundle.bundleType,
        reason: "sync_bundle",
      });
      summary.syncedBundles += 1;
    } catch (error) {
      const message = toErrorMessage(error);
      summary.failedBundles += 1;
      summary.failures.push({
        shopDomain: bundle.shopId,
        bundleId: bundle.id,
        error: message,
      });
      deps.logger?.error?.("[DEPLOYMENT_BACKFILL] Bundle sync failed.", {
        shopDomain: bundle.shopId,
        bundleId: bundle.id,
        error: message,
      });
    }
  }

  return summary;
}
