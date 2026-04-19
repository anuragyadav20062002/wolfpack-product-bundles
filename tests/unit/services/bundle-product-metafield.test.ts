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

import { updateBundleProductMetafields } from "../../../app/services/bundles/metafield-sync/operations/bundle-product.server";
import { BundleType } from "../../../app/constants/bundle";
import {
  getFirstVariantId,
  batchGetFirstVariantsWithPrices,
} from "../../../app/utils/variant-lookup.server";

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

    const metafields = admin.graphql.mock.calls[0][1].variables.metafields;
    const parsed = JSON.parse(metafields.find((f: any) => f.key === "bundle_ui_config").value);

    expect(parsed.steps[0].imageUrl).toBe("https://cdn.shopify.com/step-icon.png");
  });

  it("passes imageUrl as null when absent from step", async () => {
    const admin = makeAdmin();

    await updateBundleProductMetafields(admin, "gid://shopify/Product/999", makeBundleConfig(BundleType.FULL_PAGE));

    const metafields = admin.graphql.mock.calls[0][1].variables.metafields;
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

    const metafields = admin.graphql.mock.calls[0][1].variables.metafields;
    const parsed = JSON.parse(metafields.find((f: any) => f.key === "bundle_ui_config").value);

    expect(parsed.steps[0].bannerImageUrl).toBe("https://cdn.shopify.com/step-banner.jpg");
  });

  it("passes bannerImageUrl as null when absent from step", async () => {
    const admin = makeAdmin();

    await updateBundleProductMetafields(admin, "gid://shopify/Product/999", makeBundleConfig(BundleType.FULL_PAGE));

    const metafields = admin.graphql.mock.calls[0][1].variables.metafields;
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

    const metafields = admin.graphql.mock.calls[0][1].variables.metafields;
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

    const metafields = admin.graphql.mock.calls[0][1].variables.metafields;
    const bundleUiConfigField = metafields.find((field: any) => field.key === "bundle_ui_config");
    const parsed = JSON.parse(bundleUiConfigField.value);

    expect(parsed.bundleType).toBe(BundleType.PRODUCT_PAGE);
    expect(parsed.fullPagePageHandle).toBeNull();
  });
});
