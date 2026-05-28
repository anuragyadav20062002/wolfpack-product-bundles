import { BundleDataManager } from "../../../app/assets/widgets/shared/bundle-data-manager.js";

describe("BundleDataManager", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    Object.defineProperty(global, "window", {
      value: {
        Shopify: undefined,
        isThemeEditorContext: false,
        location: {
          pathname: "/apps/product-bundles/wpb/bundle-1",
          search: "",
        },
        autoDetectedBundleId: undefined,
      },
      writable: true,
    });

    Object.defineProperty(global, "document", {
      value: {
        referrer: "",
      },
      writable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(global, "window", {
      value: originalWindow,
      writable: true,
    });
  });

  it("selects a draft full-page bundle when it is requested explicitly by bundle ID", () => {
    const bundle = {
      id: "bundle-1",
      name: "Draft FPB",
      status: "draft",
      bundleType: "full_page",
      steps: [{ id: "step-1", name: "Step 1" }],
    };

    const selected = BundleDataManager.selectBundle(
      { "bundle-1": bundle },
      { bundleId: "bundle-1" },
    );

    expect(selected).toBe(bundle);
  });

  it("does not select a draft bundle without an explicit full-page bundle ID", () => {
    const bundle = {
      id: "bundle-1",
      name: "Draft FPB",
      status: "draft",
      bundleType: "full_page",
      steps: [{ id: "step-1", name: "Step 1" }],
    };

    const selected = BundleDataManager.selectBundle(
      { "bundle-1": bundle },
      { bundleId: null },
    );

    expect(selected).toBeNull();
  });

  it("selects a product-page bundle when widget-specific targeting is not configured", () => {
    const bundle = {
      id: "bundle-1",
      name: "Targetless PPB",
      status: "active",
      bundleType: "product_page",
      shopifyProductId: "gid://shopify/Product/1111",
      steps: [{ id: "step-1", name: "Step 1" }],
    };

    const selected = BundleDataManager.selectBundle(
      { "bundle-1": bundle },
      { currentProductId: "1111" },
    );

    expect(selected).toBe(bundle);
  });

  it("hides a product-page bundle when widget-specific targeting is set to specific products and current product does not match", () => {
    const bundle = {
      id: "bundle-1",
      name: "Product-targeted PPB",
      status: "active",
      bundleType: "product_page",
      steps: [{ id: "step-1", name: "Step 1" }],
      bundleUpsellConfig: {
        widgetConfiguration: {
          displayConfiguration: {
            showOnAllBundleProducts: false,
            selectedProducts: [{ productId: "2222", handle: "other-product" }],
            showOnSpecificProductPages: [],
            collectionsSelectedData: [],
            showOnSpecificCollectionPages: [],
          },
        },
      },
    };

    const selected = BundleDataManager.selectBundle(
      { "bundle-1": bundle },
      { currentProductId: "1111", currentProductHandle: "current-product" },
    );

    expect(selected).toBeNull();
  });

  it("selects a product-page bundle when widget-specific targeting is set to specific products and current product matches by handle", () => {
    const bundle = {
      id: "bundle-1",
      name: "Product-targeted PPB",
      status: "active",
      bundleType: "product_page",
      steps: [{ id: "step-1", name: "Step 1" }],
      bundleUpsellConfig: {
        widgetConfiguration: {
          displayConfiguration: {
            showOnAllBundleProducts: false,
            selectedProducts: [{ productId: "2222", handle: "current-product" }],
            showOnSpecificProductPages: [],
            collectionsSelectedData: [],
            showOnSpecificCollectionPages: [],
          },
        },
      },
    };

    const selected = BundleDataManager.selectBundle(
      { "bundle-1": bundle },
      { currentProductId: "1111", currentProductHandle: "current-product" },
    );

    expect(selected).toBe(bundle);
  });

  it("selects a product-page bundle when widget-specific targeting is set to specific products and current product matches by admin_graphql_api_id", () => {
    const bundle = {
      id: "bundle-1",
      name: "Product-targeted PPB",
      status: "active",
      bundleType: "product_page",
      steps: [{ id: "step-1", name: "Step 1" }],
      bundleUpsellConfig: {
        widgetConfiguration: {
          displayConfiguration: {
            showOnAllBundleProducts: false,
            selectedProducts: [{ admin_graphql_api_id: "gid://shopify/Product/1111" }],
            showOnSpecificProductPages: [],
            collectionsSelectedData: [],
            showOnSpecificCollectionPages: [],
          },
        },
      },
    };

    const selected = BundleDataManager.selectBundle(
      { "bundle-1": bundle },
      { currentProductId: "gid://shopify/Product/1111", currentProductHandle: "unrelated-product" },
    );

    expect(selected).toBe(bundle);
  });

  it("hides a product-page bundle when collection targeting is set and the product is not in the collection list", () => {
    const bundle = {
      id: "bundle-1",
      name: "Collection-targeted PPB",
      status: "active",
      bundleType: "product_page",
      steps: [{ id: "step-1", name: "Step 1" }],
      bundleUpsellConfig: {
        widgetConfiguration: {
          displayConfiguration: {
            showOnAllBundleProducts: true,
            selectedProducts: [],
            showOnSpecificProductPages: [],
            collectionsSelectedData: [{ collectionId: "3333", handle: "target-collection" }],
            showOnSpecificCollectionPages: [],
          },
        },
      },
    };

    const selected = BundleDataManager.selectBundle(
      { "bundle-1": bundle },
      {
        currentProductId: "1111",
        currentProductHandle: "current-product",
        currentProductCollections: ["gid://shopify/Collection/9999", { id: "gid://shopify/Collection/4444", handle: "other-collection" }],
      },
    );

    expect(selected).toBeNull();
  });

  it("selects a product-page bundle when collection targeting matches the current product collection", () => {
    const bundle = {
      id: "bundle-1",
      name: "Collection-targeted PPB",
      status: "active",
      bundleType: "product_page",
      steps: [{ id: "step-1", name: "Step 1" }],
      bundleUpsellConfig: {
        widgetConfiguration: {
          displayConfiguration: {
            showOnAllBundleProducts: true,
            selectedProducts: [],
            showOnSpecificProductPages: [],
            collectionsSelectedData: [{ collectionId: "3333", handle: "target-collection" }],
            showOnSpecificCollectionPages: [],
          },
        },
      },
    };

    const selected = BundleDataManager.selectBundle(
      { "bundle-1": bundle },
      {
        currentProductId: "1111",
        currentProductHandle: "current-product",
        currentProductCollections: ["gid://shopify/Collection/3333", { handle: "other-collection" }],
      },
    );

    expect(selected).toBe(bundle);
  });

  it("selects a product-page bundle when collection targeting matches by admin_graphql_api_id", () => {
    const bundle = {
      id: "bundle-1",
      name: "Collection-targeted PPB",
      status: "active",
      bundleType: "product_page",
      steps: [{ id: "step-1", name: "Step 1" }],
      bundleUpsellConfig: {
        widgetConfiguration: {
          displayConfiguration: {
            showOnAllBundleProducts: true,
            selectedProducts: [],
            showOnSpecificProductPages: [],
            collectionsSelectedData: [{ admin_graphql_api_id: "gid://shopify/Collection/9999" }],
            showOnSpecificCollectionPages: [],
          },
        },
      },
    };

    const selected = BundleDataManager.selectBundle(
      { "bundle-1": bundle },
      {
        currentProductId: "1111",
        currentProductHandle: "current-product",
        currentProductCollections: [{ admin_graphql_api_id: "gid://shopify/Collection/9999" }],
      },
    );

    expect(selected).toBe(bundle);
  });
});
