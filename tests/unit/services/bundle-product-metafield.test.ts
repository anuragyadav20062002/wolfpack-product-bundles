import { BundleType } from "../../../app/constants/bundle";
import { updateBundleProductMetafields } from "../../../app/services/bundles/metafield-sync/operations/bundle-product.server";
import {
  getFirstVariantId,
  batchGetFirstVariantsWithPrices,
} from "../../../app/utils/variant-lookup.server";

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

jest.mock("../../../app/utils/variant-lookup.server", () => ({
  getFirstVariantId: jest.fn(),
  batchGetFirstVariantsWithPrices: jest.fn(),
}));

const mockGetFirstVariantId = getFirstVariantId as jest.MockedFunction<typeof getFirstVariantId>;
const mockBatchGetFirstVariantsWithPrices = batchGetFirstVariantsWithPrices as jest.MockedFunction<typeof batchGetFirstVariantsWithPrices>;

function makeAdmin() {
  return {
    graphql: jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        data: {
          metafieldsSet: {
            metafields: [
              {
                key: "bundle_ui_config",
                value: "{}",
              },
            ],
            userErrors: [],
          },
        },
      }),
    }),
  };
}

function makeBundleConfig(bundleType: BundleType, overrides: Record<string, unknown> = {}) {
  return {
    id: "bundle-1",
    bundleId: "bundle-1",
    name: "Test Bundle",
    description: "Bundle description",
    status: "active",
    bundleType,
    shopifyProductId: "gid://shopify/Product/999",
    shopifyPageHandle: bundleType === BundleType.FULL_PAGE ? "build-your-bundle" : null,
    steps: [
      {
        id: "step-1",
        name: "Step 1",
        position: 0,
        minQuantity: 1,
        maxQuantity: 1,
        StepProduct: [{ productId: "gid://shopify/Product/123" }],
        collections: [],
      },
    ],
    pricing: {
      enabled: true,
      method: "percentage_off",
      rules: [
        {
          discountValue: 10,
        },
      ],
      messages: {
        progress: "Add more",
        qualified: "Qualified",
        showDiscountMessaging: true,
      },
    },
    ...overrides,
  };
}

function getMetafieldsSetPayload(admin: ReturnType<typeof makeAdmin>) {
  const call = admin.graphql.mock.calls.find((entry: any[]) => entry[1]?.variables?.metafields);
  return call?.[1].variables.metafields;
}

