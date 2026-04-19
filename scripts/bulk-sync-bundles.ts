/**
 * Bulk Bundle Sync Script
 *
 * One-shot script to sync all bundles in the database in a single run.
 * Backfills `component_parents` metafields on component variants for bundles
 * created before Cart Transform MERGE was implemented.
 *
 * What it does per bundle:
 *  - FPB without `shopifyProductId`: creates Shopify container product + URL redirect
 *  - All bundles with `shopifyProductId`: writes `component_parents` to component variants
 *    (enables Cart Transform MERGE) and writes `bundle_ui_config` to the bundle variant
 *
 * Usage:
 *   npm run bulk-sync                         # Sync all bundles in DB
 *   npm run bulk-sync -- --dry-run            # Preview without writing anything
 *   npm run bulk-sync -- --shop <domain>      # Limit to one shop
 *   npm run bulk-sync -- --bundle <id>        # Limit to one bundle
 *   npm run bulk-sync -- --skip-product-create  # Skip product creation for FPBs without one
 *
 * Environment (loaded from .env.prod by default):
 *   DATABASE_URL        - Database connection string
 *   SHOPIFY_API_KEY     - App API key
 *   SHOPIFY_API_SECRET  - App API secret
 *   SHOPIFY_APP_URL     - App URL (required to initialise shopifyApp())
 */

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.prod relative to project root before any app imports
const envPath = process.argv.includes("--env")
  ? process.argv[process.argv.indexOf("--env") + 1]
  : path.resolve(__dirname, "../.env.prod");

config({ path: envPath });

// ─── CLI flags ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SKIP_PRODUCT_CREATE = args.includes("--skip-product-create");

const shopFlag = args.includes("--shop") ? args[args.indexOf("--shop") + 1] : null;
const bundleFlag = args.includes("--bundle") ? args[args.indexOf("--bundle") + 1] : null;

// Delay between bundles (ms) — avoids hitting Shopify API rate limits
const BUNDLE_DELAY_MS = 500;
// Delay between shops (ms)
const SHOP_DELAY_MS = 1000;

// ─── Imports (after env is loaded) ───────────────────────────────────────────

