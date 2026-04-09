/**
 * Bundle Pricing Calculation Service
 *
 * Handles all pricing-related calculations for bundles including:
 * - Bundle total price calculation
 * - Component product pricing
 * - Bundle product price updates
 * - In-memory price caching with TTL
 */

import { AppLogger } from "../../lib/logger";
import type { ShopifyAdmin } from "../../lib/auth-guards.server";

// Constants
const MINIMUM_BUNDLE_PRICE = 0.01; // Shopify minimum price (1 cent)
const DEFAULT_FALLBACK_PRICE = "10.00";
const DEFAULT_BUNDLE_PRICE = "1.00";
const PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// In-memory price cache
interface CachedPrice {
  price: string;
  timestamp: number;
}

const priceCache = new Map<string, CachedPrice>();
let cacheStats = {
  hits: 0,
  misses: 0,
  size: 0
};

/**
 * Clears expired entries from the price cache
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  let removedCount = 0;

  for (const [key, value] of priceCache.entries()) {
    if (now - value.timestamp > PRICE_CACHE_TTL) {
      priceCache.delete(key);
      removedCount++;
    }
  }

  if (removedCount > 0) {
    cacheStats.size = priceCache.size;
    AppLogger.debug("[PRICE_CACHE] Cleaned expired entries", {
      component: "pricing-calculation",
    }, { removedCount, currentSize: priceCache.size });
  }
}

/**
 * Gets cached price if available and not expired
 */
function getCachedPrice(productId: string): string | null {
  const cached = priceCache.get(productId);
  if (!cached) {
    cacheStats.misses++;
    return null;
  }

  const now = Date.now();
  if (now - cached.timestamp > PRICE_CACHE_TTL) {
    // Expired
    priceCache.delete(productId);
    cacheStats.size = priceCache.size;
    cacheStats.misses++;
    return null;
  }

  cacheStats.hits++;
  return cached.price;
}

/**
 * Stores price in cache with current timestamp
 */
function setCachedPrice(productId: string, price: string): void {
  priceCache.set(productId, {
    price,
    timestamp: Date.now()
  });
  cacheStats.size = priceCache.size;
}

/**
 * Gets cache statistics for monitoring
 */
export function getPriceCacheStats() {
  const hitRate = cacheStats.hits + cacheStats.misses > 0
    ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1)
    : '0.0';

  return {
    ...cacheStats,
    hitRate: `${hitRate}%`,
    ttlMinutes: PRICE_CACHE_TTL / 60000
  };
}

/**
 * Clears the entire price cache (useful for testing or manual refresh)
 */
export function clearPriceCache(): void {
  const previousSize = priceCache.size;
  priceCache.clear();
  cacheStats = { hits: 0, misses: 0, size: 0 };
  AppLogger.debug("[PRICE_CACHE] Cache cleared", { component: "pricing-calculation" }, { removedCount: previousSize });
}

/**
 * Get product variant price from Shopify (with caching)
 */
export async function getProductPrice(admin: ShopifyAdmin, productId: string): Promise<string> {
  try {
    const cleanProductId = productId.replace('gid://shopify/Product/', '');
    const cacheKey = cleanProductId;

    // Check cache first
    const cachedPrice = getCachedPrice(cacheKey);
    if (cachedPrice !== null) {
      return cachedPrice;
    }

    // Cache miss - fetch from Shopify
    const PRODUCT_PRICE_QUERY = `
      query getProductPrice($id: ID!) {
        product(id: $id) {
          variants(first: 1) {
            edges {
              node {
                price
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(PRODUCT_PRICE_QUERY, {
      variables: {
        id: `gid://shopify/Product/${cleanProductId}`
      }
    });

    const data = await response.json();

    if (data.data?.product?.variants?.edges?.[0]?.node?.price) {
      const price = data.data.product.variants.edges[0].node.price;
      // Store in cache
      setCachedPrice(cacheKey, price);
      return price;
    }

    // Fallback price
    setCachedPrice(cacheKey, DEFAULT_FALLBACK_PRICE);
    return DEFAULT_FALLBACK_PRICE;
  } catch (error) {
    AppLogger.warn("[PRICING] Failed to fetch product price, using fallback", {
      component: "pricing-calculation",
      operation: "getProductPrice",
    }, error instanceof Error ? error : new Error(String(error)));
    return DEFAULT_FALLBACK_PRICE;
  }
}

