export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageStepFooterMethods } =
  require("../../../app/assets/widgets/full-page/methods/step-footer-methods.js");

describe("FPB checkout cart-line properties", () => {
  it("keeps public checkout labels out of component source metadata", () => {
    const originalWindow = (global as any).window;
    let sourceProperties;

    try {
      (global as any).window = {
        Shopify: { currency: { active: "USD", format: ["$", "{{amount}}"].join("") } },
      };

      sourceProperties = fullPageStepFooterMethods.buildCartLineSourceProperties.call(
        {
          selectedProducts: [],
          stepProductData: [],
          selectedBundle: { steps: [] },
          getDiscountInfoWithSelectedAddonDiscount: () => ({
            discountAmount: 8290,
          }),
          buildCartLineDisplayProperties:
            fullPageStepFooterMethods.buildCartLineDisplayProperties,
          getCartLineLabels: () => ({
            items: "Items",
            retailPrice: "Retail Price",
            youSave: "You Save",
          }),
        },
        [
          { product: { title: "14k Dangling Obsidian Earrings" }, quantity: 1 },
          { product: { title: "14k Dangling Obsidian Earrings" }, quantity: 1 },
        ],
      );
    } finally {
      (global as any).window = originalWindow;
    }

    expect(sourceProperties).toEqual({
      _bundle_display_properties: JSON.stringify({
        box: "1",
        items:
          "1 x 14k Dangling Obsidian Earrings, 1 x 14k Dangling Obsidian Earrings",
        retailPrice: "$0.00",
        youSave: {
          amount: "$82.90",
          percentage: "0%",
          amountPercentage: "$82.90 (0%)",
        },
      }),
    });
    expect(sourceProperties).not.toHaveProperty("Items");
    expect(sourceProperties).not.toHaveProperty("Retail Price");
    expect(sourceProperties).not.toHaveProperty("You Save");
    expect(sourceProperties).not.toHaveProperty("Box");
  });

  it("uses EB-style box numbering and hidden bundle metadata for paid add-on lines", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const originalFetch = (global as any).fetch;
    const originalDocument = (global as any).document;
    const originalGetComputedStyle = (global as any).getComputedStyle;
    const originalSetTimeout = (global as any).setTimeout;
    (global as any).fetch = fetchMock;
    (global as any).document = {
      documentElement: {},
      getElementById: () => null,
      createElement: () => ({
        id: "",
        className: "",
        innerHTML: "",
        remove: jest.fn(),
        querySelector: () => ({
          addEventListener: jest.fn(),
        }),
      }),
      body: {
        appendChild: jest.fn(),
      },
    };
    (global as any).getComputedStyle = () => ({
      getPropertyValue: () => "",
    });
    (global as any).setTimeout = jest.fn();

    try {
      await fullPageStepFooterMethods.addBundleToCart.call({
        _isWidgetActionBusy: false,
        container: null,
        selectedBundle: {
          name: "Daily Essentials",
          steps: [
            { id: "paid-step", isFreeGift: false },
            { id: "addon-step", isFreeGift: true, addonDisplayFree: false },
          ],
        },
        selectedProducts: [
          { "gid://shopify/ProductVariant/111": 1 },
          { "gid://shopify/ProductVariant/222": 1 },
        ],
        stepProductData: [
          [{ variantId: "gid://shopify/ProductVariant/111", title: "Paid product" }],
          [{ variantId: "gid://shopify/ProductVariant/222", title: "Paid add-on" }],
        ],
        areBundleConditionsMet: () => true,
        expandProductsByVariant: (products: unknown[]) => products,
        extractId: (value: string) => value.split("/").pop(),
        generateBundleSessionKey: () => "ABC",
        resolveFullPageOfferId: () => "FBP-1",
        getAddonTierEvaluation: (step: { isFreeGift?: boolean }) =>
          step.isFreeGift ? { tier: { tierId: "tier1" } } : {},
        getAddonLineDiscount: (step: { isFreeGift?: boolean }) =>
          step.isFreeGift ? { type: "PERCENTAGE", value: 10 } : null,
        getSelectedSellingPlanAllocationId: () => null,
        buildCartLineSourceProperties: () => ({
          _bundle_display_properties: JSON.stringify({ box: "1" }),
        }),
        _setWidgetBusy: jest.fn(),
        showLoadingOverlay: jest.fn(),
        hideLoadingOverlay: jest.fn(),
        syncBundleDetailsCartMetafield: jest.fn(),
        _emitStorefrontEvent: jest.fn(),
        _handlePostAddToCartAction: jest.fn(),
        _getLandingPageControls: () => ({ checkout: null }),
      });
    } finally {
      (global as any).fetch = originalFetch;
      (global as any).document = originalDocument;
      (global as any).getComputedStyle = originalGetComputedStyle;
      (global as any).setTimeout = originalSetTimeout;
    }

    const addRequest = fetchMock.mock.calls.find(([url]) => url === "/cart/add.js");
    expect(addRequest).toBeDefined();
    const body = JSON.parse(addRequest[1].body);
    const addonLine = body.items.find(
      (item: { properties: Record<string, string> }) =>
        item.properties._bundle_step_type === "addon:PERCENTAGE:10",
    );

    expect(addonLine.properties.Box).toBe("1");
    expect(addonLine.properties).toHaveProperty("_bundle_display_properties");
    expect(addonLine.properties).not.toHaveProperty("Items");
    expect(addonLine.properties).not.toHaveProperty("Retail Price");
    expect(addonLine.properties).not.toHaveProperty("You Save");
  });
});
