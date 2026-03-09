/**
 * Bundle Inventory Sync Service
 *
 * Calculates and maintains bundle inventory based on component product stock levels.
 * Formula: bundle_stock = MIN(component_inventory[i] / component_quantity[i])
 *
 * Uses `inventoryAdjustQuantities` (not the deprecated `inventoryAdjustQuantity`).
 */

import db from "../../db.server";
import { AppLogger } from "../../lib/logger";

const DEBOUNCE_SECONDS = 60;
const UNLIMITED_STOCK = 999;

// --- GraphQL Queries/Mutations ---

const GET_BUNDLE_VARIANT_INVENTORY = `
  query getBundleVariantInventory($productId: ID!) {
    product(id: $productId) {
      variants(first: 1) {
        edges {
          node {
            id
            inventoryItem {
              id
            }
          }
        }
      }
    }
  }
`;

const GET_PRODUCT_VARIANT_INVENTORY = `
  query getProductVariantInventory($productId: ID!) {
    product(id: $productId) {
      variants(first: 1) {
        edges {
          node {
            id
            inventoryItem {
              id
              tracked
              inventoryLevels(first: 1) {
                edges {
                  node {
                    quantities(names: ["available"]) {
                      name
                      quantity
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const GET_INVENTORY_LEVEL = `
  query getInventoryLevel($inventoryItemId: ID!) {
    inventoryItem(id: $inventoryItemId) {
      inventoryLevels(first: 1) {
        edges {
          node {
            id
            location {
              id
            }
            quantities(names: ["available"]) {
              name
              quantity
            }
          }
        }
      }
    }
  }
