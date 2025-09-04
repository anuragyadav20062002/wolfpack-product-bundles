export interface DiscountRule {
  discountOn: string;
  minimumQuantity: number;
  fixedAmountOff: number;
  percentageOff: number;
}

export interface BundleProduct {
  id: string;
  title: string;
  variants?: Array<{ id: string; title: string; price?: string }>;
}

export interface BundleStep {
  id: string;
  name: string;
  products: BundleProduct[];
  collections: Array<{ id: string; title: string }>;
  minQuantity: number;
  maxQuantity: number;
  conditionType?: string;
  conditionValue?: number;
  enabled?: boolean;
}

export interface BundleData {
  id: string;
  name: string;
  allBundleProductIds: string[]; // All product IDs that are part of this bundle
  pricing: {
    enableDiscount: boolean;
    discountMethod: string;
    rules: DiscountRule[];
    fixedPrice?: number; // For fixed_bundle_price method
    bundleVariantId?: string; // For fixed_bundle_price method
  } | null;
}

export interface BundleMatchResult {
  bundle: BundleData;
  matchingLines: any[];
  totalBundleQuantity: number;
  meetsConditions: boolean;
  totalOriginalCost: number;
  totalDiscountedCost: number;
}

export function checkCartMeetsBundleConditions(
  cart: any,
  bundleData: BundleData,
): BundleMatchResult {
  const result: BundleMatchResult = {
    bundle: bundleData,
    matchingLines: [],
    totalBundleQuantity: 0,
    meetsConditions: false,
    totalOriginalCost: 0,
    totalDiscountedCost: 0,
  };

  // For bundles loaded from shop metafields (widget-added), we don't need predefined product IDs
  // We'll match by cart line attributes instead

  const matchingLines: any[] = [];
  let totalQuantity = 0;
  let totalOriginalCost = 0;

  console.log(`🔍 [CART TRANSFORM DEBUG] Checking bundle conditions for bundle: ${bundleData.id}`);
  console.log(`🔍 [CART TRANSFORM DEBUG] Bundle allBundleProductIds:`, bundleData.allBundleProductIds);

  // Find cart lines that match this bundle (either by product ID or by bundle attribute)
  for (const line of cart.lines) {
    let isMatchingLine = false;
    
    console.log(`🔍 [CART TRANSFORM DEBUG] Checking line: ${line.id}`);
    console.log(`🔍 [CART TRANSFORM DEBUG] Line attribute:`, line.attribute);
    console.log(`🔍 [CART TRANSFORM DEBUG] Line product ID:`, line.merchandise?.product?.id);
    
    // Method 1: Match by product ID (for Bundle Product pages)
    const productId = line.merchandise?.product?.id;
    if (productId && bundleData.allBundleProductIds.includes(productId)) {
      isMatchingLine = true;
      console.log(`🔍 [CART TRANSFORM DEBUG] Found matching line by product ID: line=${line.id}, product=${productId}`);
    }
    
    // Method 2: Match by bundle ID attribute (for widget-added products)
    if (line.attribute && line.attribute.value === bundleData.id) {
      isMatchingLine = true;
      console.log(`🔍 [CART TRANSFORM DEBUG] Found matching line by attribute: line=${line.id}, bundle=${bundleData.id}`);
    }
    
    
    if (isMatchingLine) {
      matchingLines.push(line);
      totalQuantity += line.quantity;
      totalOriginalCost += parseFloat(line.cost.totalAmount.amount);
    }
  }

  // Check if bundle conditions are met (minimum quantity from pricing rules or default to 2)
  const minimumQuantity = bundleData.pricing?.rules?.[0]?.minimumQuantity || 2;
  const meetsConditions = totalQuantity >= minimumQuantity && matchingLines.length >= 2;

  // Calculate discounted cost if conditions are met
  let totalDiscountedCost = totalOriginalCost;
  
  if (meetsConditions && bundleData.pricing?.enableDiscount) {
    const applicableRule = getApplicableDiscountRule(bundleData, totalQuantity);
    
    if (applicableRule) {
      if (bundleData.pricing.discountMethod === "fixed_amount_off") {
        totalDiscountedCost = Math.max(0, totalOriginalCost - applicableRule.fixedAmountOff);
        console.log(`🔍 [CART TRANSFORM DEBUG] Fixed amount discount: ${totalOriginalCost} - ${applicableRule.fixedAmountOff} = ${totalDiscountedCost}`);
      } else if (bundleData.pricing.discountMethod === "percentage_off") {
        totalDiscountedCost = totalOriginalCost * (1 - applicableRule.percentageOff / 100);
        console.log(`🔍 [CART TRANSFORM DEBUG] Percentage discount: ${totalOriginalCost} * (1 - ${applicableRule.percentageOff}/100) = ${totalDiscountedCost}`);
      } else if (bundleData.pricing.discountMethod === "fixed_bundle_price" && bundleData.pricing.fixedPrice && bundleData.pricing.fixedPrice > 0) {
        totalDiscountedCost = bundleData.pricing.fixedPrice;
        console.log(`🔍 [CART TRANSFORM DEBUG] Fixed bundle price: ${totalDiscountedCost}`);
      }
    } else {
      console.log(`🔍 [CART TRANSFORM DEBUG] No applicable rule found for quantity: ${totalQuantity}`);
    }
  } else {
    console.log(`🔍 [CART TRANSFORM DEBUG] Conditions not met or discount disabled`);
  }

  result.matchingLines = matchingLines;
  result.totalBundleQuantity = totalQuantity;
  result.meetsConditions = meetsConditions;
  result.totalOriginalCost = totalOriginalCost;
  result.totalDiscountedCost = totalDiscountedCost;

  return result;
}

