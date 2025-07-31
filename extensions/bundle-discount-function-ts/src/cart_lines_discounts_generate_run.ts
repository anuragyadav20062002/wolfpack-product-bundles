import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
  CartInput,
  CartLinesDiscountsGenerateRunResult,
  Discount,
  Input_CartLinesDiscountsGenerateRun,
} from '../generated/api';

interface DiscountRule {
  discountOn: string;
  minimumQuantity: number;
  fixedAmountOff: number;
  percentageOff: number;
}

interface DiscountSettings {
  enableDiscount: boolean;
  discountMethod: string;
  rules: DiscountRule[];
}

export function cartLinesDiscountsGenerateRun(
  input: Input_CartLinesDiscountsGenerateRun,
): CartLinesDiscountsGenerateRunResult {
  if (!input.cart.lines.length) {
    return { operations: [] };
  }

  const operations = [];

  // Find a product with discount settings metafield
  const productWithDiscountSettings = input.cart.lines.find(line =>
    line.merchandise.__typename === "ProductVariant" &&
    line.merchandise.product &&
    line.merchandise.product.metafield?.value
  );

  if (!productWithDiscountSettings) {
    return { operations: [] }; // No discount settings found on any product
  }

  let discountSettings: DiscountSettings;
  try {
    discountSettings = JSON.parse(productWithDiscountSettings.merchandise.product.metafield.value);
  } catch (error) {
    console.error("Error parsing discount settings metafield:", error);
    return { operations: [] }; // Invalid JSON in metafield
  }

  if (!discountSettings.enableDiscount || !discountSettings.rules || discountSettings.rules.length === 0) {
    return { operations: [] }; // Discount not enabled or no rules defined
  }

  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Order,
  );
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  for (const rule of discountSettings.rules) {
    if (discountSettings.discountMethod === 'fixed_amount_off') {
      if (hasOrderDiscountClass) {
        // Apply fixed amount off discount to the order subtotal
        operations.push({
          orderDiscountsAdd: {
            candidates: [
              {
                message: `${rule.fixedAmountOff}$ OFF ORDER`,
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
      }
    } else if (discountSettings.discountMethod === 'percentage_off') {
      if (hasOrderDiscountClass) {
        // Apply percentage off discount to the order subtotal
        operations.push({
          orderDiscountsAdd: {
            candidates: [
              {
                message: `${rule.percentageOff}% OFF ORDER`,
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
      }
    }
  }

  return {
    operations,
  };
}