`;

const INVENTORY_ADJUST_QUANTITIES = `
  mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
    inventoryAdjustQuantities(input: $input) {
      inventoryAdjustmentGroup {
        reason
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// --- Types ---

interface ComponentInventory {
  available: number | null;
  quantity: number;
}

interface SyncResult {
  success: boolean;
  skipped: boolean;
  bundleId?: string;
  inventory?: number;
  error?: string;
}

// --- Pure Calculation ---

/**
 * Calculate minimum bundle inventory from component inventories.
 *
 * Formula: MIN(available[i] / quantity[i]) for all tracked components.
 * - Untracked components (available === null) are excluded from MIN.
 * - If ALL components are untracked, returns 999 (unlimited).
 * - Empty array returns 0.
 */
export function calculateMinInventory(components: ComponentInventory[]): number {
  if (components.length === 0) return 0;

  const tracked = components.filter((c) => c.available !== null);

  if (tracked.length === 0) return UNLIMITED_STOCK;

  return Math.min(
    ...tracked.map((c) => Math.floor((c.available as number) / c.quantity))
  );
}

// --- Shopify API Operations ---

/**
 * Query component product inventories and calculate bundle stock level.
 * Queries each product individually for its first variant's inventory.
 */
export async function calculateBundleInventory(
  admin: any,
  componentProducts: Array<{ productId: string; quantity: number }>
): Promise<number> {
  if (componentProducts.length === 0) return 0;

  const components: ComponentInventory[] = [];

  for (const cp of componentProducts) {
    const response = await admin.graphql(GET_PRODUCT_VARIANT_INVENTORY, {
      variables: { productId: cp.productId },
    });
    const data = await response.json();

    const variant = data.data?.product?.variants?.edges?.[0]?.node;

    if (!variant || !variant.inventoryItem) {
      components.push({ available: null, quantity: cp.quantity });
      continue;
    }

    const tracked = variant.inventoryItem.tracked;
    if (!tracked) {
      components.push({ available: null, quantity: cp.quantity });
      continue;
    }

    const levels = variant.inventoryItem.inventoryLevels?.edges || [];
    const available =
      levels[0]?.node?.quantities?.find((q: any) => q.name === "available")
        ?.quantity ?? 0;

    components.push({ available, quantity: cp.quantity });
  }

  return calculateMinInventory(components);
}

/**
 * Set inventory level on a bundle variant's inventory item.
 * Uses delta adjustment (target - current) via inventoryAdjustQuantities.
 */
export async function setInventoryLevel(
  admin: any,
  inventoryItemId: string,
  targetQuantity: number
): Promise<void> {
  // Get current inventory level and location
  const response = await admin.graphql(GET_INVENTORY_LEVEL, {
    variables: { inventoryItemId },
  });
  const data = await response.json();

  const level = data.data?.inventoryItem?.inventoryLevels?.edges?.[0]?.node;
  if (!level) {
    AppLogger.warn("No inventory level found for item", {
      component: "inventory-sync",
      operation: "setInventoryLevel",
    }, { inventoryItemId });
    return;
  }

  const currentQuantity =
    level.quantities?.find((q: any) => q.name === "available")?.quantity ?? 0;
  const locationId = level.location.id;
  const delta = targetQuantity - currentQuantity;

  if (delta === 0) {
    return; // No change needed
  }

  await admin.graphql(INVENTORY_ADJUST_QUANTITIES, {
    variables: {
      input: {
        reason: "correction",
        name: "available",
        changes: [
          {
            inventoryItemId,
            locationId,
            delta,
          },
        ],
      },
    },
  });
}

// --- Full Sync Flow ---

/**
 * Sync a single bundle's inventory.
 * Queries component stock, calculates MIN, sets bundle inventory.
 * Implements debounce: skips if synced < 60s ago.
 */
export async function syncBundleInventory(
  admin: any,
  bundleId: string
): Promise<SyncResult> {
  try {
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId },
      include: {
        steps: {
          include: {
            StepProduct: true,
          },
        },
      },
    });

    if (!bundle || !bundle.shopifyProductId) {
      return {
        success: false,
        skipped: true,
        bundleId,
        error: "Bundle not found or has no Shopify product",
      };
    }

    // Debounce: skip if synced less than 60 seconds ago
    if (bundle.inventorySyncedAt) {
      const secondsSinceSync =
        (Date.now() - bundle.inventorySyncedAt.getTime()) / 1000;
      if (secondsSinceSync < DEBOUNCE_SECONDS) {
        return { success: true, skipped: true, bundleId };
      }
    }

    // Collect all component products with their quantities
    const componentProducts: Array<{ productId: string; quantity: number }> = [];
    for (const step of bundle.steps) {
      for (const sp of step.StepProduct) {
        componentProducts.push({
          productId: sp.productId,
          quantity: sp.minQuantity || 1,
        });
      }
    }

    if (componentProducts.length === 0) {
      return { success: true, skipped: true, bundleId, inventory: 0 };
    }

    // Get bundle variant's inventory item ID
    const variantResponse = await admin.graphql(GET_BUNDLE_VARIANT_INVENTORY, {
      variables: { productId: bundle.shopifyProductId },
    });
    const variantData = await variantResponse.json();
    const inventoryItemId =
      variantData.data?.product?.variants?.edges?.[0]?.node?.inventoryItem?.id;

    if (!inventoryItemId) {
      return {
        success: false,
        skipped: false,
        bundleId,
        error: "No inventory item found for bundle variant",
      };
    }

    // Calculate and set inventory
    const targetInventory = await calculateBundleInventory(
      admin,
      componentProducts
    );
    await setInventoryLevel(admin, inventoryItemId, targetInventory);

    // Update sync timestamps
    await db.bundle.update({
      where: { id: bundleId },
      data: {
        inventorySyncedAt: new Date(),
        inventoryStaleAt: null,
      },
    });

    AppLogger.info("Bundle inventory synced", {
      component: "inventory-sync",
      operation: "syncBundleInventory",
    }, { bundleId, inventory: targetInventory });

    return {
      success: true,
      skipped: false,
      bundleId,
      inventory: targetInventory,
    };
  } catch (error) {
    AppLogger.error("Failed to sync bundle inventory", {
      component: "inventory-sync",
      operation: "syncBundleInventory",
    }, error);

    return {
      success: false,
      skipped: false,
      bundleId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
