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
} from "./cart-transform-bundle-utils-v2";
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

  // Get all bundle data from cart product metafields and shop metafields
  const bundles = getAllBundleDataFromCart(input.cart, input.shop);
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

    // Bundle merging should work even without discounts enabled
    // We'll merge the products and apply discounts only if pricing is configured
    console.log(`Processing bundle ${bundleData.name} - discount enabled: ${bundleData.pricing?.enableDiscount || false}`);

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
    console.log(`🔍 [CART TRANSFORM DEBUG] No applicable rule found for bundle: ${bundle.name}`);
    return null;
  }

  if (matchingLines.length < 2) {
    console.log(`🔍 [CART TRANSFORM DEBUG] Bundle ${bundle.name} has less than 2 matching lines, skipping merge`);
    return null;
  }

  // Calculate bundle pricing
  const savings = totalOriginalCost - totalDiscountedCost;
  const savingsText = formatBundleSavings(totalOriginalCost, totalDiscountedCost, cartCurrency);
  
  // Create bundle title with savings info
  const bundleTitle = savings > 0 
    ? `${bundle.name} Bundle - ${savingsText}`
    : `${bundle.name} Bundle`;

  // Get first product's image for bundle representation
  const bundleImage = matchingLines[0]?.merchandise?.product?.featuredImage?.url ||
                     matchingLines[0]?.merchandise?.image?.url;

  // Find or create a bundle parent variant ID
  let parentVariantId = null;
  
  // Check if we have a bundle product variant (for fixed bundle price method)
  if (bundle.pricing?.discountMethod === "fixed_bundle_price" && bundle.pricing?.bundleVariantId) {
    parentVariantId = bundle.pricing.bundleVariantId;
    console.log(`🔍 [CART TRANSFORM DEBUG] Using bundle variant ID: ${parentVariantId}`);
  } else {
    // Use the first line's variant as parent for percentage and fixed amount discounts
    parentVariantId = matchingLines[0]?.merchandise?.id;
    console.log(`🔍 [CART TRANSFORM DEBUG] Using first line variant as parent: ${parentVariantId}`);
  }
  
  if (!parentVariantId) {
    console.log(`🔍 [CART TRANSFORM DEBUG] Bundle ${bundle.name} missing parent variant ID`);
    return null;
  }

  // Prepare cart lines for merge - include ALL lines
  const cartLines = matchingLines.map(line => ({
    cartLineId: line.id,
    quantity: line.quantity,
  }));

  console.log(`🔍 [CART TRANSFORM DEBUG] Creating merge operation for ${cartLines.length} lines`);
  console.log(`🔍 [CART TRANSFORM DEBUG] Parent variant ID: ${parentVariantId}`);
  console.log(`🔍 [CART TRANSFORM DEBUG] Cart lines to merge:`, cartLines);

  // Create the merge operation structure
  const mergeOperation = {
    merge: {
      cartLines: cartLines,
      parentVariantId: parentVariantId,
      title: bundleTitle,
      image: bundleImage ? { url: bundleImage } : undefined,
      attributes: [
        {
          key: "_bundle_name",
          value: bundle.name
        },
        {
          key: "_bundle_id", 
          value: bundle.id
        },
        {
          key: "_bundle_type",
          value: bundle.pricing?.discountMethod || "bundle"
        }
      ]
    },
  };

  // Add price adjustment based on discount method (only if discount is enabled)
  if (bundle.pricing?.enableDiscount && savings > 0 && applicableRule) {
    let discountPercentage = 0;
    
    if (bundle.pricing.discountMethod === "percentage_off" && applicableRule.percentageOff > 0) {
      discountPercentage = applicableRule.percentageOff;
      console.log(`🔍 [CART TRANSFORM DEBUG] Applied percentage discount: ${discountPercentage}%`);
    } else if (bundle.pricing.discountMethod === "fixed_amount_off" && applicableRule.fixedAmountOff > 0) {
      // For fixed amount discounts, calculate the equivalent percentage
      discountPercentage = Math.min(99, Math.max(0, (applicableRule.fixedAmountOff / totalOriginalCost) * 100));
      console.log(`🔍 [CART TRANSFORM DEBUG] Applied fixed amount discount as percentage: ${discountPercentage}% (${applicableRule.fixedAmountOff} off ${totalOriginalCost})`);
    } else if (bundle.pricing.discountMethod === "fixed_bundle_price" && bundle.pricing.fixedPrice > 0) {
      // For fixed bundle price, calculate percentage discount
      if (bundle.pricing.fixedPrice < totalOriginalCost) {
        discountPercentage = Math.min(99, Math.max(0, ((totalOriginalCost - bundle.pricing.fixedPrice) / totalOriginalCost) * 100));
        console.log(`🔍 [CART TRANSFORM DEBUG] Applied fixed bundle price as percentage: ${discountPercentage}% (fixed price ${bundle.pricing.fixedPrice} vs original ${totalOriginalCost})`);
      } else {
        console.log(`🔍 [CART TRANSFORM DEBUG] Fixed bundle price ${bundle.pricing.fixedPrice} is higher than original cost ${totalOriginalCost}, no discount applied`);
      }
    }
    
    // Apply the discount percentage if it's greater than 0
    if (discountPercentage > 0) {
      mergeOperation.merge.price = {
        percentageDecrease: {
          value: discountPercentage
        }
      };
    }
  } else {
    console.log(`🔍 [CART TRANSFORM DEBUG] No discount applied - discount enabled: ${bundle.pricing?.enableDiscount}, savings: ${savings}, applicable rule: ${!!applicableRule}`);
  }

  console.log(`🔍 [CART TRANSFORM DEBUG] Final merge operation:`, JSON.stringify(mergeOperation, null, 2));

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