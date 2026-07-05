export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageProductProcessingMethods } =
  require("../../../app/assets/widgets/full-page/methods/product-processing-methods.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageInitialRenderMethods } =
  require("../../../app/assets/widgets/full-page/methods/initial-render-methods.js");

describe("FPB add-on active tier products", () => {
  it("loads only eligible active-tier products for the add-on step", async () => {
    const tier1Product = {
      graphqlId: "gid://shopify/Product/1",
      title: "Tier 1 add-on",
      variants: [{ variantGraphqlId: "gid://shopify/ProductVariant/11", price: "10.00" }],
    };
    const tier2Product = {
      graphqlId: "gid://shopify/Product/2",
      title: "Tier 2 add-on",
      variants: [{ variantGraphqlId: "gid://shopify/ProductVariant/22", price: "20.00" }],
    };
    const eligibleTier = {
      eligibilityCondition: { type: "QUANTITY", value: 6 },
      discount: { type: "PERCENTAGE", value: 100 },
      displayVariantsAsIndividualProducts_addons: true,
      selectedAddonProducts: [tier2Product],
    };
    const step: {
      isFreeGift: boolean;
      addonTiers: Array<Record<string, unknown>>;
      displayVariantsAsIndividual?: boolean;
      addonDisplayFree?: boolean;
    } = {
      isFreeGift: true,
      addonTiers: [
        {
          eligibilityCondition: { type: "QUANTITY", value: 3 },
          discount: { type: "PERCENTAGE", value: 20 },
          selectedAddonProducts: [tier1Product],
        },
        eligibleTier,
      ],
    };
    const ctx = {
      selectedBundle: { steps: [step] },
      stepProductData: [[]],
      stepCollectionProductIds: {},
      getAddonTierEvaluation: () => ({
        tier: eligibleTier,
        tierIndex: 1,
        isEligible: true,
      }),
      normalizePersonalizationAddonProduct:
        fullPageInitialRenderMethods.normalizePersonalizationAddonProduct,
      processProductsForStep: (products: unknown[]) => products,
      _mergeDirectDefaultProductsIntoStep: (_stepIndex: number, products: unknown[]) => products,
      collectStepProductIds: () => [],
      collectStepCollectionHandles: () => [],
      shouldExpandStepProductsDuringLoad: () => false,
    };

    await fullPageProductProcessingMethods.loadStepProducts.call(ctx, 0);

    expect(ctx.stepProductData[0]).toHaveLength(1);
    expect(ctx.stepProductData[0][0]).toMatchObject({
      title: "Tier 2 add-on",
      productId: "gid://shopify/Product/2",
    });
    expect(step.displayVariantsAsIndividual).toBe(true);
    expect(step.addonDisplayFree).toBe(true);
  });

  it("loads no add-on products when no tier is eligible", async () => {
    const step = {
      isFreeGift: true,
      addonTiers: [
        {
          eligibilityCondition: { type: "QUANTITY", value: 3 },
          discount: { type: "PERCENTAGE", value: 20 },
          selectedAddonProducts: [
            {
              graphqlId: "gid://shopify/Product/1",
              title: "Tier 1 add-on",
              variants: [{ variantGraphqlId: "gid://shopify/ProductVariant/11", price: "10.00" }],
            },
          ],
        },
      ],
    };
    const ctx = {
      selectedBundle: { steps: [step] },
      stepProductData: [[]],
      stepCollectionProductIds: {},
      getAddonTierEvaluation: () => ({
        tier: step.addonTiers[0],
        tierIndex: 0,
        isEligible: false,
      }),
      normalizePersonalizationAddonProduct:
        fullPageInitialRenderMethods.normalizePersonalizationAddonProduct,
      processProductsForStep: (products: unknown[]) => products,
      _mergeDirectDefaultProductsIntoStep: (_stepIndex: number, products: unknown[]) => products,
      collectStepProductIds: () => [],
      collectStepCollectionHandles: () => [],
      shouldExpandStepProductsDuringLoad: () => false,
    };

    await fullPageProductProcessingMethods.loadStepProducts.call(ctx, 0);

    expect(ctx.stepProductData[0]).toEqual([]);
  });
});
