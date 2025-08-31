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

/**
 * Enhanced Cart Transform Function following Shopify's best practices
 * Supports both merge (components -> bundle) and expand (bundle -> components) operations
 */
export function cartTransformRun(
  input: Input_CartTransformRun,
): CartTransformRunResult {
  console.log("🔍 [CART TRANSFORM V2 DEBUG] Enhanced Cart Transform function called!");
  console.log("🔍 [CART TRANSFORM V2 DEBUG] Function execution started at:", new Date().toISOString());

  if (!input.cart.lines.length) {
    console.log("🔍 [CART TRANSFORM V2 DEBUG] Empty cart, no transformation needed");
    return { operations: [] };
  }

  // Get currency from first cart line
  const cartCurrency = input.cart.lines[0]?.cost?.totalAmount?.currencyCode || 'USD';
  console.log("🔍 [CART TRANSFORM V2 DEBUG] Cart currency:", cartCurrency);
  console.log("🔍 [CART TRANSFORM V2 DEBUG] Number of cart lines:", input.cart.lines.length);

  const operations = [];

  // Get all bundle data from cart using enhanced detection
  const bundles = getAllBundleDataFromCart(input.cart, input.shop);
  
  if (bundles.length === 0) {
    console.log("🔍 [CART TRANSFORM V2 DEBUG] No bundles found in cart");
    return { operations: [] };
  }

  console.log(`🔍 [CART TRANSFORM V2 DEBUG] Found ${bundles.length} bundles in cart:`, bundles.map(b => b.name));

  // Process each bundle for transformation
  for (const bundleData of bundles) {
    console.log(`🔍 [CART TRANSFORM V2 DEBUG] Processing bundle: ${bundleData.name}`);

    // Skip free shipping bundles - handled in delivery options function
    if (bundleData.pricing?.discountMethod === "free_shipping") {
      console.log(`🔍 [CART TRANSFORM V2 DEBUG] Bundle ${bundleData.name} is free shipping, skipping transform`);
      continue;
    }

    // Check if cart meets bundle conditions
    const matchResult = checkCartMeetsBundleConditions(input.cart, bundleData);

    if (!matchResult.meetsConditions) {
      console.log(`🔍 [CART TRANSFORM V2 DEBUG] Bundle ${bundleData.name} conditions not met`);
      continue;
    }

    console.log(`🔍 [CART TRANSFORM V2 DEBUG] Bundle ${bundleData.name} conditions met, determining operation type`);

    // Determine operation type based on cart content
    let transformOperation = null;

    // If we have a bundle parent line, EXPAND it into components
    if (matchResult.bundleParentLine) {
      console.log(`🔍 [CART TRANSFORM V2 DEBUG] Found bundle parent, creating EXPAND operation`);
      transformOperation = createBundleExpandOperation(matchResult, cartCurrency);
    }
    // If we have component lines, MERGE them into a bundle
    else if (matchResult.componentLines.length >= 2) {
      console.log(`🔍 [CART TRANSFORM V2 DEBUG] Found ${matchResult.componentLines.length} components, creating MERGE operation`);
      transformOperation = createBundleMergeOperation(matchResult, cartCurrency);
    }

    if (transformOperation) {
      if (Array.isArray(transformOperation)) {
        operations.push(...transformOperation);
        console.log(`🔍 [CART TRANSFORM V2 DEBUG] Added ${transformOperation.length} operations for bundle: ${bundleData.name}`);
      } else {
        operations.push(transformOperation);
        console.log(`🔍 [CART TRANSFORM V2 DEBUG] Added transform operation for bundle: ${bundleData.name}`);
      }
    }
  }

  console.log(`🔍 [CART TRANSFORM V2 DEBUG] Cart Transform completed with ${operations.length} operations`);

  return {
    operations,
  };
}

/**
 * Create a merge operation to combine component lines into a single bundle
 */
