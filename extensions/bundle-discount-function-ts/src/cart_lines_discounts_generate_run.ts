import type {
  CartLinesDiscountsGenerateRunResult,
  Input_CartLinesDiscountsGenerateRun,

} from "../generated/api";
import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
} from "../generated/api";
import {
  getAllBundleDataFromCart,
  checkCartMeetsBundleConditions,
  getApplicableDiscountRule,
} from "./discount-function-bundle-utils";
import {
  convertDiscountAmount,
  formatDiscountMessage,
  logCurrencyConversion,
} from "./discount-function-currency-utils";

export function cartLinesDiscountsGenerateRun(
  input: Input_CartLinesDiscountsGenerateRun,
): CartLinesDiscountsGenerateRunResult {

  if (!input.cart.lines.length) {
    return { operations: [] };
  }

  // Get currency from cart
  const cartCurrency = input.cart.cost?.subtotalAmount?.currencyCode || 'USD';

  const operations = [];

  // Get all bundle data from cart product metafields
  const bundles = getAllBundleDataFromCart(input.cart);
  
  if (bundles.length === 0) {
    return { operations: [] };
  }

  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Order,
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

    // Calculate total amount for bundle products
    const totalBundleAmount = matchResult.matchingLines.reduce((sum, line) => {
      return sum + (parseFloat(line.cost?.subtotalAmount?.amount || '0') || 0);
    }, 0);

    // Get the applicable discount rule based on total bundle quantity and amount
    const applicableRule = getApplicableDiscountRule(
      bundleData,
      matchResult.totalBundleQuantity,
      totalBundleAmount,
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
      
      // Convert USD discount to cart currency 
      const originalAmount = applicableRule.fixedAmountOff;
      const convertedAmount = convertDiscountAmount(originalAmount, cartCurrency);
      
      
      // Get line IDs for bundle products only
      const bundleLineIds = matchResult.matchingLines.map((line) => line.id);
      
      const discountMessage = formatDiscountMessage(
        bundleData.name, 
        'fixed', 
        convertedAmount, 
        cartCurrency
      );
      
      
      operations.push({
        orderDiscountsAdd: {
          candidates: [
            {
              message: discountMessage,
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
                  amount: String(convertedAmount),
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
      
      const discountMessage = formatDiscountMessage(
        bundleData.name, 
        'percentage', 
        applicableRule.percentageOff, 
        cartCurrency
      );
      
      
      operations.push({
        orderDiscountsAdd: {
          candidates: [
            {
              message: discountMessage,
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
      
    } else {
    }
  }


  return {
    operations,
  };
}