describe("updateBundleProductMetafields", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetFirstVariantId.mockResolvedValue({
      success: true,
      variantId: "gid://shopify/ProductVariant/111",
    } as any);

    mockBatchGetFirstVariantsWithPrices.mockResolvedValue(
      new Map([
        [
          "123",
          {
            success: true,
            variantId: "gid://shopify/ProductVariant/222",
            priceCents: 1200,
            title: "Component Product",
          },
        ],
      ]),
    );
  });

  it("passes imageUrl through to step map when present", async () => {
    const admin = makeAdmin();
    const config = makeBundleConfig(BundleType.FULL_PAGE, {
      steps: [
        {
          id: "step-1",
          name: "Step 1",
          position: 0,
          minQuantity: 1,
          maxQuantity: 1,
          StepProduct: [{ productId: "gid://shopify/Product/123" }],
          collections: [],
          imageUrl: "https://cdn.shopify.com/step-icon.png",
        },
      ],
    });

    await updateBundleProductMetafields(admin, "gid://shopify/Product/999", config);

    const metafields = getMetafieldsSetPayload(admin);
    const parsed = JSON.parse(metafields.find((f: any) => f.key === "bundle_ui_config").value);

    expect(parsed.steps[0].imageUrl).toBe("https://cdn.shopify.com/step-icon.png");
  });

  it("passes imageUrl as null when absent from step", async () => {
    const admin = makeAdmin();

    await updateBundleProductMetafields(admin, "gid://shopify/Product/999", makeBundleConfig(BundleType.FULL_PAGE));

    const metafields = getMetafieldsSetPayload(admin);
    const parsed = JSON.parse(metafields.find((f: any) => f.key === "bundle_ui_config").value);

    expect(parsed.steps[0].imageUrl).toBeNull();
  });

  it("passes bannerImageUrl through to step map when present", async () => {
    const admin = makeAdmin();
    const config = makeBundleConfig(BundleType.FULL_PAGE, {
      steps: [
        {
          id: "step-1",
          name: "Step 1",
          position: 0,
          minQuantity: 1,
          maxQuantity: 1,
          StepProduct: [{ productId: "gid://shopify/Product/123" }],
          collections: [],
          bannerImageUrl: "https://cdn.shopify.com/step-banner.jpg",
        },
      ],
    });

    await updateBundleProductMetafields(admin, "gid://shopify/Product/999", config);

    const metafields = getMetafieldsSetPayload(admin);
    const parsed = JSON.parse(metafields.find((f: any) => f.key === "bundle_ui_config").value);

    expect(parsed.steps[0].bannerImageUrl).toBe("https://cdn.shopify.com/step-banner.jpg");
  });

  it("passes bannerImageUrl as null when absent from step", async () => {
    const admin = makeAdmin();

    await updateBundleProductMetafields(admin, "gid://shopify/Product/999", makeBundleConfig(BundleType.FULL_PAGE));

    const metafields = admin.graphql.mock.calls[1][1].variables.metafields;
    const parsed = JSON.parse(metafields.find((f: any) => f.key === "bundle_ui_config").value);

    expect(parsed.steps[0].bannerImageUrl).toBeNull();
  });

  it("includes fullPagePageHandle for full-page bundles", async () => {
    const admin = makeAdmin();

    await updateBundleProductMetafields(
      admin,
      "gid://shopify/Product/999",
      makeBundleConfig(BundleType.FULL_PAGE),
    );

    const metafields = admin.graphql.mock.calls[1][1].variables.metafields;
    const bundleUiConfigField = metafields.find((field: any) => field.key === "bundle_ui_config");
    const parsed = JSON.parse(bundleUiConfigField.value);

    expect(parsed.bundleType).toBe(BundleType.FULL_PAGE);
    expect(parsed.fullPagePageHandle).toBe("build-your-bundle");
  });

  it("stores a null fullPagePageHandle for product-page bundles", async () => {
    const admin = makeAdmin();

    await updateBundleProductMetafields(
      admin,
      "gid://shopify/Product/999",
      makeBundleConfig(BundleType.PRODUCT_PAGE),
    );

    const metafields = admin.graphql.mock.calls[1][1].variables.metafields;
    const bundleUiConfigField = metafields.find((field: any) => field.key === "bundle_ui_config");
    const parsed = JSON.parse(bundleUiConfigField.value);

    expect(parsed.bundleType).toBe(BundleType.PRODUCT_PAGE);
    expect(parsed.fullPagePageHandle).toBeNull();
  });

  it("keeps StepCategory products under categories in product-page bundle_ui_config steps", async () => {
    const admin = makeAdmin();
    const condition = { type: "quantity", condition: "greaterThanOrEqualTo", value: "01" };
    const selectedCollection = { id: "gid://shopify/Collection/333", handle: "frontpage", title: "Home page" };
    const config = makeBundleConfig(BundleType.PRODUCT_PAGE, {
      steps: [
        {
          id: "step-1",
          name: "Step 1",
          position: 0,
          minQuantity: 1,
          maxQuantity: 1,
          StepProduct: [],
          StepCategory: [
            {
              id: "category98476",
              name: "Category 1 Direct Product Category",
              title: "Pick audit items",
              subTitle: "Choose products",
              sortOrder: 1,
              categoryRank: 1,
              conditions: [condition],
              collections: [selectedCollection],
              collectionsData: [],
              collectionsSelectedData: [selectedCollection],
              categoryBanner: "https://cdn.example/category.png",
              displayVariantsAsIndividualProducts: true,
              displayVariantsAsSwatches: false,
              multiLangData: { en: { title: "Pick audit items" } },
              products: [
                {
                  id: "gid://shopify/Product/9427287703811",
                  title: "123Luxury Armor Matte Case",
                  variants: [
                    { id: "gid://shopify/ProductVariant/48191691456771", price: "123.00" },
                  ],
                },
              ],
            },
          ],
          collections: [],
        },
      ],
    });

    await updateBundleProductMetafields(admin, "gid://shopify/Product/999", config);

    const metafields = getMetafieldsSetPayload(admin);
    const parsed = JSON.parse(metafields.find((f: any) => f.key === "bundle_ui_config").value);

    expect(parsed.steps[0].products).toEqual([]);
    expect(parsed.steps[0].collections).toEqual([]);
    expect(parsed.steps[0].categories).toEqual([
      {
        categoryId: "category98476",
        name: "Category 1 Direct Product Category",
        title: "Pick audit items",
        subTitle: "Choose products",
        rank: 1,
        categoryRank: 1,
        products: [
          {
            id: "gid://shopify/Product/9427287703811",
            title: "123Luxury Armor Matte Case",
          },
        ],
        selectedProducts: [],
        collections: [selectedCollection],
        collectionsData: [],
        collectionsSelectedData: [selectedCollection],
        conditions: [condition],
        categoryBanner: "https://cdn.example/category.png",
        categoryImg: "",
        autoNextStepOnConditionMet: false,
        displayVariantsAsIndividualProducts: true,
        displayVariantsAsSwatches: false,
        multiLangData: { en: { title: "Pick audit items" } },
      },
    ]);
  });

  it("includes StepCategory cached variants in parent component metadata", async () => {
    const admin = makeAdmin();
    const config = makeBundleConfig(BundleType.FULL_PAGE, {
      steps: [
        {
          id: "step-1",
          name: "Step 1",
          position: 0,
          minQuantity: 1,
          maxQuantity: 1,
          StepProduct: [],
          StepCategory: [
            {
              name: "Category 1",
              products: [
                {
                  id: "gid://shopify/Product/9427287703811",
                  title: "123Luxury Armor Matte Case",
                  variants: [
                    {
                      id: "gid://shopify/ProductVariant/48191691424003",
                      price: "123.00",
                    },
                    {
                      id: "gid://shopify/ProductVariant/48191691456771",
                      price: "123.00",
                    },
                  ],
                },
              ],
            },
          ],
          collections: [],
        },
      ],
    });

    await updateBundleProductMetafields(admin, "gid://shopify/Product/999", config);

    const metafields = getMetafieldsSetPayload(admin);
    const componentReferences = JSON.parse(metafields.find((field: any) => field.key === "component_reference").value);

    expect(componentReferences).toEqual(expect.arrayContaining([
      "gid://shopify/ProductVariant/48191691424003",
      "gid://shopify/ProductVariant/48191691456771",
    ]));
  });

  it("emits direct Bundle Settings contracts into product-page bundle_ui_config", async () => {
    const admin = makeAdmin();
    const directContracts = {
      defaultProductsData: {
        isDefaultProductsEnabled: true,
        defaultProductsTitle: "Preselected",
        products: [
          {
            productId: "9427287703811",
            graphqlId: "gid://shopify/Product/9427287703811",
            requiredQuantity: 1,
          },
        ],
      },
      validateQuantityPerProduct: {
        isEnabled: true,
        allowedQuantity: 1,
      },
      individualSellingPlanSelection: {
        isEnabled: false,
        showFor: "ALL_PRODUCTS",
      },
      bundleTextConfig: {
        bundleSummary: {
          title: "Your Bundle",
          subTitle: "Review your bundle",
        },
      },
    };

    await updateBundleProductMetafields(
      admin,
      "gid://shopify/Product/999",
      makeBundleConfig(BundleType.PRODUCT_PAGE, directContracts),
    );

    const metafields = admin.graphql.mock.calls[1][1].variables.metafields;
    const parsed = JSON.parse(metafields.find((f: any) => f.key === "bundle_ui_config").value);

    expect(parsed).toEqual(expect.objectContaining(directContracts));
  });

  it("emits direct full-page Add-ons personalization contract into bundle_ui_config", async () => {
    const admin = makeAdmin();
    const personalizationData = {
      isPersonalizationEnabled: true,
      addonProducts: {
        isEnabled: true,
        title: "Optional audit extras",
        type: "MULTI_TIER",
        tiers: [
          {
            tierId: "tier74285",
            title: "Audit Tier 1",
            selectedAddonProducts: [
              {
                id: "gid://shopify/Product/8322626126020",
                productId: "8322626126020",
                graphqlId: "gid://shopify/Product/8322626126020",
                title: "14k Dangling Obsidian Earrings",
                variants: [
                  {
                    variantId: "45038877868228",
                    variantGraphqlId: "gid://shopify/ProductVariant/45038877868228",
                    price: "829.00",
                    variantTitle: "Default Title",
                  },
                ],
              },
            ],
            eligibilityCondition: {
              type: "AMOUNT",
              value: 1,
              isValidateEligibilityConditionEnabled: true,
            },
            discount: { type: "PERCENTAGE", value: 10 },
            displayVariantsAsIndividualProducts_addons: false,
            conditions: [],
          },
        ],
        multiLangData: {},
        addonsMessaging: {
          isEnabled: true,
          tier1: {
            ineligibleState: "Add product(s) worth at least ##addonsConditionDiff## ##currencyUnit## more to claim ##addonsDiscountValue####addonsDiscountValueUnit## off on Add ons",
            eligibleState: "Congrats you are eligible for ##addonsDiscountValue####addonsDiscountValueUnit## off on Add ons",
          },
        },
      },
    };

    await updateBundleProductMetafields(
      admin,
      "gid://shopify/Product/999",
      makeBundleConfig(BundleType.FULL_PAGE, { personalizationData }),
    );

    const metafields = admin.graphql.mock.calls[1][1].variables.metafields;
    const parsed = JSON.parse(metafields.find((f: any) => f.key === "bundle_ui_config").value);

    expect(parsed.personalizationData).toEqual(personalizationData);
  });

  it("includes direct full-page Add-ons selected variants in parent component metadata", async () => {
    const admin = makeAdmin();
    const personalizationData = {
      isPersonalizationEnabled: true,
      addonProducts: {
        isEnabled: true,
        tiers: [
          {
            selectedAddonProducts: [
              {
                graphqlId: "gid://shopify/Product/9999",
                title: "Selected Add-on",
                variants: [
                  {
                    variantGraphqlId: "gid://shopify/ProductVariant/ADDON",
                    price: "600.00",
                    variantTitle: "Default Title",
                  },
                ],
              },
            ],
            discount: { type: "PERCENTAGE", value: 10 },
          },
        ],
      },
    };

    await updateBundleProductMetafields(
      admin,
      "gid://shopify/Product/999",
      makeBundleConfig(BundleType.FULL_PAGE, { personalizationData }),
    );

    const metafields = getMetafieldsSetPayload(admin);
    const componentReferences = JSON.parse(metafields.find((field: any) => field.key === "component_reference").value);
    expect(componentReferences).toHaveLength(2);
    expect(componentReferences).toEqual(expect.arrayContaining([
      "gid://shopify/ProductVariant/222",
      "gid://shopify/ProductVariant/ADDON",
    ]));
    expect(JSON.parse(metafields.find((field: any) => field.key === "component_quantities").value)).toEqual([1, 1]);

    const componentPricing = JSON.parse(metafields.find((field: any) => field.key === "component_pricing").value);
    expect(componentPricing).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          variantId: "gid://shopify/ProductVariant/ADDON",
          retailPrice: 60000,
        }),
      ]),
    );
  });

  it("emits direct full-page message personalization contract into bundle_ui_config", async () => {
    const admin = makeAdmin();
    const personalizationData = {
      isPersonalizationEnabled: true,
      giftMessage: {
        isGiftMessageEnabled: true,
        isSenderAndRecipientNameEnabled: true,
        giftMessageCharacterLimit: "120",
        isGiftMessageMandatory: true,
        isVideoMessageEnabled: false,
        isEmailEnabled: false,
        messageProduct: {
          isMessageProductEnabled: true,
          status: "unlisted",
          product: {
            id: "gid://shopify/Product/8600867012804",
            title: "Message",
            variants: [
              {
                id: "gid://shopify/ProductVariant/46177973534916",
                title: "Message",
                price: "0.00",
                taxable: false,
                inventory_policy: "continue",
              },
            ],
          },
        },
      },
    };

    await updateBundleProductMetafields(
      admin,
      "gid://shopify/Product/999",
      makeBundleConfig(BundleType.FULL_PAGE, { personalizationData }),
    );

    const metafields = admin.graphql.mock.calls[1][1].variables.metafields;
    const parsed = JSON.parse(metafields.find((f: any) => f.key === "bundle_ui_config").value);

    expect(parsed.personalizationData).toEqual(personalizationData);
  });

  it("stores Buy X get Y price adjustment with buy/get metadata and total threshold", async () => {
    const admin = makeAdmin();
    const config = makeBundleConfig(BundleType.PRODUCT_PAGE, {
      pricing: {
        enabled: true,
        method: "buy_x_get_y",
        rules: [
          {
            conditionType: "quantity",
            conditionValue: 2,
            discountValue: 100,
            customerBuys: 2,
            customerGets: 1,
            discountType: "percentage",
            applyDiscountTo: "lowest_priced",
          },
        ],
        messages: {
          progress: "Add more",
          qualified: "Qualified",
          showDiscountMessaging: true,
        },
      },
    });

    await updateBundleProductMetafields(admin, "gid://shopify/Product/999", config);

    const metafields = getMetafieldsSetPayload(admin);
    const priceAdjustmentField = metafields.find((field: any) => field.key === "price_adjustment");
    expect(JSON.parse(priceAdjustmentField.value)).toEqual({
      method: "buy_x_get_y",
      value: 100,
      customerBuys: 2,
      customerGets: 1,
      discountType: "percentage",
      applyDiscountTo: "lowest_priced",
      conditions: {
        type: "quantity",
        operator: "gte",
        value: 3,
      },
    });
  });
});
