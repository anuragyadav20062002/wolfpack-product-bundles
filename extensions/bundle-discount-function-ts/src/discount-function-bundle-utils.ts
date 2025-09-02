export interface DiscountRule {
  discountOn: string;
  minimumQuantity: number;
  minimumAmount?: number;
  fixedAmountOff: number;
  percentageOff: number;
  code?: string; // Custom discount code prefix
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
  conditionOperator?: string;
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
  } | null;
}

export interface BundleMatchResult {
  bundle: BundleData;
  matchingLines: any[];
  totalBundleQuantity: number;
  meetsConditions: boolean;
}

export function checkCartMeetsBundleConditions(
  cart: any,
  bundleData: BundleData,
): BundleMatchResult {
  console.log("🔍 [BUNDLE_UTILS] Checking cart meets bundle conditions for:", bundleData.name);
  console.log("🎯 [BUNDLE_UTILS] Bundle product IDs:", bundleData.allBundleProductIds);
  console.log("🛒 [BUNDLE_UTILS] Cart lines count:", cart.lines.length);
  
  const result: BundleMatchResult = {
    bundle: bundleData,
    matchingLines: [],
    totalBundleQuantity: 0,
    meetsConditions: false,
  };

  if (!bundleData.allBundleProductIds || bundleData.allBundleProductIds.length === 0) {
    console.log("⚠️ [BUNDLE_UTILS] Bundle has no product IDs, returning false");
    return result;
  }


  const matchingLines: any[] = [];
  let totalQuantity = 0;

  // Find cart lines that match bundle products AND have the bundle property
  console.log("🔄 [BUNDLE_UTILS] Scanning cart lines for bundle matches");
  for (const line of cart.lines) {
    const productId = line.merchandise?.product?.id;
    console.log("📦 [BUNDLE_UTILS] Checking line - Product ID:", productId, "Quantity:", line.quantity);
    
    // Handle both single attribute object and attribute array
    let bundleIdProperty = null;
    if (line.attribute) {
      if (Array.isArray(line.attribute)) {
        // Array format - find the bundle ID attribute
        bundleIdProperty = line.attribute.find((attr: any) => attr.key === '_wolfpack_bundle_id')?.value;
        console.log("🏷️ [BUNDLE_UTILS] Line attributes (array):", line.attribute.map((attr: any) => `${attr.key}:${attr.value}`));
      } else if (line.attribute.key === '_wolfpack_bundle_id') {
        // Single attribute object format
        bundleIdProperty = line.attribute.value;
        console.log("🏷️ [BUNDLE_UTILS] Line attribute (single):", `${line.attribute.key}:${line.attribute.value}`);
      }
    }
    console.log("🆔 [BUNDLE_UTILS] Bundle ID property found:", bundleIdProperty);
    
    // Line must match this bundle by product ID AND optionally by bundle attribute for validation
    let isMatchingLine = false;
    let matchMethod = '';
    
    // Primary requirement: Product ID must be in bundle configuration
    if (productId && bundleData.allBundleProductIds.includes(productId)) {
      isMatchingLine = true;
      matchMethod = 'product_id';
      console.log("✅ [BUNDLE_UTILS] Line matches by product ID");
      
      // Additional validation: If bundle ID attribute is present, it should match
      if (bundleIdProperty && bundleIdProperty !== bundleData.id) {
        isMatchingLine = false;
        matchMethod = 'bundle_id_mismatch';
        console.log("❌ [BUNDLE_UTILS] Line has mismatched bundle ID attribute");
      } else if (bundleIdProperty === bundleData.id) {
        matchMethod = 'product_id_and_bundle_attribute';
        console.log("✅ [BUNDLE_UTILS] Line matches by both product ID and bundle ID attribute");
      }
    } else {
      console.log("❌ [BUNDLE_UTILS] Line product ID not in bundle configuration");
    }
    
    if (isMatchingLine) {
      console.log("🎯 [BUNDLE_UTILS] Adding matching line:", {
        productId,
        quantity: line.quantity,
        matchMethod
      });
      matchingLines.push(line);
      totalQuantity += line.quantity;
    } else {
      console.log("❌ [BUNDLE_UTILS] Line does not match bundle");
    }
  }
  
  console.log("📊 [BUNDLE_UTILS] Scan complete - Matching lines:", matchingLines.length, "Total quantity:", totalQuantity);


  // Check if bundle conditions are met (minimum quantity from pricing rules)
  const minimumQuantity = bundleData.pricing?.rules?.[0]?.minimumQuantity || 2;
  const meetsConditions = totalQuantity >= minimumQuantity;
  
  console.log("🎯 [BUNDLE_UTILS] Bundle condition evaluation:", {
    totalQuantity,
    minimumQuantity,
    meetsConditions
  });

  result.matchingLines = matchingLines;
  result.totalBundleQuantity = totalQuantity;
  result.meetsConditions = meetsConditions;

  console.log("✅ [BUNDLE_UTILS] Bundle check complete:", {
    bundleName: bundleData.name,
    meetsConditions,
    matchingLinesCount: matchingLines.length,
    totalQuantity
  });

  return result;
}

