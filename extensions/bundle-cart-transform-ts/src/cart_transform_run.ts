import type {
  CartTransformRunResult,
  Input_CartTransformRun,
} from "../generated/api";
import {
  getAllBundleDataFromCart,
  checkCartMeetsBundleConditions,
  getApplicableDiscountRule,
  BundleData,
  BundleMatchResult,
} from "./cart-transform-bundle-utils";
import {
  formatBundleSavings,
  getCurrencySymbol,
} from "./cart-transform-currency-utils";

export function cartTransformRun(
  input: Input_CartTransformRun,
): CartTransformRunResult {
  console.log("🔍 [CART TRANSFORM DEBUG] Cart Transform function called!");
  console.log("🔍 [CART TRANSFORM DEBUG] Function execution started at:", new Date().toISOString());
  console.log("🔍 [CART TRANSFORM DEBUG] Input cart:", JSON.stringify(input.cart, null, 2));

  if (!input.cart.lines.length) {
    console.log("🔍 [CART TRANSFORM DEBUG] Empty cart, no transformation needed");
    return { operations: [] };
  }

  // Get currency from first cart line
  const cartCurrency = input.cart.lines[0]?.cost?.totalAmount?.currencyCode || 'USD';
  console.log("🔍 [CART TRANSFORM DEBUG] Cart currency:", cartCurrency);
  console.log("🔍 [CART TRANSFORM DEBUG] Number of cart lines:", input.cart.lines.length);

  const operations = [];

  // Get all bundle data from cart product metafields
  const bundles = getAllBundleDataFromCart(input.cart);
  console.log("🔍 [CART TRANSFORM DEBUG] Bundle detection results:", bundles);
  
  if (bundles.length === 0) {
    console.log("🔍 [CART TRANSFORM DEBUG] No bundles found in cart - checking metafields:");
    input.cart.lines.forEach((line, index) => {
      console.log(`🔍 [CART TRANSFORM DEBUG] Line ${index}:`, {
        productId: line.merchandise?.product?.id,
        hasMetafield: !!line.merchandise?.product?.metafield,
        metafieldValue: line.merchandise?.product?.metafield?.value
      });
    });
    return { operations: [] };
  }

  console.log(`🔍 [CART TRANSFORM DEBUG] Found ${bundles.length} bundles in cart:`, bundles.map(b => b.name));

  // Process each bundle for transformation
  for (const bundleData of bundles) {
    console.log(`Processing bundle: ${bundleData.name}`);

    if (
      !bundleData.pricing?.enableDiscount ||
      !bundleData.pricing.rules ||
      bundleData.pricing.rules.length === 0
    ) {
      console.log(`Bundle ${bundleData.name} has no discount pricing`);
      continue;
    }

    // Skip free shipping bundles - handled in delivery options function
    if (bundleData.pricing.discountMethod === "free_shipping") {
      console.log(`Bundle ${bundleData.name} is free shipping, skipping transform`);
      continue;
    }

    // Check if cart meets bundle conditions
    const matchResult = checkCartMeetsBundleConditions(input.cart, bundleData);

    if (!matchResult.meetsConditions) {
      console.log(`Bundle ${bundleData.name} conditions not met`);
      continue;
    }

    console.log(`Bundle ${bundleData.name} conditions met, applying transform`);

    // Create bundle transformation operation
    const transformOperation = createBundleTransformOperation(
      matchResult,
      cartCurrency,
    );

    if (transformOperation) {
      operations.push(transformOperation);
      console.log(`Added transform operation for bundle: ${bundleData.name}`);
    }
  }

  console.log(`Cart Transform completed with ${operations.length} operations`);

  return {
    operations,
  };
}

function createBundleTransformOperation(
  matchResult: BundleMatchResult,
  cartCurrency: string,
): any {
  const { bundle, matchingLines, totalBundleQuantity, totalOriginalCost, totalDiscountedCost } = matchResult;

  // Get the applicable discount rule
  const applicableRule = getApplicableDiscountRule(bundle, totalBundleQuantity);
  
  if (!applicableRule) {
    return null;
  }

  // Calculate bundle pricing
  const savings = totalOriginalCost - totalDiscountedCost;
  const savingsText = formatBundleSavings(totalOriginalCost, totalDiscountedCost, cartCurrency);
  
  // Get line IDs to merge
  const lineIdsToMerge = matchingLines.map(line => line.id);
  
  // Create bundle title with savings info
  const bundleTitle = savings > 0 
    ? `${bundle.name} Bundle - ${savingsText}`
    : `${bundle.name} Bundle`;

  // Get first product's image for bundle representation
  const bundleImage = matchingLines[0]?.merchandise?.product?.featuredImage?.url ||
                     matchingLines[0]?.merchandise?.image?.url;

  // Create merge operation to combine bundle items into single cart line
  const mergeOperation = {
    merge: {
      parentCartLineId: lineIdsToMerge[0], // Use first line as parent
      cartLineIds: lineIdsToMerge.slice(1), // Merge other lines into it
      title: bundleTitle,
      image: bundleImage ? { url: bundleImage } : undefined,
    },
  };

  // If there's a discount, also update the pricing
  if (savings > 0) {
    const discountPerUnit = savings / totalBundleQuantity;
    
    return {
      ...mergeOperation,
      update: {
        cartLineId: lineIdsToMerge[0],
        title: bundleTitle,
        image: bundleImage ? { url: bundleImage } : undefined,
        cost: {
          amountPerQuantity: {
            amount: String((totalDiscountedCost / totalBundleQuantity).toFixed(2)),
            currencyCode: cartCurrency,
          },
        },
      },
    };
  }

  return mergeOperation;
}

// Alternative implementation: Expand bundle into individual discounted items
function createBundleExpandOperation(
  matchResult: BundleMatchResult,
  cartCurrency: string,
): any {
  const { bundle, matchingLines, totalBundleQuantity } = matchResult;

  // Get the applicable discount rule
  const applicableRule = getApplicableDiscountRule(bundle, totalBundleQuantity);
  
  if (!applicableRule) {
    return null;
  }

  const expandOperations = [];

  // Calculate discount per item
  let discountPerItem = 0;
  if (bundle.pricing?.discountMethod === "fixed_amount_off") {
    discountPerItem = applicableRule.fixedAmountOff / totalBundleQuantity;
  } else if (bundle.pricing?.discountMethod === "percentage_off") {
    // Percentage discount will be applied proportionally
  }

  // Create expand operation for each bundle line
  for (const line of matchingLines) {
    const originalPrice = parseFloat(line.cost.amountPerQuantity.amount);
    let discountedPrice = originalPrice;

    if (bundle.pricing?.discountMethod === "fixed_amount_off") {
      discountedPrice = Math.max(0, originalPrice - discountPerItem);
    } else if (bundle.pricing?.discountMethod === "percentage_off") {
      discountedPrice = originalPrice * (1 - applicableRule.percentageOff / 100);
    }

    const savingsText = formatBundleSavings(originalPrice, discountedPrice, cartCurrency);
    const newTitle = savingsText 
      ? `${line.merchandise.product.title} - ${savingsText}`
      : line.merchandise.product.title;

    expandOperations.push({
      update: {
        cartLineId: line.id,
        title: newTitle,
        cost: {
          amountPerQuantity: {
            amount: String(discountedPrice.toFixed(2)),
            currencyCode: cartCurrency,
          },
        },
      },
    });
  }

  return expandOperations.length > 0 ? { expand: expandOperations } : null;
}