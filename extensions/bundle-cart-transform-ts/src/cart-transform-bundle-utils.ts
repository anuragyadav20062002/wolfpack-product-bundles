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

  if (!bundleData.allBundleProductIds || bundleData.allBundleProductIds.length === 0) {
    return result;
  }

  const matchingLines: any[] = [];
  let totalQuantity = 0;
  let totalOriginalCost = 0;

  // Find cart lines that match any bundle product
  for (const line of cart.lines) {
    const productId = line.merchandise?.product?.id;
    if (productId && bundleData.allBundleProductIds.includes(productId)) {
      matchingLines.push(line);
      totalQuantity += line.quantity;
      totalOriginalCost += parseFloat(line.cost.totalAmount.amount);
    }
  }

  // Check if bundle conditions are met (minimum quantity from pricing rules)
  const minimumQuantity = bundleData.pricing?.rules?.[0]?.minimumQuantity || 2;
  const meetsConditions = totalQuantity >= minimumQuantity;

  // Calculate discounted cost if conditions are met
  let totalDiscountedCost = totalOriginalCost;
  
  if (meetsConditions && bundleData.pricing?.enableDiscount) {
    const applicableRule = getApplicableDiscountRule(bundleData, totalQuantity);
    
    if (applicableRule) {
      if (bundleData.pricing.discountMethod === "fixed_amount_off") {
        totalDiscountedCost = Math.max(0, totalOriginalCost - applicableRule.fixedAmountOff);
      } else if (bundleData.pricing.discountMethod === "percentage_off") {
        totalDiscountedCost = totalOriginalCost * (1 - applicableRule.percentageOff / 100);
      }
    }
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

export function getAllBundleDataFromCart(cart: any): BundleData[] {
  const bundles: BundleData[] = [];
  const processedBundles = new Set<string>();

  // Check all products in cart for bundle discount settings
  for (let i = 0; i < cart.lines.length; i++) {
    const line = cart.lines[i];

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