import { readFileSync } from "node:fs";
import { join } from "node:path";

import { BundleType } from "../../../app/constants/bundle";
import { updateBundleProductMetafields } from "../../../app/services/bundles/metafield-sync/operations/bundle-product.server";
import {
  batchGetFirstVariantsWithPrices,
  getFirstVariantId,
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
const mockBatchGetFirstVariantsWithPrices = batchGetFirstVariantsWithPrices as jest.MockedFunction<
  typeof batchGetFirstVariantsWithPrices
>;

function makeAdmin() {
  return {
    graphql: jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        data: {
          metafieldsSet: {
            metafields: [{ key: "bundle_ui_config", value: "{}" }],
            userErrors: [],
          },
        },
      }),
    }),
  };
}

function makeFullPageBundleConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: "bundle-1",
    bundleId: "bundle-1",
    name: "Test FPB",
    description: "Bundle description",
    status: "active",
    bundleType: BundleType.FULL_PAGE,
    shopifyProductId: null,
    shopifyPageHandle: "build-your-bundle",
    bundleVariantId: "gid://shopify/ProductVariant/111",
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
    pricing: null,
    ...overrides,
  };
}

function getBundleUiConfig(admin: ReturnType<typeof makeAdmin>) {
  const call = admin.graphql.mock.calls.find((entry: unknown[]) => {
    const variables = (entry[1] as { variables?: { metafields?: Array<{ key: string }> } })?.variables;
    return variables?.metafields?.some((field) => field.key === "bundle_ui_config");
  });
  const metafields = (call?.[1] as { variables: { metafields: Array<{ key: string; value: string }> } }).variables
    .metafields;
  return JSON.parse(metafields.find((field) => field.key === "bundle_ui_config")?.value ?? "{}");
}

describe("FPB bundle banner storefront contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFirstVariantId.mockResolvedValue({
      success: true,
      variantId: "gid://shopify/ProductVariant/111",
    } as any);
    mockBatchGetFirstVariantsWithPrices.mockResolvedValue(new Map());
  });

  it("emits desktop and mobile bundle banner URLs in the FPB bundle_ui_config metafield", async () => {
    const admin = makeAdmin();

    await updateBundleProductMetafields(
      admin,
      "gid://shopify/Page/999",
      makeFullPageBundleConfig({
        bundleBannerDesktopUrl: "https://cdn.shopify.com/desktop-banner.png",
        bundleBannerMobileUrl: "https://cdn.shopify.com/mobile-banner.png",
      }),
    );

    const bundleUiConfig = getBundleUiConfig(admin);
    expect(bundleUiConfig.bundleBannerDesktopUrl).toBe("https://cdn.shopify.com/desktop-banner.png");
    expect(bundleUiConfig.bundleBannerMobileUrl).toBe("https://cdn.shopify.com/mobile-banner.png");
  });

  it("keeps lightweight FPB bundle_settings aware of desktop and mobile bundle banners", () => {
    const source = readFileSync(
      join(process.cwd(), "app/services/widget-installation/widget-full-page-bundle.server.ts"),
      "utf8",
    );
    const settingsBuilder = source.slice(
      source.indexOf("function buildBundleSettings(bundle: any)"),
      source.indexOf("async function writeBundleConfigPageMetafield", source.indexOf("function buildBundleSettings(bundle: any)")),
    );

    expect(settingsBuilder).toContain("bundleBannerDesktopUrl: bundle.bundleBannerDesktopUrl ?? null");
    expect(settingsBuilder).toContain("bundleBannerMobileUrl: bundle.bundleBannerMobileUrl ?? null");
  });

});