export function parseBundleDataFromMetafield(
  metafieldValue: string,
): BundleData | null {
  try {
    return JSON.parse(metafieldValue);
  } catch (error) {
    return null;
  }
}

export function getAllBundleDataFromCart(cart: any, shop: any): BundleData[] {
  const bundles: BundleData[] = [];
  const processedBundles = new Set<string>();

  // Get shop-level bundle data for lookups
  let shopBundlesData = null;
  if (shop?.metafield?.value) {
    try {
      shopBundlesData = JSON.parse(shop.metafield.value);
      console.log("🔍 [CART TRANSFORM DEBUG] Shop bundles data loaded:", Object.keys(shopBundlesData || {}).length, "bundles");
    } catch (error) {
      console.error("🔍 [CART TRANSFORM DEBUG] Failed to parse shop bundles data:", error);
    }
  }

  // Check all cart lines for bundle products (both Bundle Products with metafields and individual products with bundle properties)
  for (let i = 0; i < cart.lines.length; i++) {
    const line = cart.lines[i];

    if (line.merchandise.__typename === "ProductVariant" && line.merchandise.product) {
      // Method 1: Check if this is a Bundle Product with metafields (for bundle product page)
      if (line.merchandise.product.metafield?.value) {
        const bundleData = parseBundleDataFromMetafield(
          line.merchandise.product.metafield.value,
        );
        
        if (bundleData && !processedBundles.has(bundleData.id)) {
          bundles.push(bundleData);
          processedBundles.add(bundleData.id);
        }
      }

      // Method 2: Check if this line has bundle properties (for individual products added via widget)
      let bundleId = null;
      
      // Check in attributes
      if (line.attribute && line.attribute.key === '_wolfpack_bundle_id' && line.attribute.value) {
        bundleId = line.attribute.value;
        console.log(`🔍 [CART TRANSFORM DEBUG] Found bundle ID in attributes: ${bundleId}`);
      }
      
      
      if (bundleId) {
        
        if (!processedBundles.has(bundleId)) {
          console.log(`🔍 [CART TRANSFORM DEBUG] Found bundle product with bundle ID: ${bundleId}`);
          
          // Look up bundle data from shop metafields
          let bundleData: BundleData | null = null;
          if (shopBundlesData && shopBundlesData[bundleId]) {
            const shopBundle = shopBundlesData[bundleId];
            bundleData = {
              id: bundleId,
              name: shopBundle.name || `Bundle ${bundleId}`,
              allBundleProductIds: [], // Will be populated during matching by collecting all product IDs
              pricing: shopBundle.pricing || {
                enableDiscount: false, // Don't apply discount by default unless configured
                discountMethod: "percentage_off",
                rules: [{
                  discountOn: "total",
                  minimumQuantity: 2,
                  fixedAmountOff: 0,
                  percentageOff: 0
                }],
                fixedPrice: shopBundle.pricing?.fixedPrice,
                bundleVariantId: shopBundle.pricing?.bundleVariantId
              }
            };
            console.log(`🔍 [CART TRANSFORM DEBUG] Found bundle data from shop metafields:`, bundleData.name);
          } else {
            // Fallback: create placeholder bundle data
            bundleData = {
              id: bundleId,
              name: `Bundle ${bundleId}`,
              allBundleProductIds: [],
              pricing: {
                enableDiscount: false,
                discountMethod: "percentage_off",
                rules: [{
                  discountOn: "total",
                  minimumQuantity: 2,
                  fixedAmountOff: 0,
                  percentageOff: 0
                }]
              }
            };
            console.log(`🔍 [CART TRANSFORM DEBUG] Using placeholder bundle data for:`, bundleId);
          }
          
          if (bundleData) {
            bundles.push(bundleData);
            processedBundles.add(bundleId);
          }
        }
      }
    }
  }

  return bundles;
}

export function getApplicableDiscountRule(
  bundleData: BundleData,
  totalQuantity: number,
): DiscountRule | null {
  if (!bundleData.pricing?.rules || bundleData.pricing.rules.length === 0) {
    return null;
  }

  // Sort rules by minimum quantity descending to get the best applicable discount
  const applicableRules = bundleData.pricing.rules
    .filter((rule) => totalQuantity >= rule.minimumQuantity)
    .sort((a, b) => b.minimumQuantity - a.minimumQuantity);

  return applicableRules.length > 0 ? applicableRules[0] : null;
}