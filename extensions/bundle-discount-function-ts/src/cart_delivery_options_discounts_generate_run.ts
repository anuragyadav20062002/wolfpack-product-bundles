import {
  DeliveryDiscountSelectionStrategy,
  DiscountClass,
  CartDeliveryOptionsDiscountsGenerateRunResult,
  Input_CartLinesDiscountsGenerateRun as Input,
} from "../generated/api";
import {
  getAllBundleDataFromCart,
  checkCartMeetsBundleConditions,
  getApplicableDiscountRule,
} from "./bundle-utils";

export function cartDeliveryOptionsDiscountsGenerateRun(
  input: Input,
): CartDeliveryOptionsDiscountsGenerateRunResult {
  console.log("🚚 Delivery Options Discount Function Called");
  console.log("Cart lines count:", input.cart.lines.length);
  console.log("Delivery groups count:", input.cart.deliveryGroups?.length || 0);
  console.log("Discount classes:", input.discount.discountClasses);

  const operations = [];

  // Check if shipping discount class is supported
  const hasShippingDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Shipping,
  );

  if (!hasShippingDiscountClass) {
    console.log("❌ No shipping discount class found");
    return { operations: [] };
  }

  // Check if there are delivery groups available
  if (!input.cart.deliveryGroups || input.cart.deliveryGroups.length === 0) {
    console.log("❌ No delivery groups found");
    return { operations: [] };
  }

  // Get all bundle data from cart
  const bundles = getAllBundleDataFromCart(input.cart);
  console.log("📦 Found bundles:", bundles.length);
  
  if (bundles.length === 0) {
    console.log("❌ No bundle data found in cart");
    return { operations: [] };
  }

  // Check each bundle for free shipping applicability
  for (const bundleData of bundles) {
    console.log("🔄 Checking bundle for free shipping:", bundleData.name);
    console.log("Bundle pricing:", bundleData.pricing);

    if (
      !bundleData.pricing?.enableDiscount ||
      bundleData.pricing.discountMethod !== "free_shipping" ||
      !bundleData.pricing.rules ||
      bundleData.pricing.rules.length === 0
    ) {
      console.log("❌ Bundle not eligible for free shipping discount");
      continue;
    }

    // Check if cart meets bundle conditions for free shipping
    const matchResult = checkCartMeetsBundleConditions(input.cart, bundleData);
    console.log("Bundle match result:", {
      meetsConditions: matchResult.meetsConditions,
      totalQuantity: matchResult.totalBundleQuantity,
      matchingLines: matchResult.matchingLines.length
    });

    if (!matchResult.meetsConditions) {
      console.log("❌ Cart does not meet bundle conditions for free shipping");
      continue;
    }

    // Get the applicable discount rule based on total bundle quantity
    const applicableRule = getApplicableDiscountRule(
      bundleData,
      matchResult.totalBundleQuantity,
    );
    
    console.log("Applicable rule:", applicableRule);
    
    if (!applicableRule) {
      console.log("❌ No applicable discount rule found for free shipping");
      continue;
    }

    console.log("🚚 Applying free shipping discount");

    // Apply free shipping discount to all delivery groups
    for (const deliveryGroup of input.cart.deliveryGroups) {
      operations.push({
        deliveryDiscountsAdd: {
          candidates: [
            {
              message: `${bundleData.name}: Free Shipping`,
              targets: [
                {
                  deliveryGroup: {
                    id: deliveryGroup.id,
                  },
                },
              ],
              value: {
                percentage: {
                  value: 100, // 100% off for free shipping
                },
              },
            },
          ],
          selectionStrategy: DeliveryDiscountSelectionStrategy.All,
        },
      });
    }

    console.log("✅ Free shipping discount operations added");

    // Only apply the first applicable free shipping bundle
    break;
  }

  console.log("🎯 Final delivery operations count:", operations.length);
  console.log("Operations:", JSON.stringify(operations, null, 2));

  return {
    operations,
  };
}