export function checkStepCondition(
  quantity: number,
  conditionOperator: string,
  conditionValue: number,
): boolean {
  switch (conditionOperator) {
    case "equal_to":
      return quantity === conditionValue;
    case "greater_than":
      return quantity > conditionValue;
    case "less_than":
      return quantity < conditionValue;
    case "greater_than_or_equal_to":
      return quantity >= conditionValue;
    case "less_than_or_equal_to":
      return quantity <= conditionValue;
    default:
      return true;
  }
}

export function parseBundleDataFromMetafield(
  metafieldValue: string,
): BundleData | null {
  try {
    const parsedData = JSON.parse(metafieldValue);
    
    // Handle the new discount function config format
    if (parsedData.type === "discount_function" && parsedData.bundleId) {
      // Transform the new format to the expected BundleData format
      const bundleData: BundleData = {
        id: parsedData.bundleId,
        name: parsedData.name,
        allBundleProductIds: extractProductIdsFromSteps(parsedData.steps || []),
        pricing: parsedData.pricing ? {
          enableDiscount: parsedData.pricing.enabled,
          discountMethod: parsedData.pricing.method,
          rules: parsedData.pricing.rules || []
        } : null
      };
      
      return bundleData;
    }
    
    // Handle legacy format (direct BundleData)
    if (parsedData.id && parsedData.name) {
      return parsedData;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to parse bundle metafield:", error);
    return null;
  }
}

// Helper function to extract product IDs from bundle steps
function extractProductIdsFromSteps(steps: any[]): string[] {
  const productIds: string[] = [];
  
  for (const step of steps) {
    if (step.products && Array.isArray(step.products)) {
      for (const product of step.products) {
        if (product.id && !productIds.includes(product.id)) {
          productIds.push(product.id);
        }
      }
    }
  }
  
  return productIds;
}

export function getBundleDataFromDiscountConfig(input: any): BundleData[] {
  
  if (!input.discount?.configuration?.metafield?.value) {
    return [];
  }

  try {
    const bundleConfig = JSON.parse(input.discount.configuration.metafield.value);
    
    // Return array with single bundle from discount config
    return [bundleConfig];
  } catch (error) {
    return [];
  }
}

export function getAllBundleDataFromShop(input: any): BundleData[] {
  
  if (!input.shop?.metafield?.value) {
    return [];
  }

  try {
    const allBundles = JSON.parse(input.shop.metafield.value);
    
    // Filter to only active bundles with pricing enabled
    const activeBundles = allBundles.filter((bundle: any) => 
      bundle.status === 'active' && 
      bundle.pricing?.enableDiscount === true
    );
    
    
    return activeBundles;
  } catch (error) {
    return [];
  }
}

export function getAllBundleDataFromCart(cart: any, shop?: any): BundleData[] {
  console.log("🔍 [BUNDLE_UTILS] Getting all bundle data from cart and shop");
  console.log("🛒 [BUNDLE_UTILS] Cart has", cart.lines.length, "lines");
  console.log("🏪 [BUNDLE_UTILS] Shop metafield available:", !!shop?.metafield?.value);
  
  const bundles: BundleData[] = [];
  const processedBundles = new Set<string>();

  // Method 1: Get bundles from shop metafields (widget-added products)
  console.log("🔄 [BUNDLE_UTILS] Method 1: Checking shop metafields for bundles");
  if (shop?.metafield?.value) {
    try {
      const allBundles = JSON.parse(shop.metafield.value);
      console.log("📦 [BUNDLE_UTILS] Parsed shop bundles:", allBundles.length, "total bundles");
      
      // Get unique bundle IDs from cart line properties
      const bundleIdsInCart = new Set<string>();
      console.log("🔍 [BUNDLE_UTILS] Scanning cart lines for bundle IDs");
      for (const line of cart.lines) {
        let bundleIdProperty = null;
        if (line.attribute) {
          if (Array.isArray(line.attribute)) {
            bundleIdProperty = line.attribute.find((attr: any) => attr.key === '_wolfpack_bundle_id')?.value;
          } else if (line.attribute.key === '_wolfpack_bundle_id') {
            bundleIdProperty = line.attribute.value;
          }
        }
        if (bundleIdProperty) {
          console.log("🆔 [BUNDLE_UTILS] Found bundle ID in cart:", bundleIdProperty);
          bundleIdsInCart.add(bundleIdProperty);
        }
      }
      console.log("📋 [BUNDLE_UTILS] Unique bundle IDs found in cart:", Array.from(bundleIdsInCart));
      
      // Add bundles that have products in cart
      for (const bundle of allBundles) {
        console.log("🔍 [BUNDLE_UTILS] Checking bundle:", bundle.name, {
          status: bundle.status,
          discountEnabled: bundle.pricing?.enableDiscount,
          inCart: bundleIdsInCart.has(bundle.id)
        });
        if (bundle.status === 'active' && bundle.pricing?.enableDiscount === true && bundleIdsInCart.has(bundle.id)) {
          console.log("✅ [BUNDLE_UTILS] Adding bundle from shop metafield:", bundle.name);
          bundles.push(bundle);
          processedBundles.add(bundle.id);
        }
      }
    } catch (error) {
      console.error('❌ [BUNDLE_UTILS] Failed to parse shop bundles metafield:', error);
    }
  }

  // Method 2: Check all products in cart for bundle discount settings (Bundle Product pages)
  console.log("🔄 [BUNDLE_UTILS] Method 2: Checking product metafields for bundle configurations");
  for (let i = 0; i < cart.lines.length; i++) {
    const line = cart.lines[i];
    console.log("📦 [BUNDLE_UTILS] Checking line", i+1, "- Product:", line.merchandise?.product?.id);

    if (
      line.merchandise.__typename === "ProductVariant" &&
      line.merchandise.product &&
      line.merchandise.product.metafield?.value
    ) {
      console.log("🔍 [BUNDLE_UTILS] Found product metafield, parsing bundle data");
      const bundleData = parseBundleDataFromMetafield(
        line.merchandise.product.metafield.value,
      );
      
      if (bundleData && !processedBundles.has(bundleData.id)) {
        console.log("✅ [BUNDLE_UTILS] Adding bundle from product metafield:", bundleData.name);
        bundles.push(bundleData);
        processedBundles.add(bundleData.id);
      } else if (bundleData) {
        console.log("⏭️ [BUNDLE_UTILS] Bundle already processed:", bundleData.name);
      } else {
        console.log("❌ [BUNDLE_UTILS] Failed to parse bundle data from metafield");
      }
    }
  }

  console.log("🏁 [BUNDLE_UTILS] Bundle collection complete - Found", bundles.length, "bundles");
  console.log("📋 [BUNDLE_UTILS] Bundle names:", bundles.map(b => b.name));
  
  return bundles;
}

export function getBundleDataFromCart(cart: any): BundleData | null {
  const bundles = getAllBundleDataFromCart(cart);
  
  // Return the first valid bundle that meets conditions
  for (const bundle of bundles) {
    const matchResult = checkCartMeetsBundleConditions(cart, bundle);
    if (matchResult.meetsConditions) {
      return bundle;
    }
  }
  
  return null;
}

export function getApplicableDiscountRule(
  bundleData: BundleData,
  totalQuantity: number,
  totalAmount?: number,
): DiscountRule | null {
  console.log("🎯 [BUNDLE_UTILS] Finding applicable discount rule:", {
    bundleName: bundleData.name,
    totalQuantity,
    totalAmount,
    rulesCount: bundleData.pricing?.rules?.length || 0
  });
  
  if (!bundleData.pricing?.rules || bundleData.pricing.rules.length === 0) {
    console.log("❌ [BUNDLE_UTILS] No pricing rules available");
    return null;
  }

  console.log("📋 [BUNDLE_UTILS] Available rules:", bundleData.pricing.rules.map((rule, idx) => ({
    index: idx,
    discountOn: rule.discountOn,
    minimumQuantity: rule.minimumQuantity,
    minimumAmount: rule.minimumAmount,
    fixedAmountOff: rule.fixedAmountOff,
    percentageOff: rule.percentageOff
  })));

  const applicableRules = bundleData.pricing.rules.filter((rule) => {
    // Check quantity-based rules
    if (rule.discountOn === 'quantity' && totalQuantity >= rule.minimumQuantity) {
      console.log("✅ [BUNDLE_UTILS] Rule qualifies (quantity):", {
        discountOn: rule.discountOn,
        totalQuantity,
        minimumQuantity: rule.minimumQuantity
      });
      return true;
    }
    
    // Check amount-based rules
    if (rule.discountOn === 'amount' && totalAmount !== undefined && rule.minimumAmount && totalAmount >= rule.minimumAmount) {
      console.log("✅ [BUNDLE_UTILS] Rule qualifies (amount):", {
        discountOn: rule.discountOn,
        totalAmount,
        minimumAmount: rule.minimumAmount
      });
      return true;
    }

    console.log("❌ [BUNDLE_UTILS] Rule does not qualify:", {
      discountOn: rule.discountOn,
      totalQuantity,
      minimumQuantity: rule.minimumQuantity,
      totalAmount,
      minimumAmount: rule.minimumAmount
    });
    return false;
  });

  // Sort rules by priority: amount-based rules first, then by minimum value descending
  applicableRules.sort((a, b) => {
    if (a.discountOn === 'amount' && b.discountOn === 'quantity') {
      return -1; // Amount-based rules have higher priority
    }
    if (a.discountOn === 'quantity' && b.discountOn === 'amount') {
      return 1; // Quantity-based rules have lower priority
    }
    
    // If both are the same type, sort by minimum value descending
    if (a.discountOn === 'amount' && b.discountOn === 'amount') {
      return (b.minimumAmount || 0) - (a.minimumAmount || 0);
    }
    
    return b.minimumQuantity - a.minimumQuantity;
  });

  console.log("📊 [BUNDLE_UTILS] Applicable rules after sorting:", applicableRules.length);
  const selectedRule = applicableRules.length > 0 ? applicableRules[0] : null;
  
  if (selectedRule) {
    console.log("🎯 [BUNDLE_UTILS] Selected rule:", {
      discountOn: selectedRule.discountOn,
      minimumQuantity: selectedRule.minimumQuantity,
      minimumAmount: selectedRule.minimumAmount,
      fixedAmountOff: selectedRule.fixedAmountOff,
      percentageOff: selectedRule.percentageOff
    });
  } else {
    console.log("❌ [BUNDLE_UTILS] No applicable rules found");
  }

  return selectedRule;
}
