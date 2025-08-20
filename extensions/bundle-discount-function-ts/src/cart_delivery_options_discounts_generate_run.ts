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
} from "./discount-function-bundle-utils";

export function cartDeliveryOptionsDiscountsGenerateRun(
  input: Input,
): CartDeliveryOptionsDiscountsGenerateRunResult {

  const operations = [];

  // Check if shipping discount class is supported
  const hasShippingDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Shipping,
  );

  if (!hasShippingDiscountClass) {
    return { operations: [] };
  }

  // Check if there are delivery groups available
  if (!input.cart.deliveryGroups || input.cart.deliveryGroups.length === 0) {
    return { operations: [] };
  }

  // Get all bundle data from cart
  const bundles = getAllBundleDataFromCart(input.cart);
  
  if (bundles.length === 0) {
    return { operations: [] };
  }

  // Check each bundle for free shipping applicability
  for (const bundleData of bundles) {

    if (
      !bundleData.pricing?.enableDiscount ||
      bundleData.pricing.discountMethod !== "free_shipping" ||
      !bundleData.pricing.rules ||
      bundleData.pricing.rules.length === 0
    ) {
      continue;
    }

    // Check if cart meets bundle conditions for free shipping
    const matchResult = checkCartMeetsBundleConditions(input.cart, bundleData);

    if (!matchResult.meetsConditions) {
      continue;
    }

    // Get the applicable discount rule based on total bundle quantity
    const applicableRule = getApplicableDiscountRule(
      bundleData,
      matchResult.totalBundleQuantity,
    );
    
    
    if (!applicableRule) {
      continue;
    }


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


    // Only apply the first applicable free shipping bundle
    break;
  }


  return {
    operations,
  };
}
