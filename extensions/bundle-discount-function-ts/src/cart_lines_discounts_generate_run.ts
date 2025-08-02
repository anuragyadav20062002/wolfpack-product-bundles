import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
  CartInput,
  CartLinesDiscountsGenerateRunResult,
  Discount,
  Input_CartLinesDiscountsGenerateRun,
} from "../generated/api";
import {
  getBundleDataFromCart,
  checkCartMeetsBundleConditions,
} from "./bundle-utils";

export function cartLinesDiscountsGenerateRun(
  input: Input_CartLinesDiscountsGenerateRun,
): CartLinesDiscountsGenerateRunResult {
  if (!input.cart.lines.length) {
    return { operations: [] };
  }

  const operations = [];

  // Get bundle data from cart
  const bundleData = getBundleDataFromCart(input.cart);
  if (!bundleData) {
    return { operations: [] };
  }

  if (
    !bundleData.pricing?.enableDiscount ||
    !bundleData.pricing.rules ||
    bundleData.pricing.rules.length === 0
  ) {
    return { operations: [] };
  }

  // Check if cart meets bundle conditions
  const cartMeetsConditions = checkCartMeetsBundleConditions(
    input.cart,
    bundleData,
  );
  if (!cartMeetsConditions) {
    return { operations: [] };
  }

  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Order,
  );
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  // Apply discounts based on rules
  for (const rule of bundleData.pricing.rules) {
    if (
      bundleData.pricing.discountMethod === "fixed_amount_off" &&
      hasOrderDiscountClass
    ) {
      operations.push({
        orderDiscountsAdd: {
          candidates: [
            {
              message: `Bundle Discount: $${rule.fixedAmountOff} OFF`,
              targets: [
                {
                  orderSubtotal: {
                    excludedCartLineIds: [],
                  },
                },
              ],
              value: {
                fixedAmount: {
                  amount: String(rule.fixedAmountOff),
                },
              },
            },
          ],
          selectionStrategy: OrderDiscountSelectionStrategy.First,
        },
      });
    } else if (
      bundleData.pricing.discountMethod === "percentage_off" &&
      hasOrderDiscountClass
    ) {
      operations.push({
        orderDiscountsAdd: {
          candidates: [
            {
              message: `Bundle Discount: ${rule.percentageOff}% OFF`,
              targets: [
                {
                  orderSubtotal: {
                    excludedCartLineIds: [],
                  },
                },
              ],
              value: {
                percentage: {
                  value: rule.percentageOff,
                },
              },
            },
          ],
          selectionStrategy: OrderDiscountSelectionStrategy.First,
        },
      });
    } else if (bundleData.pricing.discountMethod === "free_shipping") {
      // Free shipping is handled in cart_delivery_options_discounts_generate_run.ts
      continue;
    }
  }

  return {
    operations,
  };
}