function createBundleMergeOperation(
  matchResult: BundleMatchResult,
  cartCurrency: string,
): any {
  const { bundle, componentLines, totalBundleQuantity, totalOriginalCost, totalDiscountedCost } = matchResult;

  console.log(`🔍 [CART TRANSFORM V2 DEBUG] Creating MERGE operation for bundle: ${bundle.name}`);

  // Get the applicable discount rule
  const applicableRule = getApplicableDiscountRule(bundle, totalBundleQuantity);
  
  if (!applicableRule && bundle.pricing?.enableDiscount) {
    console.log(`🔍 [CART TRANSFORM V2 DEBUG] No applicable rule found for bundle: ${bundle.name}`);
    return null;
  }

  if (componentLines.length < 2) {
    console.log(`🔍 [CART TRANSFORM V2 DEBUG] Bundle ${bundle.name} has less than 2 component lines, skipping merge`);
    return null;
  }

  // Calculate bundle pricing
  const savings = totalOriginalCost - totalDiscountedCost;
  const savingsText = formatBundleSavings(totalOriginalCost, totalDiscountedCost, cartCurrency);
  
  // Create bundle title with savings info
  const bundleTitle = savings > 0 
    ? `${bundle.name} Bundle - ${savingsText}`
    : `${bundle.name} Bundle`;

  // Get first component's image for bundle representation
  const bundleImage = componentLines[0]?.merchandise?.product?.featuredImage?.url ||
                     componentLines[0]?.merchandise?.image?.url;

  // Determine parent variant ID
  let parentVariantId = bundle.bundleParentVariantId || 
                       bundle.pricing?.bundleVariantId || 
                       componentLines[0]?.merchandise?.id;
  
  if (!parentVariantId) {
    console.log(`🔍 [CART TRANSFORM V2 DEBUG] Bundle ${bundle.name} missing parent variant ID`);
    return null;
  }

  // Prepare cart lines for merge
  const cartLines = componentLines.map(line => ({
    cartLineId: line.id,
    quantity: line.quantity,
  }));

  console.log(`🔍 [CART TRANSFORM V2 DEBUG] Creating merge operation for ${cartLines.length} lines`);
  console.log(`🔍 [CART TRANSFORM V2 DEBUG] Parent variant ID: ${parentVariantId}`);

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
        },
        {
          key: "_bundle_operation",
          value: "merge"
        }
      ]
    },
  };

  // Add price adjustment based on discount method (only if discount is enabled)
  if (bundle.pricing?.enableDiscount && savings > 0 && applicableRule) {
    let discountPercentage = 0;
    
    if (bundle.pricing.discountMethod === "percentage_off" && applicableRule.percentageOff > 0) {
      discountPercentage = applicableRule.percentageOff;
    } else if (bundle.pricing.discountMethod === "fixed_amount_off" && applicableRule.fixedAmountOff > 0) {
      discountPercentage = Math.min(99, Math.max(0, (applicableRule.fixedAmountOff / totalOriginalCost) * 100));
    } else if (bundle.pricing.discountMethod === "fixed_bundle_price" && bundle.pricing.fixedPrice > 0) {
      if (bundle.pricing.fixedPrice < totalOriginalCost) {
        discountPercentage = Math.min(99, Math.max(0, ((totalOriginalCost - bundle.pricing.fixedPrice) / totalOriginalCost) * 100));
      }
    }
    
    if (discountPercentage > 0) {
      mergeOperation.merge.price = {
        percentageDecrease: {
          value: discountPercentage
        }
      };
      console.log(`🔍 [CART TRANSFORM V2 DEBUG] Applied ${discountPercentage}% discount to merge operation`);
    }
  }

  console.log(`🔍 [CART TRANSFORM V2 DEBUG] Final merge operation:`, JSON.stringify(mergeOperation, null, 2));
  return mergeOperation;
}

/**
 * Create an expand operation to break down a bundle into its components
 */
function createBundleExpandOperation(
  matchResult: BundleMatchResult,
  cartCurrency: string,
): any[] {
  const { bundle, bundleParentLine, totalBundleQuantity } = matchResult;

  console.log(`🔍 [CART TRANSFORM V2 DEBUG] Creating EXPAND operation for bundle: ${bundle.name}`);

  if (!bundleParentLine) {
    console.log(`🔍 [CART TRANSFORM V2 DEBUG] No bundle parent line found for expand operation`);
    return [];
  }

  if (!bundle.componentReferences || bundle.componentReferences.length === 0) {
    console.log(`🔍 [CART TRANSFORM V2 DEBUG] No component references found for bundle: ${bundle.name}`);
    return [];
  }

  // Get the applicable discount rule for the bundle
  const applicableRule = getApplicableDiscountRule(bundle, totalBundleQuantity);
  
  const expandedItems = [];
  const bundleQuantity = bundleParentLine.quantity;

  // Create expanded items for each component
  for (let i = 0; i < bundle.componentReferences.length; i++) {
    const componentVariantId = bundle.componentReferences[i];
    const componentQuantity = (bundle.componentQuantities?.[i] || 1) * bundleQuantity;
    
    const expandedItem: any = {
      merchandiseId: componentVariantId,
      quantity: componentQuantity,
      attributes: [
        {
          key: "_bundle_component",
          value: "true"
        },
        {
          key: "_bundle_id",
          value: bundle.id
        },
        {
          key: "_bundle_name",
          value: bundle.name
        }
      ]
    };

    // Apply component-level pricing if discount is enabled
    if (bundle.pricing?.enableDiscount && applicableRule) {
      if (bundle.pricing.discountMethod === "percentage_off" && applicableRule.percentageOff > 0) {
        expandedItem.price = {
          percentageDecrease: {
            value: applicableRule.percentageOff
          }
        };
      }
      // Note: Fixed amount discounts are more complex for expand operations
      // as we need to distribute the discount across components proportionally
    }

    expandedItems.push(expandedItem);
  }

  // Create the expand operation
  const expandOperation = {
    expand: {
      cartLineId: bundleParentLine.id,
      expandedCartItems: expandedItems,
      title: `${bundle.name} Components`,
      attributes: [
        {
          key: "_bundle_expanded",
          value: "true"
        },
        {
          key: "_bundle_id",
          value: bundle.id
        },
        {
          key: "_bundle_operation",
          value: "expand"
        }
      ]
    }
  };

  console.log(`🔍 [CART TRANSFORM V2 DEBUG] Created expand operation with ${expandedItems.length} components`);
  console.log(`🔍 [CART TRANSFORM V2 DEBUG] Final expand operation:`, JSON.stringify(expandOperation, null, 2));

  return [expandOperation];
}