/**
 * Calculate total bundle price (for discount conversion)
 * This calculates the AVERAGE expected bundle price based on one product selection per step
 */
export async function calculateBundleTotalPrice(admin: ShopifyAdmin, stepsData: any[]): Promise<number> {
  try {
    // Clean expired cache entries periodically
    cleanExpiredCache();

    if (!stepsData || stepsData.length === 0) {
      AppLogger.debug("[BUNDLE_TOTAL_PRICE] No steps found, returning 0", { component: "pricing-calculation" });
      return 0;
    }

    let totalPrice = 0;
    let stepCount = 0;

    // Calculate average price per step (customer selects ONE product per step)
    for (const step of stepsData) {
      if (step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {
        let stepTotalPrice = 0;
        let validProductCount = 0;

        // Get prices for all products in this step
        for (const stepProduct of step.StepProduct) {
          try {
            const productPrice = await getProductPrice(admin, stepProduct.id);
            stepTotalPrice += parseFloat(productPrice);
            validProductCount++;
          } catch (error) {
            AppLogger.warn("[BUNDLE_TOTAL_PRICE] Error getting price for product", {
              component: "pricing-calculation",
            }, { productId: stepProduct.id, error: error instanceof Error ? error.message : String(error) });
          }
        }

        // Calculate average price for this step
        if (validProductCount > 0) {
          const stepAveragePrice = stepTotalPrice / validProductCount;
          const quantity = parseInt(step.minQuantity) || 1;
          const stepContribution = stepAveragePrice * quantity;

          totalPrice += stepContribution;
          stepCount++;

          AppLogger.debug("[BUNDLE_TOTAL_PRICE] Step contribution", {
            component: "pricing-calculation",
          }, { step: stepCount, stepAveragePrice, quantity, stepContribution, validProductCount });
        }
      }
    }

    AppLogger.debug("[BUNDLE_TOTAL_PRICE] Total bundle price", {
      component: "pricing-calculation",
    }, { stepCount, totalPrice });

    // Log cache stats for monitoring
    const stats = getPriceCacheStats();
    AppLogger.info("Price cache statistics", {
      component: "pricing-calculation",
      operation: "calculateBundleTotalPrice",
      cacheHits: stats.hits,
      cacheMisses: stats.misses,
      hitRate: stats.hitRate,
      cacheSize: stats.size,
      ttlMinutes: stats.ttlMinutes
    });

    return totalPrice;
  } catch (error) {
    AppLogger.warn("[BUNDLE_TOTAL_PRICE] Error calculating total bundle price", {
      component: "pricing-calculation",
      operation: "calculateBundleTotalPrice",
    }, error instanceof Error ? error : new Error(String(error)));
    return 0;
  }
}

/**
 * Calculate bundle product price based on component products
 * Customers select ONE product per step, so we calculate average price per step
 */
export async function calculateBundlePrice(admin: ShopifyAdmin, bundle: any): Promise<string> {
  try {
    // Clean expired cache entries periodically
    cleanExpiredCache();

    if (!bundle.steps || bundle.steps.length === 0) {
      AppLogger.debug("[BUNDLE_PRICING] No steps found, using default price", { component: "pricing-calculation" });
      return DEFAULT_BUNDLE_PRICE;
    }

    let totalPrice = 0;
    let stepCount = 0;

    // Calculate average price per step (customer selects ONE product per step)
    for (const step of bundle.steps) {
      if (step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {
        let stepTotalPrice = 0;
        let validProductCount = 0;

        // Get prices for all products in this step
        for (const stepProduct of step.StepProduct) {
          try {
            const productPrice = await getProductPrice(admin, stepProduct.productId);
            stepTotalPrice += parseFloat(productPrice);
            validProductCount++;
          } catch (error) {
            AppLogger.warn("[BUNDLE_PRICING] Error getting price for product", {
              component: "pricing-calculation",
            }, { productId: stepProduct.productId, error: error instanceof Error ? error.message : String(error) });
          }
        }

        // Calculate average price for this step (customer picks ONE)
        if (validProductCount > 0) {
          const stepAveragePrice = stepTotalPrice / validProductCount;
          const quantity = step.minQuantity || 1;
          const stepContribution = stepAveragePrice * quantity;

          totalPrice += stepContribution;
          stepCount++;

          AppLogger.debug("[BUNDLE_PRICING] Step contribution", {
            component: "pricing-calculation",
          }, { step: stepCount, stepAveragePrice, quantity, stepContribution, validProductCount });
        }
      }
    }

    AppLogger.debug("[BUNDLE_PRICING] Pre-discount total", {
      component: "pricing-calculation",
    }, { totalPrice, stepCount });

    // Apply discount if configured (NEW nested structure)
    if (bundle.pricing && bundle.pricing.enabled && bundle.pricing.rules) {
      const rules = Array.isArray(bundle.pricing.rules) ? bundle.pricing.rules : [];
      if (rules.length > 0 && bundle.pricing.method === 'percentage_off') {
        const discountPercent = parseFloat(rules[0].discount?.value) || 0;
        const discountAmount = totalPrice * (discountPercent / 100);
        totalPrice = totalPrice - discountAmount;
        AppLogger.debug("[BUNDLE_PRICING] Applied discount", {
          component: "pricing-calculation",
        }, { discountPercent, discountAmount, totalPrice });
      }
    }

    const finalPrice = Math.max(totalPrice, MINIMUM_BUNDLE_PRICE);
    AppLogger.debug("[BUNDLE_PRICING] Final bundle price", { component: "pricing-calculation" }, { finalPrice });

    // Log cache stats for monitoring
    const stats = getPriceCacheStats();
    AppLogger.info("Price cache statistics", {
      component: "pricing-calculation",
      operation: "calculateBundlePrice",
      cacheHits: stats.hits,
      cacheMisses: stats.misses,
      hitRate: stats.hitRate,
      cacheSize: stats.size,
      ttlMinutes: stats.ttlMinutes
    });

    return finalPrice.toFixed(2);
  } catch (error) {
    AppLogger.warn("[BUNDLE_PRICING] Error calculating bundle price, using default", {
      component: "pricing-calculation",
      operation: "calculateBundlePrice",
    }, error instanceof Error ? error : new Error(String(error)));
    return DEFAULT_BUNDLE_PRICE;
  }
}

/**
 * Update bundle product variant price in Shopify
 */
export async function updateBundleProductPrice(admin: ShopifyAdmin, productId: string, newPrice: string): Promise<void> {
  try {
    AppLogger.debug("[BUNDLE_PRICING] Updating bundle product price", {
      component: "pricing-calculation",
      operation: "updateBundleProductPrice",
    }, { productId, newPrice });

    // First, get the variant ID
    const PRODUCT_VARIANT_QUERY = `
      query getProductVariant($id: ID!) {
        product(id: $id) {
          variants(first: 1) {
            edges {
              node {
                id
                price
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(PRODUCT_VARIANT_QUERY, {
      variables: { id: productId }
    });

    const data = await response.json();
    const variantId = data.data?.product?.variants?.edges?.[0]?.node?.id;
    const currentPrice = data.data?.product?.variants?.edges?.[0]?.node?.price;

    if (!variantId) {
      throw new Error("No variant found for bundle product");
    }

    // Only update if price has changed
    if (currentPrice === newPrice) {
      AppLogger.debug("[BUNDLE_PRICING] Price unchanged, skipping update", {
        component: "pricing-calculation",
      }, { currentPrice });
      return;
    }

    // Update the variant price
    // (productVariantUpdate removed in API 2025-10, use productVariantsBulkUpdate)
    const UPDATE_VARIANT_PRICE = `
      mutation updateVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants {
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

    const updateResponse = await admin.graphql(UPDATE_VARIANT_PRICE, {
      variables: {
        productId,
        variants: [{
          id: variantId,
          price: newPrice
        }]
      }
    });

    const updateData = await updateResponse.json();

    if (updateData.data?.productVariantsBulkUpdate?.userErrors?.length > 0) {
      throw new Error(`Failed to update variant price: ${updateData.data.productVariantsBulkUpdate.userErrors[0].message}`);
    }

    AppLogger.debug("[BUNDLE_PRICING] Successfully updated bundle product price", {
      component: "pricing-calculation",
    }, { from: currentPrice, to: newPrice });
  } catch (error) {
    AppLogger.error("[BUNDLE_PRICING] Error updating bundle product price", {
      component: "pricing-calculation",
      operation: "updateBundleProductPrice",
    }, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
