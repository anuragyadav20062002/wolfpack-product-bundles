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
    
    // Find cart lines that match this step's products or collections
    const stepMatchingLines = cart.lines.filter((line: any) => {
      if (line.merchandise.__typename !== "ProductVariant") return false;

      const productId = line.merchandise.product?.id;
      if (!productId) return false;

      // Check if product is in step's product list
      if (stepProductIds.includes(productId)) {
        return true;
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

    if (stepTotalQuantity < step.minQuantity) {
      allStepsMet = false;
      break;
    }

    // Check maximum quantity requirement for this step
    if (step.maxQuantity > 0 && stepTotalQuantity > step.maxQuantity) {
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

export function getAllBundleDataFromCart(cart: any): BundleData[] {
  const bundles: BundleData[] = [];
  const processedBundles = new Set<string>();

  // Check all products in cart for bundle discount settings
  for (const line of cart.lines) {
    if (
      line.merchandise.__typename === "ProductVariant" &&
      line.merchandise.product &&
      line.merchandise.product.metafield?.value
    ) {
      const bundleData = parseBundleDataFromMetafield(
        line.merchandise.product.metafield.value,
      );
      
      if (bundleData && !processedBundles.has(bundleData.id)) {
        bundles.push(bundleData);
        processedBundles.add(bundleData.id);
      }
    }
  }

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
