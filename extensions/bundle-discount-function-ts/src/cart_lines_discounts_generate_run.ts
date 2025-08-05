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
  getAllBundleDataFromCart,
  checkCartMeetsBundleConditions,
  getApplicableDiscountRule,
  BundleMatchResult,
} from "./bundle-utils";

export function cartLinesDiscountsGenerateRun(
  input: Input_CartLinesDiscountsGenerateRun,
): CartLinesDiscountsGenerateRunResult {
  if (!input.cart.lines.length) {
    return { operations: [] };
  }

  const operations = [];

  // Get all bundle data from cart
  const bundles = getAllBundleDataFromCart(input.cart);
  if (bundles.length === 0) {
    return { operations: [] };
  }

  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Order,
  );
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  // Check each bundle for applicability
  for (const bundleData of bundles) {
    if (
      !bundleData.pricing?.enableDiscount ||
      !bundleData.pricing.rules ||
      bundleData.pricing.rules.length === 0
    ) {
      continue;
    }

    // Skip free shipping bundles - handled in delivery options function
    if (bundleData.pricing.discountMethod === "free_shipping") {
      continue;
    }

    // Check if cart meets bundle conditions
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

    // Apply discount based on method
    if (
      bundleData.pricing.discountMethod === "fixed_amount_off" &&
      hasOrderDiscountClass &&
      applicableRule.fixedAmountOff > 0
    ) {
      // Get line IDs for bundle products only
      const bundleLineIds = matchResult.matchingLines.map((line) => line.id);
      
      operations.push({
        orderDiscountsAdd: {
          candidates: [
            {
              message: `${bundleData.name}: $${applicableRule.fixedAmountOff} OFF`,
              targets: [
                {
                  orderSubtotal: {
                    excludedCartLineIds: input.cart.lines
                      .filter((line: any) => !bundleLineIds.includes(line.id))
                      .map((line: any) => line.id),
                  },
                },
              ],
              value: {
                fixedAmount: {
                  amount: String(applicableRule.fixedAmountOff),
                },
              },
            },
          ],
          selectionStrategy: OrderDiscountSelectionStrategy.First,
        },
      });
    } else if (
      bundleData.pricing.discountMethod === "percentage_off" &&
      hasOrderDiscountClass &&
      applicableRule.percentageOff > 0
    ) {
      // Get line IDs for bundle products only
      const bundleLineIds = matchResult.matchingLines.map((line) => line.id);
      
      operations.push({
        orderDiscountsAdd: {
          candidates: [
            {
              message: `${bundleData.name}: ${applicableRule.percentageOff}% OFF`,
              targets: [
                {
                  orderSubtotal: {
                    excludedCartLineIds: input.cart.lines
                      .filter((line: any) => !bundleLineIds.includes(line.id))
                      .map((line: any) => line.id),
                  },
                },
              ],
              value: {
                percentage: {
                  value: applicableRule.percentageOff,
                },
              },
            },
          ],
          selectionStrategy: OrderDiscountSelectionStrategy.First,
        },
      });
    }
  }

  return {
    operations,
  };
}