// Dynamic imports so shopifyApp() initialises with env vars already set
const { default: db } = await import("../app/db.server");
const { unauthenticated } = await import("../app/shopify.server");
const { updateComponentProductMetafields } = await import(
  "../app/services/bundles/metafield-sync/operations/component-product.server"
);
const { updateBundleProductMetafields } = await import(
  "../app/services/bundles/metafield-sync/operations/bundle-product.server"
);
const { calculateBundlePrice } = await import(
  "../app/services/bundles/pricing-calculation.server"
);
const { BundleType } = await import("../app/constants/bundle");
const { SHOPIFY_REST_API_VERSION } = await import("../app/constants/api");

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncResult {
  bundleId: string;
  bundleName: string;
  shop: string;
  status: "ok" | "skipped" | "error" | "dry-run";
  action?: string;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(msg: string): void {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

/**
 * Create a Shopify product for an FPB bundle that has none.
 * Mirrors the logic in handleSyncBundle (handlers.server.ts).
 */
async function createFpbProduct(
  admin: any,
  bundle: any,
  dryRun: boolean,
): Promise<string | null> {
  if (dryRun) {
    log(`  [DRY-RUN] Would create Shopify product for FPB bundle "${bundle.name}" (${bundle.id})`);
    return null;
  }

  let bundlePrice = "0.00";
  try {
    bundlePrice = await calculateBundlePrice(admin, bundle);
  } catch {
    // Non-fatal — use 0.00 as fallback
  }

  const response = await admin.graphql(
    `mutation CreateBundleProduct($input: ProductInput!) {
      productCreate(input: $input) {
        product { id handle }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        input: {
          title: bundle.name,
          handle: `bundle-${bundle.id}`,
          productType: "Bundle",
          vendor: "Bundle Builder",
          status: "ACTIVE",
          descriptionHtml: bundle.description ?? `${bundle.name} - Bundle Product`,
          tags: ["bundle", "cart-transform"],
          variants: [{ price: bundlePrice, inventoryPolicy: "CONTINUE" }],
        },
      },
    },
  );

  const responseData = (await response.json()) as { data?: Record<string, any> };
  const userErrors = responseData.data?.productCreate?.userErrors ?? [];

  if (userErrors.length > 0) {
    throw new Error(`Shopify product creation errors: ${JSON.stringify(userErrors)}`);
  }

  const productId = responseData.data?.productCreate?.product?.id ?? null;
  const productHandle = responseData.data?.productCreate?.product?.handle ?? null;

  if (!productId) {
    throw new Error("productCreate returned no product ID");
  }

  // Persist to DB
  await db.bundle.update({
    where: { id: bundle.id },
    data: { shopifyProductId: productId },
  });

  // Create URL redirect /products/{handle} → /pages/{pageHandle} (non-fatal)
  if (productHandle && bundle.shopifyPageHandle) {
    try {
      await createRedirect(admin, productHandle, bundle.shopifyPageHandle);
    } catch (err) {
      log(`  [WARN] Failed to create URL redirect for bundle ${bundle.id}: ${err}`);
    }
  }

  return productId;
}

/**
 * Create a Shopify URL redirect from /products/{productHandle} → /pages/{pageHandle}.
 * Uses REST API (same approach as the main route handler).
 */
async function createRedirect(
  admin: any,
  productHandle: string,
  pageHandle: string,
): Promise<void> {
  const response = await admin.rest.post({
    path: `redirects`,
    data: {
      redirect: {
        path: `/products/${productHandle}`,
        target: `/pages/${pageHandle}`,
      },
    },
    apiVersion: SHOPIFY_REST_API_VERSION,
  });

  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`Redirect creation returned HTTP ${response.status}`);
  }
}

// ─── Per-bundle sync ──────────────────────────────────────────────────────────

async function syncBundle(admin: any, bundle: any, dryRun: boolean): Promise<SyncResult> {
  const base = { bundleId: bundle.id, bundleName: bundle.name, shop: bundle.shopId };

  try {
    let shopifyProductId: string | null = bundle.shopifyProductId ?? null;

    // FPB with no Shopify product — create one first
    if (bundle.bundleType === BundleType.full_page && !shopifyProductId && !SKIP_PRODUCT_CREATE) {
      const created = await createFpbProduct(admin, bundle, dryRun);
      if (dryRun) {
        return { ...base, status: "dry-run", action: "would-create-product-then-sync-metafields" };
      }
      shopifyProductId = created;
    }

    if (!shopifyProductId) {
      return {
        ...base,
        status: "skipped",
        action: "no-shopify-product-id (use --skip-product-create=false to create one)",
      };
    }

    if (dryRun) {
      return {
        ...base,
        status: "dry-run",
        action: `would-sync-metafields for product ${shopifyProductId}`,
      };
    }

    // Write component_parents to all component variant metafields
    await updateComponentProductMetafields(admin, shopifyProductId, bundle);

    // Write bundle_ui_config + component_reference to the bundle variant
    await updateBundleProductMetafields(admin, shopifyProductId, bundle);

    return { ...base, status: "ok", action: "metafields-written" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ...base, status: "error", error: message };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("=".repeat(70));
  console.log("Bulk Bundle Sync Script");
  console.log("=".repeat(70));
  console.log();
  console.log(`  Env file:            ${envPath}`);
  console.log(`  DATABASE_URL:        ${process.env.DATABASE_URL ? "loaded" : "MISSING"}`);
  console.log(`  SHOPIFY_API_KEY:     ${process.env.SHOPIFY_API_KEY ? "loaded" : "MISSING"}`);
  console.log(`  SHOPIFY_APP_URL:     ${process.env.SHOPIFY_APP_URL ?? "MISSING"}`);
  console.log(`  Dry run:             ${DRY_RUN}`);
  console.log(`  Skip product create: ${SKIP_PRODUCT_CREATE}`);
  console.log(`  Filter shop:         ${shopFlag ?? "all"}`);
  console.log(`  Filter bundle:       ${bundleFlag ?? "all"}`);
  console.log();

  if (!process.env.DATABASE_URL || !process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_APP_URL) {
    console.error("ERROR: Missing required environment variables. Check .env.prod.");
    process.exit(1);
  }

  // ── Fetch all bundles ──────────────────────────────────────────────────────

  const whereClause: Record<string, any> = {};
  if (shopFlag) whereClause.shopId = shopFlag;
  if (bundleFlag) whereClause.id = bundleFlag;

  const bundles = await db.bundle.findMany({
    where: whereClause,
    include: {
      steps: {
        include: { StepProduct: true },
        orderBy: { position: "asc" },
      },
      pricing: true,
    },
    orderBy: [{ shopId: "asc" }, { createdAt: "asc" }],
  });

  if (bundles.length === 0) {
    log("No bundles found matching the given filters. Exiting.");
    process.exit(0);
  }

  log(`Found ${bundles.length} bundle(s) to process.`);
  console.log();

  // ── Group by shop ──────────────────────────────────────────────────────────

  const byShop = new Map<string, typeof bundles>();
  for (const bundle of bundles) {
    const list = byShop.get(bundle.shopId) ?? [];
    list.push(bundle);
    byShop.set(bundle.shopId, list);
  }

  log(`Bundles span ${byShop.size} shop(s).`);
  console.log();

  // ── Process shops ──────────────────────────────────────────────────────────

  const results: SyncResult[] = [];
  let shopIndex = 0;

  for (const [shopDomain, shopBundles] of byShop) {
    shopIndex++;
    log(`── Shop ${shopIndex}/${byShop.size}: ${shopDomain} (${shopBundles.length} bundles)`);

    let admin: any;
    try {
      const session = await unauthenticated.admin(shopDomain);
      admin = session.admin;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log(`  [ERROR] Could not get admin client for ${shopDomain}: ${message}`);
      log(`  Skipping all ${shopBundles.length} bundles for this shop.`);
      for (const b of shopBundles) {
        results.push({
          bundleId: b.id,
          bundleName: b.name,
          shop: shopDomain,
          status: "error",
          error: `admin client unavailable: ${message}`,
        });
      }
      await sleep(SHOP_DELAY_MS);
      continue;
    }

    for (let i = 0; i < shopBundles.length; i++) {
      const bundle = shopBundles[i];
      log(`  [${i + 1}/${shopBundles.length}] "${bundle.name}" (${bundle.id})`);

      const result = await syncBundle(admin, bundle, DRY_RUN);
      results.push(result);

      const icon =
        result.status === "ok" ? "✅" :
        result.status === "dry-run" ? "🔵" :
        result.status === "skipped" ? "⏭️" : "❌";

      log(`    ${icon} ${result.status}${result.action ? ` — ${result.action}` : ""}${result.error ? ` — ${result.error}` : ""}`);

      if (i < shopBundles.length - 1) {
        await sleep(BUNDLE_DELAY_MS);
      }
    }

    if (shopIndex < byShop.size) {
      await sleep(SHOP_DELAY_MS);
    }

    console.log();
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  const ok = results.filter((r) => r.status === "ok").length;
  const dryRun = results.filter((r) => r.status === "dry-run").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error");

  console.log("=".repeat(70));
  console.log("Summary");
  console.log("=".repeat(70));
  console.log(`  Total:   ${results.length}`);
  console.log(`  ✅ OK:    ${ok}`);
  if (DRY_RUN) console.log(`  🔵 DRY:  ${dryRun}`);
  console.log(`  ⏭️  Skip: ${skipped}`);
  console.log(`  ❌ Error: ${errors.length}`);

  if (errors.length > 0) {
    console.log();
    console.log("Errors:");
    for (const e of errors) {
      console.log(`  - [${e.shop}] "${e.bundleName}" (${e.bundleId}): ${e.error}`);
    }
  }

  console.log();

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
