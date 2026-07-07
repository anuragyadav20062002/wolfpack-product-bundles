export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageStepFooterMethods } =
  require("../../../app/assets/widgets/full-page/methods/step-footer-methods.js");

describe("FPB checkout cart-line properties", () => {
  it("keeps paid add-on savings out of parent bundle display metadata", () => {
    const originalWindow = (global as any).window;
    let sourceProperties;

    try {
      (global as any).window = {
        Shopify: { currency: { active: "USD", format: ["$", "{{amount}}"].join("") } },
      };

      const paidStep = { id: "paid-step" };
      const paidAddonStep = { id: "addon-step", isFreeGift: true, addonDisplayFree: false };

      sourceProperties = fullPageStepFooterMethods.buildCartLineSourceProperties.call(
        {
          selectedProducts: [
            { paidVariant: 1 },
            { addonVariant: 1 },
          ],
          stepProductData: [
            [{ variantId: "paidVariant", title: "Paid product", price: 82900 }],
            [{ variantId: "addonVariant", title: "Paid add-on", price: 82900 }],
          ],
          selectedBundle: {
            pricing: { enabled: false, rules: [] },
            steps: [paidStep, paidAddonStep],
          },
          buildCartLineDisplayProperties:
            fullPageStepFooterMethods.buildCartLineDisplayProperties,
          getCartLineLabels: () => ({
            items: "Items",
            retailPrice: "Retail Price",
            youSave: "You Save",
          }),
        },
        [
          { product: { title: "Paid product", price: 82900 }, quantity: 1, step: paidStep },
          { product: { title: "Paid add-on", price: 82900 }, quantity: 1, step: paidAddonStep },
        ],
      );
    } finally {
      (global as any).window = originalWindow;
    }

    expect(JSON.parse(sourceProperties._bundle_display_properties)).toEqual({
      box: "1",
      items: "1 x Paid product",
      retailPrice: "$829.00",
    });
    expect(sourceProperties).not.toHaveProperty("Items");
    expect(sourceProperties).not.toHaveProperty("Retail Price");
    expect(sourceProperties).not.toHaveProperty("You Save");
    expect(sourceProperties).not.toHaveProperty("Box");
  });

  it("omits Box cart properties for BXY when bundle quantity options are hidden", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const originalFetch = (global as any).fetch;
    const originalWindow = (global as any).window;
    const originalDocument = (global as any).document;
    const originalGetComputedStyle = (global as any).getComputedStyle;
    const originalSetTimeout = (global as any).setTimeout;
    (global as any).fetch = fetchMock;
    (global as any).window = {
      Shopify: {
        currency: { active: "USD", format: ["$", "{{amount}}"].join("") },
      },
    };
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
          id: "bundle-1",
          name: "Daily Essentials",
          pricing: {
            enabled: true,
            method: "buy_x_get_y",
            rules: [{
              id: "rule-1",
              conditionType: "quantity",
              conditionValue: 2,
              customerBuys: 2,
              customerGets: 1,
              discountValue: 100,
              bxyDiscountType: "percentage",
              bxyApplyMode: "lowest_priced",
            }],
            messages: {
              displayOptions: {
                bundleQuantityOptions: { enabled: false },
              },
            },
          },
          steps: [{ id: "paid-step", isFreeGift: false }],
        },
        selectedProducts: [
          {
            "gid://shopify/ProductVariant/111": 1,
            "gid://shopify/ProductVariant/222": 1,
          },
        ],
        stepProductData: [
          [
            { variantId: "gid://shopify/ProductVariant/111", title: "First product", price: 82900 },
            { variantId: "gid://shopify/ProductVariant/222", title: "Second product", price: 61900 },
          ],
        ],
        areBundleConditionsMet: () => true,
        expandProductsByVariant: (products: unknown[]) => products,
        extractId: (value: string) => value.split("/").pop(),
        generateBundleSessionKey: () => "ABC",
        resolveFullPageOfferId: () => "FBP-1",
        getAddonTierEvaluation: () => ({}),
        getAddonLineDiscount: () => null,
        getSelectedSellingPlanAllocationId: () => null,
        buildCartLineSourceProperties:
          fullPageStepFooterMethods.buildCartLineSourceProperties,
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
      (global as any).window = originalWindow;
      (global as any).document = originalDocument;
      (global as any).getComputedStyle = originalGetComputedStyle;
      (global as any).setTimeout = originalSetTimeout;
    }

    const addRequest = fetchMock.mock.calls.find(([url]) => url === "/cart/add.js");
    expect(addRequest).toBeDefined();
    const body = JSON.parse(addRequest[1].body);

    expect(body.items).toHaveLength(2);
    body.items.forEach((item: { properties: Record<string, string> }) => {
      expect(item.properties).not.toHaveProperty("Box");
      expect(item.properties).toHaveProperty("_bundle_display_properties");
      expect(JSON.parse(item.properties._bundle_display_properties)).toEqual({
        items: "1 x First product, 1 x Second product",
        retailPrice: "$1448.00",
      });
    });
  });

  it("uses bundle box numbering and hidden bundle metadata for paid add-on lines", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const originalFetch = (global as any).fetch;
    const originalWindow = (global as any).window;
    const originalDocument = (global as any).document;
    const originalGetComputedStyle = (global as any).getComputedStyle;
    const originalSetTimeout = (global as any).setTimeout;
    (global as any).fetch = fetchMock;
    (global as any).window = {
      Shopify: {
        currency: { active: "USD", format: ["$", "{{amount}}"].join("") },
      },
    };
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
    const emitMock = jest.fn();

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
        _emitStorefrontEvent: emitMock,
        _handlePostAddToCartAction: jest.fn(),
        _getLandingPageControls: () => ({ checkout: null }),
      });
    } finally {
      (global as any).fetch = originalFetch;
      (global as any).window = originalWindow;
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

  it("blocks stale out-of-stock selections before posting the full-page bundle to cart", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const originalFetch = (global as any).fetch;
    const originalWindow = (global as any).window;
    const originalDocument = (global as any).document;
    const originalGetComputedStyle = (global as any).getComputedStyle;
    const originalSetTimeout = (global as any).setTimeout;
    const appendedToasts: any[] = [];
    (global as any).fetch = fetchMock;
    (global as any).window = {
      Shopify: {
        currency: { active: "USD", format: ["$", "{{amount}}"].join("") },
      },
    };
    (global as any).document = {
      documentElement: {},
      getElementById: () => null,
      createElement: () => ({
        id: "",
        className: "",
        innerHTML: "",
        classList: { add: jest.fn() },
        remove: jest.fn(),
        querySelector: () => ({
          addEventListener: jest.fn(),
        }),
      }),
      body: {
        appendChild: (element: any) => appendedToasts.push(element),
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
          steps: [{ id: "paid-step", isFreeGift: false }],
        },
        selectedProducts: [
          { "gid://shopify/ProductVariant/111": 1 },
        ],
        stepProductData: [
          [{
            variantId: "gid://shopify/ProductVariant/111",
            title: "Tracked zero-stock product",
            available: true,
            quantityAvailable: 0,
            currentlyNotInStock: false,
          }],
        ],
        areBundleConditionsMet: () => true,
        expandProductsByVariant: (products: unknown[]) => products,
        extractId: (value: string) => value.split("/").pop(),
        generateBundleSessionKey: () => "ABC",
        resolveFullPageOfferId: () => "FBP-1",
        getAddonTierEvaluation: () => ({}),
        getAddonLineDiscount: () => null,
        getSelectedSellingPlanAllocationId: () => null,
        buildCartLineSourceProperties: () => ({}),
        _setWidgetBusy: jest.fn(),
        showLoadingOverlay: jest.fn(),
        hideLoadingOverlay: jest.fn(),
        syncBundleDetailsCartMetafield: jest.fn(),
        _emitStorefrontEvent: jest.fn(),
        _handlePostAddToCartAction: jest.fn(),
        _getLandingPageControls: () => ({
          trackInventoryOnAddToCart: true,
          checkout: null,
        }),
      });
    } finally {
      (global as any).fetch = originalFetch;
      (global as any).window = originalWindow;
      (global as any).document = originalDocument;
      (global as any).getComputedStyle = originalGetComputedStyle;
      (global as any).setTimeout = originalSetTimeout;
    }

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/cart/add.js",
      expect.anything(),
    );
    expect(appendedToasts.some((toast) =>
      String(toast.innerHTML).includes("out of stock")
    )).toBe(true);
  });

  it("keeps active 100 percent add-on tier lines separate from free-gift merge semantics", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const originalFetch = (global as any).fetch;
    const originalWindow = (global as any).window;
    const originalDocument = (global as any).document;
    const originalGetComputedStyle = (global as any).getComputedStyle;
    const originalSetTimeout = (global as any).setTimeout;
    (global as any).fetch = fetchMock;
    (global as any).window = {
      Shopify: {
        currency: { active: "USD", format: ["$", "{{amount}}"].join("") },
      },
    };
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
      const addonStep = {
        id: "addon-step",
        isFreeGift: true,
        addonDisplayFree: true,
      };

      await fullPageStepFooterMethods.addBundleToCart.call({
        _isWidgetActionBusy: false,
        container: null,
        selectedBundle: {
          name: "Daily Essentials",
          pricing: { enabled: false, rules: [] },
          steps: [{ id: "paid-step", isFreeGift: false }, addonStep],
        },
        selectedProducts: [
          { "gid://shopify/ProductVariant/111": 1 },
          { "gid://shopify/ProductVariant/222": 1 },
        ],
        stepProductData: [
          [
            {
              variantId: "gid://shopify/ProductVariant/111",
              title: "Paid product",
              price: 82900,
            },
          ],
          [
            {
              variantId: "gid://shopify/ProductVariant/222",
              title: "Free add-on",
              price: 82900,
            },
          ],
        ],
        areBundleConditionsMet: () => true,
        expandProductsByVariant: (products: unknown[]) => products,
        extractId: (value: string) => value.split("/").pop(),
        generateBundleSessionKey: () => "ABC",
        resolveFullPageOfferId: () => "FBP-1",
        getAddonTierEvaluation: (step: { id?: string }) =>
          step === addonStep ? { tier: { tierId: "tier2" }, isEligible: true } : {},
        getAddonLineDiscount: (step: { id?: string }) =>
          step === addonStep ? { type: "PERCENTAGE", value: 100 } : null,
        getSelectedSellingPlanAllocationId: () => null,
        buildCartLineSourceProperties:
          fullPageStepFooterMethods.buildCartLineSourceProperties,
        buildCartLineDisplayProperties:
          fullPageStepFooterMethods.buildCartLineDisplayProperties,
        getCartLineLabels: () => ({
          items: "Items",
          retailPrice: "Retail Price",
          youSave: "You Save",
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
      (global as any).window = originalWindow;
      (global as any).document = originalDocument;
      (global as any).getComputedStyle = originalGetComputedStyle;
      (global as any).setTimeout = originalSetTimeout;
    }

    const addRequest = fetchMock.mock.calls.find(([url]) => url === "/cart/add.js");
    expect(addRequest).toBeDefined();
    const body = JSON.parse(addRequest[1].body);
    const addonLine = body.items.find(
      (item: { properties: Record<string, string> }) =>
        item.properties._bundle_step_type === "addon:PERCENTAGE:100",
    );
    const paidLine = body.items.find(
      (item: { properties: Record<string, string> }) =>
        item.properties._bundle_step_type !== "addon:PERCENTAGE:100",
    );

    expect(addonLine).toBeDefined();
    expect(addonLine.properties._addon_product).toBe("true");
    expect(addonLine.properties._addonTierId).toBe("tier2");
    expect(addonLine.properties._bundle_step_type).not.toBe("free_gift");
    expect(JSON.parse(paidLine.properties._bundle_display_properties)).toEqual({
      box: "1",
      items: "1 x Paid product",
      retailPrice: "$829.00",
    });
  });

  it("keeps Classic fixed bundle price cart lines eligible for cart-transform pricing", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const originalFetch = (global as any).fetch;
    const originalWindow = (global as any).window;
    const originalDocument = (global as any).document;
    const originalGetComputedStyle = (global as any).getComputedStyle;
    const originalSetTimeout = (global as any).setTimeout;
    (global as any).fetch = fetchMock;
    (global as any).window = {
      Shopify: {
        currency: { active: "USD", format: ["$", "{{amount}}"].join("") },
      },
    };
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
          pricing: {
            enabled: true,
            method: "fixed_bundle_price",
            rules: [{
              method: "fixed_bundle_price",
              conditionType: "quantity",
              conditionOperator: "gte",
              conditionValue: 2,
              discountValue: 500,
            }],
          },
          steps: [{ id: "paid-step", isFreeGift: false }],
        },
        selectedProducts: [
          {
            "gid://shopify/ProductVariant/111": 1,
            "gid://shopify/ProductVariant/222": 1,
          },
        ],
        stepProductData: [
          [
            {
              variantId: "gid://shopify/ProductVariant/111",
              title: "First product",
              price: 82900,
            },
            {
              variantId: "gid://shopify/ProductVariant/222",
              title: "Second product",
              price: 61900,
            },
          ],
        ],
        areBundleConditionsMet: () => true,
        expandProductsByVariant: (products: unknown[]) => products,
        extractId: (value: string) => value.split("/").pop(),
        generateBundleSessionKey: () => "ABC",
        resolveFullPageOfferId: () => "FBP-1",
        getAddonTierEvaluation: () => ({}),
        getAddonLineDiscount: () => null,
        getSelectedSellingPlanAllocationId: () => null,
        getFullPageDesignPreset: () => "CLASSIC",
        buildCartLineSourceProperties:
          fullPageStepFooterMethods.buildCartLineSourceProperties,
        buildCartLineDisplayProperties:
          fullPageStepFooterMethods.buildCartLineDisplayProperties,
        getCartLineLabels: () => ({
          items: "Items",
          retailPrice: "Retail Price",
          youSave: "You Save",
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
      (global as any).window = originalWindow;
      (global as any).document = originalDocument;
      (global as any).getComputedStyle = originalGetComputedStyle;
      (global as any).setTimeout = originalSetTimeout;
    }

    const addRequest = fetchMock.mock.calls.find(([url]) => url === "/cart/add.js");
    expect(addRequest).toBeDefined();
    const body = JSON.parse(addRequest[1].body);
    const displayProperties = JSON.parse(body.items[0].properties._bundle_display_properties);

    expect(body.items).toHaveLength(2);
    expect(body.items.every((item: { properties: Record<string, string> }) =>
      item.properties._bundle_step_type === "fixed_price_display_only"
    )).toBe(false);
    expect(body.items[0].properties._bundle_price_adjustment_mode).toBeUndefined();
    expect(displayProperties).toEqual({
      box: "1",
      items: "1 x First product, 1 x Second product",
      retailPrice: "",
    });
    expect(displayProperties).not.toHaveProperty("youSave");
  });
});
