import {
  DeliveryDiscountSelectionStrategy,
  DiscountClass,
  CartDeliveryOptionsDiscountsGenerateRunResult,
  Input_CartLinesDiscountsGenerateRun as Input,
} from "../generated/api";
import {
  getBundleDataFromCart,
  checkCartMeetsBundleConditions,
} from "./bundle-utils";

export function cartDeliveryOptionsDiscountsGenerateRun(
  input: Input,
): CartDeliveryOptionsDiscountsGenerateRunResult {
  const operations = [];

  // Get bundle data from cart
  const bundleData = getBundleDataFromCart(input.cart);
  if (!bundleData) {
    return { operations: [] };
  }

  if (
    !bundleData.pricing?.enableDiscount ||
    bundleData.pricing.discountMethod !== "free_shipping" ||
    !bundleData.pricing.rules ||
    bundleData.pricing.rules.length === 0
  ) {
    return { operations: [] };
  }

  const hasShippingDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Shipping,
  );

  if (!hasShippingDiscountClass) {
    return { operations: [] };
  }

  // Check if cart meets bundle conditions for free shipping
  const cartMeetsConditions = checkCartMeetsBundleConditions(
    input.cart,
    bundleData,
  );
  if (!cartMeetsConditions) {
    return { operations: [] };
  }

  // Apply free shipping discount
  operations.push({
    deliveryDiscountsAdd: {
      candidates: [
        {
          message: "Bundle Free Shipping",
          targets: [
            {
              deliveryGroup: {
                id: input.cart.deliveryGroups[0].id,
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

  return {
    operations,
  };
}
