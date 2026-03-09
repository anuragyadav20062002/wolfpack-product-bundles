/**
 * Bundle Migration API Route
 *
 * Batch-updates existing bundles with correct prices and inventory management.
 * Idempotent — safe to re-run.
 *
 * POST /api/migrate-bundles
 * Requires authenticated admin session.
 */

import { json } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import db from "../../db.server";
import { AppLogger } from "../../lib/logger";
import { calculateBundlePrice } from "../../services/bundles/pricing-calculation.server";
import { syncBundleInventory } from "../../services/bundles/inventory-sync.server";

export async function action({ request }: any) {
  const { session, admin } = await requireAdminSession(request);

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    details: [] as Array<{ bundleId: string; name: string; status: string; error?: string }>,
  };

  try {
    // Get all bundles with Shopify products
    const bundles = await db.bundle.findMany({
      where: {
        shopId: session.shop,
        shopifyProductId: { not: null },
        status: { in: ["active", "draft"] },
      },
      include: {
        steps: {
          include: {
            StepProduct: true,
          },
        },
        pricing: true,
      },
    });

    results.total = bundles.length;

    if (bundles.length === 0) {
      return json({ ...results, message: "No bundles to migrate" });
    }

    // GraphQL queries
    const GET_VARIANT = `
      query getVariant($productId: ID!) {
        product(id: $productId) {
          variants(first: 1) {
            edges {
              node {
                id
                price
                inventoryItem {
                  id
                  tracked
                }
              }
            }
          }
        }
      }
    `;

    const UPDATE_VARIANT = `
      mutation updateVariant($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    for (const bundle of bundles) {
      try {
        // 1. Get current variant data
        const variantResponse = await admin.graphql(GET_VARIANT, {
          variables: { productId: bundle.shopifyProductId },
        });
        const variantData = await variantResponse.json();
        const variant = variantData.data?.product?.variants?.edges?.[0]?.node;

        if (!variant) {
          results.skipped++;
          results.details.push({
            bundleId: bundle.id,
            name: bundle.name,
            status: "skipped",
            error: "Shopify product/variant not found (may have been deleted)",
          });
          continue;
        }

        // 2. Calculate bundle price
        let newPrice: string;
        try {
          newPrice = await calculateBundlePrice(admin, bundle);
        } catch {
          newPrice = "1.00"; // fallback
        }

        // 3. Update variant price + enable inventory management
        const updateResponse = await admin.graphql(UPDATE_VARIANT, {
          variables: {
            input: {
              id: variant.id,
              price: newPrice,
              inventoryManagement: "SHOPIFY",
            },
          },
        });
        const updateData = await updateResponse.json();

        if (updateData.data?.productVariantUpdate?.userErrors?.length > 0) {
          const errorMsg = updateData.data.productVariantUpdate.userErrors[0].message;
          results.failed++;
          results.details.push({
            bundleId: bundle.id,
            name: bundle.name,
            status: "failed",
            error: errorMsg,
          });
          continue;
        }

        // 4. Sync inventory
        try {
          await syncBundleInventory(admin, bundle.id);
        } catch (syncError) {
          AppLogger.warn("Inventory sync failed during migration (non-fatal)", {
            component: "api.migrate-bundles",
            operation: "migrate",
          }, { bundleId: bundle.id, error: syncError });
        }

        results.success++;
        results.details.push({
          bundleId: bundle.id,
          name: bundle.name,
          status: "success",
        });
      } catch (bundleError) {
        results.failed++;
        results.details.push({
          bundleId: bundle.id,
          name: bundle.name,
          status: "failed",
          error: bundleError instanceof Error ? bundleError.message : "Unknown error",
        });
      }
    }

    AppLogger.info("Bundle migration completed", {
      component: "api.migrate-bundles",
      operation: "migrate",
    }, {
      total: results.total,
      success: results.success,
      failed: results.failed,
      skipped: results.skipped,
    });

    return json(results);
  } catch (error) {
    AppLogger.error("Bundle migration failed", {
      component: "api.migrate-bundles",
      operation: "migrate",
    }, error);

    return json(
      { ...results, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
