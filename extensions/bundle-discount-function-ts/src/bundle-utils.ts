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

export function checkCartMeetsBundleConditions(
  cart: any,
  bundleData: BundleData,
): boolean {
  if (!bundleData.steps || bundleData.steps.length === 0) {
    return false;
  }

  // Check if there are any enabled steps
  const enabledSteps = bundleData.steps.filter(
    (step) => step.enabled !== false,
  );
  if (enabledSteps.length === 0) {
    return false; // All steps are disabled
  }

  // Check if cart contains products from each required step
  for (const step of enabledSteps) {
    const stepProductIds = step.products.map((p) => p.id);
    const stepCollectionIds = step.collections.map((c) => c.id);

    // Find cart lines that match this step's products or collections
    const matchingCartLines = cart.lines.filter((line: any) => {
      if (line.merchandise.__typename !== "ProductVariant") return false;

      const productId = line.merchandise.product?.id;
      if (!productId) return false;

      // Check if product is in step's product list
      if (stepProductIds.includes(productId)) {
        return true;
      }

      // Check if product is in step's collections
      // Since we can't query collections directly in Shopify Functions,
      // we'll use the collection IDs stored in the bundle configuration
      // and check if the product ID matches any collection ID pattern
      // This is a simplified approach - in a real implementation,
      // you might want to store product-collection mappings in metafields
      if (stepCollectionIds.length > 0) {
        // For now, we'll check if the product ID contains any collection ID
        // This is a basic implementation - you may need to enhance this logic
        // based on your specific requirements
        return stepCollectionIds.some((collectionId) =>
          productId.includes(collectionId.split("/").pop() || ""),
        );
      }

      return false;
    });

    // Check minimum quantity requirement
    const totalQuantity = matchingCartLines.reduce(
      (sum: number, line: any) => sum + line.quantity,
      0,
    );

    if (totalQuantity < step.minQuantity) {
      return false;
    }

    // Check step conditions if defined
    if (step.conditionType && step.conditionValue !== undefined) {
      if (
        !checkStepCondition(
          totalQuantity,
          step.conditionType,
          step.conditionValue,
        )
      ) {
        return false;
      }
    }
  }

  return true;
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

export function getBundleDataFromCart(cart: any): BundleData | null {
  // Check if any product in cart has bundle discount settings
  const productsWithBundleSettings = cart.lines.filter(
    (line: any) =>
      line.merchandise.__typename === "ProductVariant" &&
      line.merchandise.product &&
      line.merchandise.product.metafield?.value,
  );

  if (productsWithBundleSettings.length === 0) {
    return null;
  }

  return parseBundleDataFromMetafield(
    productsWithBundleSettings[0].merchandise.product.metafield.value,
  );
}
