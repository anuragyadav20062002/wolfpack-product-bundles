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
  steps: BundleStep[];
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
  const result: BundleMatchResult = {
    bundle: bundleData,
    matchingLines: [],
    totalBundleQuantity: 0,
    meetsConditions: false,
  };

  if (!bundleData.steps || bundleData.steps.length === 0) {
    return result;
  }

  // Check if there are any enabled steps
  const enabledSteps = bundleData.steps.filter(
    (step) => step.enabled !== false,
  );
  if (enabledSteps.length === 0) {
    return result; // All steps are disabled
  }

  let allStepsMet = true;
  const allMatchingLines: any[] = [];
  let totalQuantity = 0;

  // Check if cart contains products from each required step
  for (const step of enabledSteps) {
    const stepProductIds = step.products.map((p) => p.id);
    const stepCollectionIds = step.collections.map((c) => c.id);
    
    console.log(`🔍 DEBUG - Checking step "${step.name}"`, {
      stepId: step.id,
      expectedProductIds: stepProductIds,
      minQuantity: step.minQuantity,
      maxQuantity: step.maxQuantity
    });
    
    // Find cart lines that match this step's products or collections
    const stepMatchingLines = cart.lines.filter((line: any) => {
      console.log(`🔍 DEBUG - Line ${line.id} full structure:`, {
        id: line.id,
        quantity: line.quantity,
        merchandise: line.merchandise,
        merchandiseKeys: line.merchandise ? Object.keys(line.merchandise) : 'NO_MERCHANDISE',
        merchandiseType: line.merchandise?.__typename,
        hasProduct: !!line.merchandise?.product,
        productId: line.merchandise?.product?.id,
        productTitle: line.merchandise?.product?.title
      });

      // Check if merchandise exists and has product data
      if (!line.merchandise || !line.merchandise.product) {
        console.log(`❌ Line ${line.id} - No merchandise or product data`);
        return false;
      }

      // More flexible typename check - accept if it's a product variant or if typename is undefined but has product data
      const isProductVariant = line.merchandise.__typename === "ProductVariant" || 
                               (!line.merchandise.__typename && line.merchandise.product);

      if (!isProductVariant) {
        console.log(`❌ Line ${line.id} - Not a ProductVariant: ${line.merchandise.__typename}`);
        return false;
      }

      const productId = line.merchandise.product?.id;
      if (!productId) {
        console.log(`❌ Line ${line.id} - No product ID found`);
        return false;
      }

      console.log(`🔍 Line ${line.id} - Product ID: ${productId}, Title: ${line.merchandise.product?.title}`);

      // Check if product is in step's product list
      if (stepProductIds.includes(productId)) {
        console.log(`✅ Line ${line.id} - MATCHES step "${step.name}" (product found in list)`);
        return true;
      } else {
        console.log(`❌ Line ${line.id} - Does NOT match step "${step.name}" (product not in list)`);
      }

      // Check if product is in any of the step's collections
      // Note: In Shopify Functions, we can't directly query collection membership
      // Collection-based matching would need to be implemented by storing
      // product-collection mappings in the bundle configuration metafields
      // For now, we'll skip collection-based matching and rely on explicit product lists
      if (stepCollectionIds.length > 0) {
        // This is a simplified implementation - in production, you would need to
        // store product-collection mappings in your bundle configuration
        // or use a different approach to handle collection-based bundles
        console.log("Collection-based matching not fully implemented in Shopify Functions");
        return false;
      }

      return false;
    });

    // Check minimum quantity requirement for this step
    const stepTotalQuantity = stepMatchingLines.reduce(
      (sum: number, line: any) => sum + line.quantity,
      0,
    );

    console.log(`🔍 DEBUG - Step "${step.name}" results:`, {
      matchingLines: stepMatchingLines.length,
      totalQuantity: stepTotalQuantity,
      minRequired: step.minQuantity,
      maxAllowed: step.maxQuantity || 'unlimited',
      meetsMinimum: stepTotalQuantity >= step.minQuantity,
      withinMaximum: step.maxQuantity === 0 || stepTotalQuantity <= step.maxQuantity
    });

    if (stepTotalQuantity < step.minQuantity) {
      console.log(`❌ Step "${step.name}" FAILED - quantity ${stepTotalQuantity} < minimum ${step.minQuantity}`);
      allStepsMet = false;
      break;
    }

    // Check maximum quantity requirement for this step
    if (step.maxQuantity > 0 && stepTotalQuantity > step.maxQuantity) {
      console.log(`❌ Step "${step.name}" FAILED - quantity ${stepTotalQuantity} > maximum ${step.maxQuantity}`);
      allStepsMet = false;
      break;
    }

    // Check step conditions if defined
    if (step.conditionType && step.conditionValue !== undefined) {
      if (
        !checkStepCondition(
          stepTotalQuantity,
          step.conditionType,
          step.conditionValue,
        )
      ) {
        allStepsMet = false;
        break;
      }
    }

    // Add matching lines to result
    allMatchingLines.push(...stepMatchingLines);
    totalQuantity += stepTotalQuantity;
  }

  result.matchingLines = allMatchingLines;
  result.totalBundleQuantity = totalQuantity;
  result.meetsConditions = allStepsMet;

  return result;
}

