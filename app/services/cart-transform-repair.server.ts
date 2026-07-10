type RepairMode = "disabled" | "dry-run" | "apply";

export interface CartTransformRepairOptions {
  dryRun: boolean;
  apply: boolean;
}

export interface CartTransformRepairSummary {
  mode: RepairMode;
  scannedShops: number;
  succeededShops: number;
  failedShops: number;
  failures: Array<{ shopDomain: string; error: string }>;
}

interface RepairShop {
  shopDomain: string;
}

interface PrismaRepairClient {
  shop: {
    findMany: (args: unknown) => Promise<RepairShop[]>;
  };
}

interface CompleteSetupResult {
  success: boolean;
  cartTransformId?: string;
  error?: string;
}

export interface CartTransformRepairDependencies {
  prisma: PrismaRepairClient;
  getAdmin: (shopDomain: string) => Promise<unknown>;
  completeSetup: (admin: unknown, shopDomain: string) => Promise<CompleteSetupResult>;
  logger?: Pick<Console, "info" | "warn" | "error">;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function resolveMode(options: CartTransformRepairOptions): RepairMode {
  if (options.dryRun && options.apply) {
    throw new Error(
      "Choose either WPB_CART_TRANSFORM_REPAIR_DRY_RUN or WPB_CART_TRANSFORM_REPAIR_APPLY, not both.",
    );
  }
  if (options.apply) return "apply";
  if (options.dryRun) return "dry-run";
  return "disabled";
}

export function parseCartTransformRepairEnv(
  env: Record<string, string | undefined> = process.env,
): CartTransformRepairOptions {
  return {
    dryRun: parseBoolean(env.WPB_CART_TRANSFORM_REPAIR_DRY_RUN),
    apply: parseBoolean(env.WPB_CART_TRANSFORM_REPAIR_APPLY),
  };
}

async function listInstalledShops(prisma: PrismaRepairClient) {
  return prisma.shop.findMany({
    where: { uninstalledAt: null },
    select: { shopDomain: true },
    orderBy: { shopDomain: "asc" },
  });
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Cart Transform repair failed";
}

export async function runCartTransformRepair(
  options: CartTransformRepairOptions,
  deps: CartTransformRepairDependencies,
): Promise<CartTransformRepairSummary> {
  const mode = resolveMode(options);
  if (mode === "disabled") {
    deps.logger?.info?.("[CART_TRANSFORM_REPAIR] Disabled; skipping.");
    return {
      mode,
      scannedShops: 0,
      succeededShops: 0,
      failedShops: 0,
      failures: [],
    };
  }

  const shops = await listInstalledShops(deps.prisma);
  const summary: CartTransformRepairSummary = {
    mode,
    scannedShops: shops.length,
    succeededShops: 0,
    failedShops: 0,
    failures: [],
  };

  deps.logger?.info?.("[CART_TRANSFORM_REPAIR] Target scan complete.", {
    mode,
    scannedShops: summary.scannedShops,
  });

  if (mode === "dry-run") {
    return summary;
  }

  for (const shop of shops) {
    try {
      const admin = await deps.getAdmin(shop.shopDomain);
      const result = await deps.completeSetup(admin, shop.shopDomain);

      if (!result.success) {
        const error = result.error ?? "Cart Transform setup failed";
        summary.failedShops += 1;
        summary.failures.push({ shopDomain: shop.shopDomain, error });
        deps.logger?.error?.("[CART_TRANSFORM_REPAIR] Shop repair failed.", {
          shopDomain: shop.shopDomain,
          error,
        });
        continue;
      }

      summary.succeededShops += 1;
      deps.logger?.info?.("[CART_TRANSFORM_REPAIR] Shop repair succeeded.", {
        shopDomain: shop.shopDomain,
        cartTransformId: result.cartTransformId ?? null,
      });
    } catch (error) {
      const message = toErrorMessage(error);
      summary.failedShops += 1;
      summary.failures.push({ shopDomain: shop.shopDomain, error: message });
      deps.logger?.error?.("[CART_TRANSFORM_REPAIR] Shop repair failed.", {
        shopDomain: shop.shopDomain,
        error: message,
      });
    }
  }

  return summary;
}
