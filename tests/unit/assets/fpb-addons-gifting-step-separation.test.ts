/**
 * Unit Tests: FPB add-ons / gifting step separation
 *
 * The reference bundle exposes two separate controls:
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
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageProductCardFooterMethods } =
  require("../../../app/assets/widgets/full-page/methods/product-card-footer-methods.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageProductProcessingMethods } =
  require("../../../app/assets/widgets/full-page/methods/product-processing-methods.js");

const buildAddonStepFromPersonalization =
  fullPageInitialRenderMethods.buildAddonStepFromPersonalization;
const bundleHasNoConditions = fullPageValidationAddonsMethods.bundleHasNoConditions;
const getAddonEligibilityState =
  fullPageValidationAddonsMethods.getAddonEligibilityState;
const getAddonTierEvaluation =
  fullPageValidationAddonsMethods.getAddonTierEvaluation;
const getAddonLineDiscount =
  fullPageValidationAddonsMethods.getAddonLineDiscount;
const calculateSelectedAddonDiscountAmount =
  fullPageValidationAddonsMethods.calculateSelectedAddonDiscountAmount;
const renderAddonEligibilityMessage =
  fullPageValidationAddonsMethods.renderAddonEligibilityMessage;
const getAddonMessageEligibilityState =
  fullPageValidationAddonsMethods.getAddonMessageEligibilityState;
const buildPaidAddonProductDisplayData =
  fullPageProductCardFooterMethods.buildPaidAddonProductDisplayData;
const createProductCard =
  fullPageProductCardFooterMethods.createProductCard;
const getProductCardAddButtonText =
  fullPageProductCardFooterMethods.getProductCardAddButtonText;
const loadStepProducts = fullPageProductProcessingMethods.loadStepProducts;

if (
  typeof buildAddonStepFromPersonalization !== "function" ||
  typeof bundleHasNoConditions !== "function" ||
  typeof getAddonEligibilityState !== "function" ||
  typeof getAddonTierEvaluation !== "function" ||
  typeof getAddonLineDiscount !== "function" ||
  typeof calculateSelectedAddonDiscountAmount !== "function" ||
  typeof renderAddonEligibilityMessage !== "function" ||
  typeof buildPaidAddonProductDisplayData !== "function" ||
  typeof createProductCard !== "function" ||
  typeof getProductCardAddButtonText !== "function" ||
  typeof loadStepProducts !== "function"
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
      addonDisplayFree: false,
      addonProductsEnabled: false,
    });
    expect(step.StepProduct).toEqual([]);
    expect(step.products).toEqual([]);
    expect(step.addonTiers).toBeUndefined();
    expect(step.addonEligibilityCondition).toBeNull();
    expect(step.addonDiscount).toBeNull();
  });

  it("does not render free gift eligibility messaging for a gifting-only step", () => {
    const step = buildStep({
      isPersonalizationEnabled: true,
      personalizeStepText: "Add On",
      addonProducts: {
        isEnabled: false,
        title: "Add ON",
        tiers: [],
      },
    });
    const originalDocument = (global as any).document;
    (global as any).document = {
      createElement: () => ({
        className: "",
        innerHTML: "",
      }),
    };
    const container = {
      children: [] as Array<{ className?: string; innerHTML?: string }>,
      appendChild(child: { className?: string; innerHTML?: string }) {
        this.children.push(child);
      },
      get textContent() {
        return this.children.map((child) => child.innerHTML || "").join("");
      },
    };

    try {
      fullPageValidationAddonsMethods._renderFreeGiftSection.call(
        {
          freeGiftStep: step,
          _escapeHTML: (value: unknown) => String(value ?? ""),
          isFreeGiftUnlocked: true,
        },
        container,
      );
    } finally {
      (global as any).document = originalDocument;
    }

    expect(container.textContent).toBe("");
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

  it("derives default add-on tier messages when saved templates are empty", () => {
    (global as any).window = {
      Shopify: { currency: { active: "USD", format: "${{amount}}" } },
      shopMoneyFormat: "${{amount}}",
    };
    const step = {
      isFreeGift: true,
      addonMessaging: {
        isEnabled: false,
        tier1: {
          ineligibleState: "",
          eligibleState: "",
        },
      },
      addonTiers: [
        {
          eligibilityCondition: { type: "QUANTITY", value: 2 },
          discount: { type: "PERCENTAGE", value: 10 },
          selectedAddonProducts: [makeProduct()],
        },
      ],
    };
    const baseCtx = {
      stepProductData: [[{ variantId: "paidVariant", price: 1000 }]],
      selectedBundle: { steps: [{ id: "paid" }, step] },
    };

    const ineligibleState = getAddonEligibilityState.call(
      { ...baseCtx, selectedProducts: [{ paidVariant: 1 }] },
      step,
    );
    expect(renderAddonEligibilityMessage.call(baseCtx, step, ineligibleState)).toBe(
      "Add 1 more product(s) to claim 10% off on Add ons",
    );

    const eligibleState = getAddonEligibilityState.call(
      { ...baseCtx, selectedProducts: [{ paidVariant: 2 }] },
      step,
    );
    expect(renderAddonEligibilityMessage.call(baseCtx, step, eligibleState)).toBe(
      "Congrats you are eligible for 10% off on Add ons",
    );
  });

  it("resolves saved single-brace add-on message aliases", () => {
    (global as any).window = {
      Shopify: { currency: { active: "USD", format: "${{amount}}" } },
      shopMoneyFormat: "${{amount}}",
    };
    const step = {
      isFreeGift: true,
      addonMessaging: {
        tier1: {
          ineligibleState:
            "Add {remainingQuantity} more product(s) to claim {discountValue}% off on Add ons",
          eligibleState:
            "Congrats you are eligible for {discountValue}% off on Add ons",
        },
      },
      addonTiers: [
        {
          eligibilityCondition: { type: "QUANTITY", value: 2 },
          discount: { type: "PERCENTAGE", value: 100 },
          selectedAddonProducts: [makeProduct()],
        },
      ],
    };
    const baseCtx = {
      stepProductData: [[{ variantId: "paidVariant", price: 1000 }]],
      selectedBundle: { steps: [{ id: "paid" }, step] },
    };

    const ineligibleState = getAddonEligibilityState.call(
      { ...baseCtx, selectedProducts: [{ paidVariant: 1 }] },
      step,
    );
    expect(renderAddonEligibilityMessage.call(baseCtx, step, ineligibleState)).toBe(
      "Add 1 more product(s) to claim 100% off on Add ons",
    );

    const eligibleState = getAddonEligibilityState.call(
      { ...baseCtx, selectedProducts: [{ paidVariant: 2 }] },
      step,
    );
    expect(renderAddonEligibilityMessage.call(baseCtx, step, eligibleState)).toBe(
      "Congrats you are eligible for 100% off on Add ons",
    );
  });

  it("shows next locked add-on tier progress while keeping the active discount tier", () => {
    (global as any).window = {
      Shopify: { currency: { active: "USD", format: "${{amount}}" } },
      shopMoneyFormat: "${{amount}}",
    };
    const step = {
      isFreeGift: true,
      addonMessaging: {
        tier1: {
          eligibleState: "Congrats you are eligible for {discountValue}% off on Add ons",
        },
        tier2: {
          ineligibleState:
            "Add {remainingQuantity} more product(s) to claim {discountValue}% off on Add ons",
          eligibleState:
            "Congrats you are eligible for {discountValue}% off on Add ons",
        },
      },
      addonTiers: [
        {
          eligibilityCondition: { type: "QUANTITY", value: 1 },
          discount: { type: "PERCENTAGE", value: 10 },
          selectedAddonProducts: [makeProduct("gid://shopify/Product/1")],
        },
        {
          eligibilityCondition: { type: "QUANTITY", value: 2 },
          discount: { type: "PERCENTAGE", value: 100 },
          selectedAddonProducts: [makeProduct("gid://shopify/Product/2")],
        },
      ],
    };
    const ctx = {
      selectedProducts: [{ paidVariant: 1 }],
      stepProductData: [[{ variantId: "paidVariant", price: 1000 }]],
      selectedBundle: { steps: [{ id: "paid" }, step] },
    };

    const messageState = typeof getAddonMessageEligibilityState === "function"
      ? getAddonMessageEligibilityState.call(ctx, step)
      : getAddonEligibilityState.call(ctx, step);
    expect(renderAddonEligibilityMessage.call(ctx, step, messageState)).toBe(
      "Add 1 more product(s) to claim 100% off on Add ons",
    );
    expect(getAddonLineDiscount.call(ctx, step)).toEqual({
      type: "PERCENTAGE",
      value: 10,
    });
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

  it("does not discount a paid-step line just because it is also an add-on candidate", () => {
    const addonProduct = makeProduct();
    const addonStep = {
      isFreeGift: true,
      addonDisplayFree: false,
      StepProduct: [addonProduct],
      products: [addonProduct],
      addonTiers: [
        {
          eligibilityCondition: { type: "QUANTITY", value: 1 },
          discount: { type: "PERCENTAGE", value: 10 },
          selectedAddonProducts: [addonProduct],
        },
      ],
    };
    const ctx = {
      ...fullPageValidationAddonsMethods,
      selectedProducts: [{ paidVariant: 1 }, {}],
      stepProductData: [[{ variantId: "paidVariant", price: 82900 }], []],
      selectedBundle: { steps: [{ id: "paid" }, addonStep] },
      getAllSelectedProductsData: () => [
        {
          stepIndex: 0,
          variantId: "paidVariant",
          productId: addonProduct.graphqlId,
          title: addonProduct.title,
          parentTitle: addonProduct.title,
          quantity: 1,
          price: 82900,
          isFreeGift: false,
          addonDisplayFree: false,
        },
      ],
      extractId: (value: unknown) => String(value ?? "").split("/").pop(),
      getAddonLineDiscount: (step: unknown) => step === addonStep ? { type: "PERCENTAGE", value: 10 } : null,
    };

    expect(calculateSelectedAddonDiscountAmount.call(ctx)).toBe(0);
  });

  it("discounts a selected paid add-on line on the add-on step", () => {
    const addonStep = {
      isFreeGift: true,
      addonDisplayFree: false,
      StepProduct: [makeProduct()],
      products: [makeProduct()],
      addonTiers: [
        {
          eligibilityCondition: { type: "QUANTITY", value: 1 },
          discount: { type: "PERCENTAGE", value: 10 },
          selectedAddonProducts: [makeProduct()],
        },
      ],
    };
    const ctx = {
      ...fullPageValidationAddonsMethods,
      selectedProducts: [{ paidVariant: 1 }, { addonVariant: 1 }],
      stepProductData: [
        [{ variantId: "paidVariant", price: 82900 }],
        [{ variantId: "addonVariant", price: 82900 }],
      ],
      selectedBundle: { steps: [{ id: "paid" }, addonStep] },
      getAllSelectedProductsData: () => [
        {
          stepIndex: 1,
          variantId: "addonVariant",
          quantity: 1,
          price: 82900,
          isFreeGift: true,
          addonDisplayFree: false,
        },
      ],
      extractId: (value: unknown) => String(value ?? "").split("/").pop(),
      getAddonLineDiscount: (step: unknown) => step === addonStep ? { type: "PERCENTAGE", value: 10 } : null,
    };

    expect(calculateSelectedAddonDiscountAmount.call(ctx)).toBe(8290);
  });

  it("counts active 100 percent add-on tier savings even when the step displays as free", () => {
    const addonStep = {
      isFreeGift: true,
      addonDisplayFree: true,
      StepProduct: [makeProduct()],
      products: [makeProduct()],
      addonTiers: [
        {
          eligibilityCondition: { type: "QUANTITY", value: 1 },
          discount: { type: "PERCENTAGE", value: 100 },
          selectedAddonProducts: [makeProduct()],
        },
      ],
    };
    const ctx = {
      ...fullPageValidationAddonsMethods,
      selectedProducts: [{ paidVariant: 1 }, { addonVariant: 1 }],
      stepProductData: [[{ variantId: "paidVariant", price: 82900 }], [{ variantId: "addonVariant", price: 82900 }]],
      selectedBundle: { steps: [{ id: "paid" }, addonStep] },
      getAllSelectedProductsData: () => [
        {
          stepIndex: 1,
          variantId: "addonVariant",
          quantity: 1,
          price: 82900,
          isFreeGift: true,
          addonDisplayFree: true,
        },
      ],
      extractId: (value: unknown) => String(value ?? "").split("/").pop(),
      getAddonLineDiscount: (step: unknown) =>
        step === addonStep ? { type: "PERCENTAGE", value: 100 } : null,
    };

    expect(calculateSelectedAddonDiscountAmount.call(ctx)).toBe(82900);
  });

  it("derives paid add-on card display pricing from the active add-on discount", () => {
    const step = { isFreeGift: true, addonDisplayFree: false };
    const displayProduct = buildPaidAddonProductDisplayData.call(
      {
        getAddonLineDiscount: () => ({ type: "PERCENTAGE", value: 10 }),
      },
      { title: "Gift product", price: 82900, compareAtPrice: null },
      step,
    );

    expect(displayProduct).toMatchObject({
      title: "Gift product",
      price: 74610,
      compareAtPrice: 82900,
      addonDiscountBadgeText: "10% off",
    });
  });

  it("derives 100% add-on card display pricing from the active add-on discount", () => {
    const step = { isFreeGift: true, addonDisplayFree: true };
    const displayProduct = buildPaidAddonProductDisplayData.call(
      {
        getAddonLineDiscount: () => ({ type: "PERCENTAGE", value: 100 }),
      },
      { title: "Gift product", price: 82900, compareAtPrice: null },
      step,
    );

    expect(displayProduct).toMatchObject({
      title: "Gift product",
      price: 0,
      compareAtPrice: 82900,
      addonDiscountBadgeText: "100% off",
    });
  });

  it("uses the product add label for Classic paid add-on product cards", () => {
    const ctx = {
      _resolveText: (key: string, fallback: string) =>
        key === "addToCartButton" ? "Add To Cart" : fallback,
      getProductAddButtonText: () => "Add To Box",
      getFullPageDesignPreset: () => "CLASSIC",
    };

    expect(
      getProductCardAddButtonText.call(ctx, {
        isFreeGift: true,
        addonDisplayFree: false,
      }),
    ).toBe("Add To Box");
    expect(getProductCardAddButtonText.call(ctx, {})).toBe("Add To Box");
  });

  it("renders the active tier badge on Classic paid add-on product cards", () => {
    const step = { isFreeGift: true, addonDisplayFree: false };
    const ctx = {
      selectedProducts: [{}],
      selectedBundle: {
        variantSelectorEnabled: false,
        steps: [step],
      },
      getFullPageDesignPreset: () => "CLASSIC",
      getProductAddButtonText: () => "Add To Box",
      getProductCardAddButtonText,
      buildPaidAddonProductDisplayData,
      getAddonLineDiscount: () => ({ type: "PERCENTAGE", value: 10 }),
      applyStandardExpandedVariantTitle: () => undefined,
      attachProductCardListeners: () => undefined,
    };
    const originalDocument = (global as any).document;
    (global as any).document = {
      createElement: () => {
        const wrapper: { firstChild: { textContent: string }; innerHTML: string } = {
          firstChild: { textContent: "" },
          innerHTML: "",
        };
        Object.defineProperty(wrapper, "innerHTML", {
          set(value: string) {
            this.firstChild = {
              textContent: value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
            };
          },
          get() {
            return this.firstChild.textContent;
          },
        });
        return wrapper;
      },
    };

    try {
      const card = createProductCard.call(
        ctx,
        {
          id: "addon-product",
          title: "Gift product",
          price: 82900,
          imageUrl: "https://cdn.example.test/gift.png",
        },
        0,
      );

      expect(card.textContent).toContain("10% off");
      expect(card.textContent).toContain("Add To Box");
    } finally {
      (global as any).document = originalDocument;
    }
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

  it("loads products and selection capacity from the active add-on tier only", async () => {
    const tierOneProduct = {
      ...makeProduct("gid://shopify/Product/1"),
      variants: [{ variantGraphqlId: "gid://shopify/ProductVariant/11", price: "10.00" }],
    };
    const tierTwoProduct = {
      ...makeProduct("gid://shopify/Product/2"),
      variants: [{ variantGraphqlId: "gid://shopify/ProductVariant/22", price: "20.00" }],
    };
    const addonStep = {
      isFreeGift: true,
      maxQuantity: 2,
      addonTiers: [
        {
          eligibilityCondition: { type: "QUANTITY", value: 1 },
          discount: { type: "PERCENTAGE", value: 20 },
          selectedAddonProducts: [tierOneProduct],
        },
        {
          eligibilityCondition: { type: "QUANTITY", value: 2 },
          discount: { type: "PERCENTAGE", value: 100 },
          selectedAddonProducts: [tierTwoProduct],
        },
      ],
    };
    const ctx = {
      ...fullPageValidationAddonsMethods,
      ...fullPageInitialRenderMethods,
      ...fullPageProductProcessingMethods,
      selectedProducts: [{ paidVariant: 2 }, { "11": 1 }],
      stepProductData: [[{ variantId: "paidVariant", price: 1000 }], []],
      selectedBundle: { steps: [{ id: "paid" }, addonStep] },
      directDefaultProducts: [],
      stepCollectionProductIds: {},
      processProductsForStep: (_products: unknown[], _step: unknown) => [
        { variantId: "22", id: "2", price: 2000 },
      ],
      _mergeDirectDefaultProductsIntoStep: (_stepIndex: number, products: unknown[]) => products,
      collectStepCollectionHandles: () => [],
    };

    await loadStepProducts.call(ctx, 1);

    expect(addonStep.maxQuantity).toBe(1);
    expect(ctx.stepProductData[1]).toEqual([{ variantId: "22", id: "2", price: 2000 }]);
    expect(ctx.selectedProducts[1]).toEqual({});
  });
});