export function checkStepCondition(
  quantity: number,
  conditionType: string,
  conditionValue: number,
): boolean {
  switch (conditionType) {
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
    return JSON.parse(metafieldValue);
  } catch (error) {
    console.error("Error parsing bundle settings metafield:", error);
    return null;
  }
}

export function getBundleDataFromDiscountConfig(input: any): BundleData[] {
  console.log("🔍 DEBUG: getBundleDataFromDiscountConfig - Starting analysis");
  console.log("🔍 DEBUG: Discount config exists:", !!input.discount?.configuration?.metafield?.value);
  
  if (!input.discount?.configuration?.metafield?.value) {
    console.log("❌ No discount config metafield found");
    return [];
  }

  try {
    const bundleConfig = JSON.parse(input.discount.configuration.metafield.value);
    console.log("🔍 DEBUG: Parsed bundle config:", bundleConfig);
    
    // Return array with single bundle from discount config
    return [bundleConfig];
  } catch (error) {
    console.error("❌ Error parsing discount config:", error);
    return [];
  }
}

export function getAllBundleDataFromShop(input: any): BundleData[] {
  console.log("🔍 DEBUG: getAllBundleDataFromShop - Starting analysis");
  console.log("🔍 DEBUG: Shop metafield exists:", !!input.shop?.metafield?.value);
  
  if (!input.shop?.metafield?.value) {
    console.log("❌ No shop metafield found");
    return [];
  }

  try {
    const allBundles = JSON.parse(input.shop.metafield.value);
    console.log("🔍 DEBUG: Parsed shop bundles:", allBundles.length);
    
    // Filter to only active bundles with pricing enabled
    const activeBundles = allBundles.filter((bundle: any) => 
      bundle.status === 'active' && 
      bundle.pricing?.enableDiscount === true
    );
    
    console.log("🔍 DEBUG: Active bundles with discounts:", activeBundles.length);
    
    return activeBundles;
  } catch (error) {
    console.error("❌ Error parsing shop metafield:", error);
    return [];
  }
}

export function getAllBundleDataFromCart(cart: any): BundleData[] {
  const bundles: BundleData[] = [];
  const processedBundles = new Set<string>();

  console.log("🔍 DEBUG: getAllBundleDataFromCart - Starting analysis");
  console.log("🔍 DEBUG: Total cart lines:", cart.lines.length);

  // Check all products in cart for bundle discount settings
  for (let i = 0; i < cart.lines.length; i++) {
    const line = cart.lines[i];
    console.log(`🔍 DEBUG: Line ${i + 1}:`, {
      id: line.id,
      quantity: line.quantity,
      merchandiseType: line.merchandise.__typename,
      hasProduct: !!line.merchandise.product,
      productId: line.merchandise.product?.id,
      productTitle: line.merchandise.product?.title,
      hasMetafield: !!line.merchandise.product?.metafield,
      metafieldValue: line.merchandise.product?.metafield?.value ? 'HAS_VALUE' : 'NO_VALUE',
      fullMetafieldObject: line.merchandise.product?.metafield
    });
    
    console.log(`🔍 DEBUG: Full line ${i + 1} structure:`, JSON.stringify(line, null, 2));

    if (
      line.merchandise.__typename === "ProductVariant" &&
      line.merchandise.product &&
      line.merchandise.product.metafield?.value
    ) {
      console.log(`🔍 DEBUG: Line ${i + 1} has metafield, parsing bundle data...`);
      const bundleData = parseBundleDataFromMetafield(
        line.merchandise.product.metafield.value,
      );
      
      console.log(`🔍 DEBUG: Parsed bundle data:`, bundleData ? {
        id: bundleData.id,
        name: bundleData.name,
        hasSteps: !!bundleData.steps?.length,
        hasPricing: !!bundleData.pricing,
        discountEnabled: bundleData.pricing?.enableDiscount
      } : 'NULL');
      
      if (bundleData && !processedBundles.has(bundleData.id)) {
        console.log(`🔍 DEBUG: Adding bundle "${bundleData.name}" to results`);
        bundles.push(bundleData);
        processedBundles.add(bundleData.id);
      }
    } else {
      console.log(`🔍 DEBUG: Line ${i + 1} skipped - missing metafield data`);
    }
  }

  console.log("🔍 DEBUG: getAllBundleDataFromCart - Final result:", bundles.length, "bundles found");
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
