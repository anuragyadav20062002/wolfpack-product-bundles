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
  console.log("🚀 [DISCOUNT_FUNCTION] Starting cart lines discount generation");
  console.log("📋 [DISCOUNT_FUNCTION] Input cart lines count:", input.cart.lines.length);
  console.log("🏪 [DISCOUNT_FUNCTION] Shop domain:", input.shop.domain);
  console.log("💰 [DISCOUNT_FUNCTION] Discount classes:", input.discount.discountClasses);

  if (!input.cart.lines.length) {
    console.log("⚠️ [DISCOUNT_FUNCTION] No cart lines found, returning empty operations");
    return { operations: [] };
  }

  // Get currency from cart
  const cartCurrency = input.cart.cost?.subtotalAmount?.currencyCode || 'USD';
  console.log("💱 [DISCOUNT_FUNCTION] Cart currency:", cartCurrency);

  const operations = [];

  // Get all bundle data from cart product metafields and shop metafields
  console.log("🔍 [DISCOUNT_FUNCTION] Retrieving bundle data from cart and shop metafields");
  const bundles = getAllBundleDataFromCart(input.cart, input.shop);
  console.log("📦 [DISCOUNT_FUNCTION] Found bundles:", bundles.length);
  
  if (bundles.length === 0) {
    console.log("❌ [DISCOUNT_FUNCTION] No bundles found in cart/shop metafields, returning empty operations");
    return { operations: [] };
  }

  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Order,
  );
  
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );
  
  console.log("🎯 [DISCOUNT_FUNCTION] Discount class support - Order:", hasOrderDiscountClass, "Product:", hasProductDiscountClass);

  // Check each bundle for applicability
  console.log("🔄 [DISCOUNT_FUNCTION] Processing bundles for discount eligibility");
  for (const bundleData of bundles) {
    console.log("📝 [DISCOUNT_FUNCTION] Processing bundle:", bundleData.name || 'Unnamed Bundle');

    if (
      !bundleData.pricing?.enableDiscount ||
      !bundleData.pricing.rules ||
      bundleData.pricing.rules.length === 0
    ) {
      console.log("⏭️ [DISCOUNT_FUNCTION] Skipping bundle - discount not enabled or no rules:", {
        enableDiscount: bundleData.pricing?.enableDiscount,
        rulesCount: bundleData.pricing?.rules?.length || 0
      });
      continue;
    }

    // Skip free shipping bundles - handled in delivery options function
    if (bundleData.pricing.discountMethod === "free_shipping") {
      console.log("⏭️ [DISCOUNT_FUNCTION] Skipping free shipping bundle - handled by delivery options function");
      continue;
    }
    
    console.log("✅ [DISCOUNT_FUNCTION] Bundle eligible for discount processing:", {
      name: bundleData.name,
      discountMethod: bundleData.pricing.discountMethod,
      rulesCount: bundleData.pricing.rules.length
    });

    // Check if cart meets bundle conditions
    console.log("🔍 [DISCOUNT_FUNCTION] Checking if cart meets bundle conditions");
    const matchResult = checkCartMeetsBundleConditions(input.cart, bundleData);
    console.log("📊 [DISCOUNT_FUNCTION] Bundle condition check result:", {
      meetsConditions: matchResult.meetsConditions,
      totalBundleQuantity: matchResult.totalBundleQuantity,
      matchingLinesCount: matchResult.matchingLines.length
    });

    if (!matchResult.meetsConditions) {
      console.log("❌ [DISCOUNT_FUNCTION] Cart does not meet bundle conditions, skipping");
      continue;
    }

    // Calculate total amount for bundle products
    const totalBundleAmount = matchResult.matchingLines.reduce((sum, line) => {
      return sum + (parseFloat(line.cost?.subtotalAmount?.amount || '0') || 0);
    }, 0);
    console.log("💰 [DISCOUNT_FUNCTION] Total bundle amount calculated:", totalBundleAmount);

    // Get the applicable discount rule based on total bundle quantity and amount
    console.log("📋 [DISCOUNT_FUNCTION] Finding applicable discount rule");
    const applicableRule = getApplicableDiscountRule(
      bundleData,
      matchResult.totalBundleQuantity,
      totalBundleAmount,
    );
    console.log("🎯 [DISCOUNT_FUNCTION] Applicable rule found:", applicableRule ? {
      minQuantity: applicableRule.minQuantity,
      maxQuantity: applicableRule.maxQuantity,
      minAmount: applicableRule.minAmount,
      maxAmount: applicableRule.maxAmount,
      fixedAmountOff: applicableRule.fixedAmountOff,
      percentageOff: applicableRule.percentageOff
    } : null);
    
    if (!applicableRule) {
      console.log("❌ [DISCOUNT_FUNCTION] No applicable discount rule found, skipping");
      continue;
    }

    // Apply discount based on method
    console.log("🎲 [DISCOUNT_FUNCTION] Applying discount based on method:", bundleData.pricing.discountMethod);
    
    if (
      bundleData.pricing.discountMethod === "fixed_amount_off" &&
      hasOrderDiscountClass &&
      applicableRule.fixedAmountOff > 0
    ) {
      console.log("💸 [DISCOUNT_FUNCTION] Applying fixed amount off as order discount");
      
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
      console.log("✅ [DISCOUNT_FUNCTION] Added order discount operation for fixed amount off");
      
    } else if (
      bundleData.pricing.discountMethod === "percentage_off" &&
      hasOrderDiscountClass &&
      applicableRule.percentageOff > 0
    ) {
      console.log("📊 [DISCOUNT_FUNCTION] Applying percentage off as order discount");
      
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
      console.log("✅ [DISCOUNT_FUNCTION] Added order discount operation for percentage off");
      
    } else if (
      bundleData.pricing.discountMethod === "fixed_amount_off" &&
      hasProductDiscountClass &&
      applicableRule.fixedAmountOff > 0
    ) {
      console.log("🛍️ [DISCOUNT_FUNCTION] Applying fixed amount off as product-level discount");
      // Apply line-item (product-level) discount for fixed amount off
      
      // Convert USD discount to cart currency 
      const originalAmount = applicableRule.fixedAmountOff;
      const convertedAmount = convertDiscountAmount(originalAmount, cartCurrency);
      
      const discountMessage = formatDiscountMessage(
        bundleData.name, 
        'fixed', 
        convertedAmount, 
        cartCurrency
      );
      
      // Apply discount to each matching line proportionally
      matchResult.matchingLines.forEach((line) => {
        const lineAmount = parseFloat(line.cost?.subtotalAmount?.amount || '0');
        const lineDiscountAmount = totalBundleAmount > 0 
          ? (lineAmount / totalBundleAmount) * convertedAmount 
          : 0;
        
        if (lineDiscountAmount > 0) {
          operations.push({
            productDiscountsAdd: {
              candidates: [
                {
                  message: discountMessage,
                  targets: [
                    {
                      productVariant: {
                        id: line.merchandise.id,
                        quantity: line.quantity,
                      },
                    },
                  ],
                  value: {
                    fixedAmount: {
                      amount: String(Math.min(lineDiscountAmount, lineAmount)),
                    },
                  },
                },
              ],
            },
          });
        }
      });
      console.log("✅ [DISCOUNT_FUNCTION] Added product discount operations for fixed amount off");
      
    } else if (
      bundleData.pricing.discountMethod === "percentage_off" &&
      hasProductDiscountClass &&
      applicableRule.percentageOff > 0
    ) {
      console.log("📈 [DISCOUNT_FUNCTION] Applying percentage off as product-level discount");
      // Apply line-item (product-level) discount for percentage off
      
      const discountMessage = formatDiscountMessage(
        bundleData.name, 
        'percentage', 
        applicableRule.percentageOff, 
        cartCurrency
      );
      
      // Apply percentage discount to each matching line
      matchResult.matchingLines.forEach((line) => {
        operations.push({
          productDiscountsAdd: {
            candidates: [
              {
                message: discountMessage,
                targets: [
                  {
                    productVariant: {
                      id: line.merchandise.id,
                      quantity: line.quantity,
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
          },
        });
      });
      console.log("✅ [DISCOUNT_FUNCTION] Added product discount operations for percentage off");
      
    } else if (
      bundleData.pricing.discountMethod === "fixed_bundle_price" &&
      hasOrderDiscountClass &&
      bundleData.pricing.fixedPrice > 0 &&
      totalBundleAmount > bundleData.pricing.fixedPrice
    ) {
      console.log("💎 [DISCOUNT_FUNCTION] Applying fixed bundle price discount");
      // Apply fixed bundle price discount
      const discountAmount = totalBundleAmount - bundleData.pricing.fixedPrice;
      const convertedAmount = convertDiscountAmount(discountAmount, cartCurrency);
      
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
      console.log("✅ [DISCOUNT_FUNCTION] Added order discount operation for fixed bundle price");
    } else {
      console.log("⚠️ [DISCOUNT_FUNCTION] No matching discount method or class support:", {
        discountMethod: bundleData.pricing.discountMethod,
        hasOrderClass: hasOrderDiscountClass,
        hasProductClass: hasProductDiscountClass,
        fixedAmountOff: applicableRule.fixedAmountOff,
        percentageOff: applicableRule.percentageOff
      });
    }
  }

  console.log("🏁 [DISCOUNT_FUNCTION] Function execution complete");
  console.log("📊 [DISCOUNT_FUNCTION] Total operations created:", operations.length);
  console.log("📋 [DISCOUNT_FUNCTION] Operations summary:", operations.map(op => ({
    type: Object.keys(op)[0],
    candidates: op.orderDiscountsAdd?.candidates?.length || op.productDiscountsAdd?.candidates?.length || 0
  })));

  return {
    operations,
  };
}
