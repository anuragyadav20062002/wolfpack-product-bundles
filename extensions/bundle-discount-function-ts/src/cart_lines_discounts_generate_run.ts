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
  getAllBundleDataFromShop,
  getBundleDataFromDiscountConfig,
  checkCartMeetsBundleConditions,
  getApplicableDiscountRule,
  BundleMatchResult,
} from "./bundle-utils";
import {
  convertDiscountAmount,
  formatDiscountMessage,
  logCurrencyConversion,
} from "./currency-utils";

export function cartLinesDiscountsGenerateRun(
  input: Input_CartLinesDiscountsGenerateRun,
): CartLinesDiscountsGenerateRunResult {
  console.log("🔍 Bundle Discount Function Called");
  console.log("Cart lines count:", input.cart.lines.length);
  console.log("Cart cost:", input.cart.cost);
  console.log("Discount classes:", input.discount.discountClasses);

  if (!input.cart.lines.length) {
    console.log("❌ No cart lines found");
    return { operations: [] };
  }

  // Get currency from cart
  const cartCurrency = input.cart.cost?.subtotalAmount?.currencyCode || 'USD';
  console.log("💰 Cart currency:", cartCurrency);

  const operations = [];

  // Temporary hardcoded bundle for testing - will be replaced with dynamic config
  const bundles = [{
    id: "test-bundle",
    name: "Test Bundle", 
    steps: [
      {
        id: "step1",
        name: "Perfume 1",
        products: [
          { id: "gid://shopify/Product/10203665334566", title: "Citrus Breeze" },
          { id: "gid://shopify/Product/10203665105190", title: "Crystal Lagoon" },
          { id: "gid://shopify/Product/10203665203494", title: "Warm Desert" }
        ],
        collections: [],
        minQuantity: 1,
        maxQuantity: 0
      },
      {
        id: "step2", 
        name: "Perfume 2",
        products: [
          { id: "gid://shopify/Product/10203665006886", title: "Enchanted Dawn" },
          { id: "gid://shopify/Product/10203664843046", title: "Lush Blossom" },
          { id: "gid://shopify/Product/10203664908582", title: "Mystic Amber" }
        ],
        collections: [],
        minQuantity: 1,
        maxQuantity: 0
      }
    ],
    pricing: {
      enableDiscount: true,
      discountMethod: "percentage_off",
      rules: [{
        discountOn: "quantity",
        minimumQuantity: 2,
        fixedAmountOff: 0,
        percentageOff: 20
      }]
    }
  }];
  console.log("📦 Found bundles:", bundles.length);
  
  if (bundles.length === 0) {
    console.log("❌ No bundle data found in cart");
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
    console.log("🔄 Checking bundle:", bundleData.name);
    console.log("Bundle pricing:", bundleData.pricing);

    if (
      !bundleData.pricing?.enableDiscount ||
      !bundleData.pricing.rules ||
      bundleData.pricing.rules.length === 0
    ) {
      console.log("❌ Bundle discount not enabled or no rules");
      continue;
    }

    // Skip free shipping bundles - handled in delivery options function
    if (bundleData.pricing.discountMethod === "free_shipping") {
      console.log("🚚 Skipping free shipping bundle");
      continue;
    }

    // Check if cart meets bundle conditions
    const matchResult = checkCartMeetsBundleConditions(input.cart, bundleData);
    console.log("🔍 DETAILED Bundle match result:", {
      meetsConditions: matchResult.meetsConditions,
      totalQuantity: matchResult.totalBundleQuantity,
      matchingLinesCount: matchResult.matchingLines.length,
      cartLinesDetails: input.cart.lines.map((line: any, index: number) => ({
        index: index + 1,
        id: line.id,
        quantity: line.quantity,
        productId: line.merchandise?.product?.id,
        productTitle: line.merchandise?.product?.title,
        merchandiseType: line.merchandise?.__typename
      })),
      bundleSteps: bundleData.steps.map(step => ({
        id: step.id,
        name: step.name,
        productIds: step.products.map(p => p.id),
        minQuantity: step.minQuantity
      }))
    });

    if (!matchResult.meetsConditions) {
      console.log("❌ Cart does not meet bundle conditions");
      continue;
    }

    // Get the applicable discount rule based on total bundle quantity
    const applicableRule = getApplicableDiscountRule(
      bundleData,
      matchResult.totalBundleQuantity,
    );
    
    console.log("Applicable rule:", applicableRule);
    
    if (!applicableRule) {
      console.log("❌ No applicable discount rule found");
      continue;
    }

    // Apply discount based on method
    if (
      bundleData.pricing.discountMethod === "fixed_amount_off" &&
      hasOrderDiscountClass &&
      applicableRule.fixedAmountOff > 0
    ) {
      console.log("💵 Applying fixed amount discount");
      
      // Convert USD discount to cart currency 
      const originalAmount = applicableRule.fixedAmountOff;
      const convertedAmount = convertDiscountAmount(originalAmount, cartCurrency);
      
      logCurrencyConversion(originalAmount, convertedAmount, 'USD', cartCurrency);
      
      // Get line IDs for bundle products only
      const bundleLineIds = matchResult.matchingLines.map((line) => line.id);
      
      const discountMessage = formatDiscountMessage(
        bundleData.name, 
        'fixed', 
        convertedAmount, 
        cartCurrency
      );
      
      console.log("Discount message:", discountMessage);
      console.log("Discount amount:", convertedAmount);
      
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
      
      console.log("✅ Fixed amount discount operation added");
    } else if (
      bundleData.pricing.discountMethod === "percentage_off" &&
      hasOrderDiscountClass &&
      applicableRule.percentageOff > 0
    ) {
      console.log("📊 Applying percentage discount");
      
      // Get line IDs for bundle products only
      const bundleLineIds = matchResult.matchingLines.map((line) => line.id);
      
      const discountMessage = formatDiscountMessage(
        bundleData.name, 
        'percentage', 
        applicableRule.percentageOff, 
        cartCurrency
      );
      
      console.log("Discount message:", discountMessage);
      console.log("Discount percentage:", applicableRule.percentageOff);
      
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
      
      console.log("✅ Percentage discount operation added");
    } else {
      console.log("❌ Discount conditions not met:", {
        discountMethod: bundleData.pricing.discountMethod,
        hasOrderDiscountClass,
        fixedAmountOff: applicableRule.fixedAmountOff,
        percentageOff: applicableRule.percentageOff
      });
    }
  }

  console.log("🎯 Final operations count:", operations.length);
  console.log("Operations:", JSON.stringify(operations, null, 2));

  return {
    operations,
  };
}
