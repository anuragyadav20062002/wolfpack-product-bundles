import {
  DeliveryDiscountSelectionStrategy,
  DiscountClass,
  DeliveryInput,
  CartDeliveryOptionsDiscountsGenerateRunResult,
  Input_CartLinesDiscountsGenerateRun as Input,
} from "../generated/api";

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

export function cartDeliveryOptionsDiscountsGenerateRun(
  input: Input,
): CartDeliveryOptionsDiscountsGenerateRunResult {
  const operations = [];

  // Find a product with discount settings metafield (assuming the bundle product is in the cart)
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

  if (!discountSettings.enableDiscount || discountSettings.discountMethod !== 'free_shipping' || !discountSettings.rules || discountSettings.rules.length === 0) {
    return { operations: [] }; // Discount not enabled, not free shipping, or no rules defined
  }

  const hasShippingDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Shipping,
  );

  if (!hasShippingDiscountClass) {
    return { operations: [] };
  }

  const rule = discountSettings.rules[0]; // Assuming one rule for free shipping for now

  // Check if minimum quantity is met (if applicable for free shipping)
  const totalQuantity = input.cart.lines.reduce((sum, line) => sum + line.quantity, 0);

  if (rule.discountOn === 'quantity' && totalQuantity < rule.minimumQuantity) {
    return { operations: [] }; // Minimum quantity not met
  }

  operations.push({
    deliveryDiscountsAdd: {
      candidates: [
        {
          message: "FREE SHIPPING",
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