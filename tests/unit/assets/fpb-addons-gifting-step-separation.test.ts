/**
 * Unit Tests: FPB add-ons / gifting step separation
 *
 * EB exposes two separate controls:
 * - Add-Ons and Gifting Step creates the storefront step/tab.
 * - Add-Ons with Bundles attaches tiered add-on products/discounts to that step.
 */

export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageInitialRenderMethods } =
  require("../../../app/assets/widgets/full-page/methods/initial-render-methods.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageValidationAddonsMethods } =
  require("../../../app/assets/widgets/full-page/methods/validation-addons-methods.js");

const buildAddonStepFromPersonalization =
  fullPageInitialRenderMethods.buildAddonStepFromPersonalization;
const bundleHasNoConditions = fullPageValidationAddonsMethods.bundleHasNoConditions;
const getAddonEligibilityState =
  fullPageValidationAddonsMethods.getAddonEligibilityState;
const getAddonTierEvaluation =
  fullPageValidationAddonsMethods.getAddonTierEvaluation;
const getAddonLineDiscount =
  fullPageValidationAddonsMethods.getAddonLineDiscount;
const renderAddonEligibilityMessage =
  fullPageValidationAddonsMethods.renderAddonEligibilityMessage;

if (
  typeof buildAddonStepFromPersonalization !== "function" ||
  typeof bundleHasNoConditions !== "function" ||
  typeof getAddonEligibilityState !== "function" ||
  typeof getAddonTierEvaluation !== "function" ||
  typeof getAddonLineDiscount !== "function" ||
  typeof renderAddonEligibilityMessage !== "function"
) {
  throw new Error("Expected FPB add-on methods missing");
}

function makeProduct(id = "gid://shopify/Product/1") {
  return {
    graphqlId: id,
    title: "Gift product",
    variants: [
      {
        variantGraphqlId: "gid://shopify/ProductVariant/11",
        price: "10.00",
      },
    ],
  };
}

function buildStep(personalizationData: Record<string, unknown>) {
  const ctx = {
    selectedBundle: {
      steps: [{ id: "paid", name: "Step 1" }],
      personalizationData,
    },
    normalizePersonalizationAddonProduct:
      fullPageInitialRenderMethods.normalizePersonalizationAddonProduct,
  };

  return buildAddonStepFromPersonalization.call(ctx);
}

describe("FPB add-ons / gifting step separation", () => {
  it("creates the gifting step when Add-Ons and Gifting Step is enabled and Add-Ons with Bundles is disabled", () => {
    const step = buildStep({
      isPersonalizationEnabled: true,
      personalizeStepText: "Add On",
      personalizePageSubtext: "Choose a gift",
      stepImage: "https://cdn.example/icon.png",
      addonProducts: {
        isEnabled: false,
        title: "Add ON",
        tiers: [
          {
            eligibilityCondition: { type: "QUANTITY", value: 6 },
            discount: { type: "PERCENTAGE", value: 100 },
            selectedAddonProducts: [makeProduct()],
          },
        ],
      },
    });

    expect(step).toMatchObject({
      id: "personalization-addons",
      isFreeGift: true,
      name: "Add On",
      addonLabel: "Add On",
      addonTitle: "Choose a gift",
      addonIconUrl: "https://cdn.example/icon.png",
      addonUnlockAfterCompletion: true,
      addonDisplayFree: true,
    });
    expect(step.StepProduct).toEqual([]);
    expect(step.products).toEqual([]);
    expect(step.addonTiers).toBeUndefined();
    expect(step.addonEligibilityCondition).toBeNull();
    expect(step.addonDiscount).toBeNull();
  });

  it("does not create the gifting step when only Add-Ons with Bundles is enabled", () => {
    const step = buildStep({
      isPersonalizationEnabled: false,
      addonProducts: {
        isEnabled: true,
        title: "Add ON",
        tiers: [
          {
            eligibilityCondition: { type: "QUANTITY", value: 1 },
            discount: { type: "PERCENTAGE", value: 100 },
            selectedAddonProducts: [makeProduct()],
          },
        ],
      },
    });

    expect(step).toBeNull();
  });

  it("treats selected add-on products on any enabled tier as a condition", () => {
    expect(
      bundleHasNoConditions.call({
        selectedBundle: {
          steps: [
            {},
            {
              isFreeGift: true,
              addonTiers: [
                {
                  eligibilityCondition: { type: "QUANTITY", value: 0 },
                  selectedAddonProducts: [],
                },
                {
                  eligibilityCondition: { type: "QUANTITY", value: 0 },
                  selectedAddonProducts: [makeProduct()],
                },
              ],
            },
          ],
        },
      }),
    ).toBe(false);
  });

  it("uses the highest eligible add-on tier instead of always using tier 1", () => {
    (global as any).window = {
      Shopify: { currency: { active: "USD", format: "${{amount}}" } },
      shopMoneyFormat: "${{amount}}",
    };
    const step = {
      isFreeGift: true,
      addonTiers: [
        {
          eligibilityCondition: { type: "QUANTITY", value: 3 },
          discount: { type: "PERCENTAGE", value: 20 },
          selectedAddonProducts: [makeProduct()],
        },
        {
          eligibilityCondition: { type: "QUANTITY", value: 6 },
          discount: { type: "PERCENTAGE", value: 100 },
          selectedAddonProducts: [makeProduct("gid://shopify/Product/2")],
        },
      ],
    };

    const state = getAddonEligibilityState.call(
      {
        selectedProducts: [{ paidVariant: 6 }],
        stepProductData: [[{ variantId: "paidVariant", price: 1000 }]],
        selectedBundle: { steps: [{ id: "paid" }, step] },
      },
      step,
    );

    expect(state.isEligible).toBe(true);
    expect(state.variables.addonsDiscountValue).toBe("100");
  });

  it("uses the active tier-specific message when multiple tiers are configured", () => {
    (global as any).window = {
      Shopify: { currency: { active: "USD", format: "${{amount}}" } },
      shopMoneyFormat: "${{amount}}",
    };
    const step = {
      isFreeGift: true,
      addonMessaging: {
        tier1: {
          eligibleState: "Tier 1 gives ##addonsDiscountValue####addonsDiscountValueUnit## off",
        },
        tier2: {
          eligibleState: "Tier 2 gives ##addonsDiscountValue####addonsDiscountValueUnit## off",
        },
      },
      addonTiers: [
        {
          eligibilityCondition: { type: "QUANTITY", value: 3 },
          discount: { type: "PERCENTAGE", value: 20 },
          selectedAddonProducts: [makeProduct()],
        },
        {
          eligibilityCondition: { type: "QUANTITY", value: 6 },
          discount: { type: "PERCENTAGE", value: 100 },
          selectedAddonProducts: [makeProduct("gid://shopify/Product/2")],
        },
      ],
    };
    const ctx = {
      selectedProducts: [{ paidVariant: 6 }],
      stepProductData: [[{ variantId: "paidVariant", price: 1000 }]],
      selectedBundle: { steps: [{ id: "paid" }, step] },
    };

    const state = getAddonEligibilityState.call(ctx, step);
    const message = renderAddonEligibilityMessage.call(ctx, step, state);

    expect(message).toBe("Tier 2 gives 100% off");
  });

  it("does not return an add-on line discount before the active tier is eligible", () => {
    (global as any).window = {
      Shopify: { currency: { active: "USD", format: "${{amount}}" } },
      shopMoneyFormat: "${{amount}}",
    };
    const step = {
      isFreeGift: true,
      addonTiers: [
        {
          eligibilityCondition: { type: "QUANTITY", value: 3 },
          discount: { type: "PERCENTAGE", value: 20 },
          selectedAddonProducts: [makeProduct()],
        },
      ],
    };

    expect(
      getAddonLineDiscount.call(
        {
          selectedProducts: [{ paidVariant: 1 }],
          stepProductData: [[{ variantId: "paidVariant", price: 1000 }]],
          selectedBundle: { steps: [{ id: "paid" }, step] },
        },
        step,
      ),
    ).toBeNull();
  });

  it("exposes the eligible tier and index from tier evaluation", () => {
    const step = {
      isFreeGift: true,
      addonTiers: [
        {
          eligibilityCondition: { type: "QUANTITY", value: 3 },
          discount: { type: "PERCENTAGE", value: 20 },
        },
        {
          eligibilityCondition: { type: "QUANTITY", value: 6 },
          discount: { type: "PERCENTAGE", value: 100 },
        },
      ],
    };

    expect(
      getAddonTierEvaluation.call(
        {
          selectedProducts: [{ paidVariant: 6 }],
          stepProductData: [[{ variantId: "paidVariant", price: 1000 }]],
          selectedBundle: { steps: [{ id: "paid" }, step] },
        },
        step,
      ),
    ).toMatchObject({
      tierIndex: 1,
      isEligible: true,
    });
  });
});
