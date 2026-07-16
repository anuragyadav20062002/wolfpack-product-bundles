/* eslint-disable import/first */
jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../../app/services/bundles/bundle-preview-event.server", () => ({
  recordFirstBundlePreviewEvent: jest.fn().mockResolvedValue(true),
}));

import { handleCreateFpbPreview, handleRecordBundlePreview } from "../../../app/routes/app/shared/bundle-preview-action.server";
import { verifyFpbPreviewToken } from "../../../app/lib/fpb-preview-token.server";
import { recordFirstBundlePreviewEvent } from "../../../app/services/bundles/bundle-preview-event.server";

const getDb = () => require("../../../app/db.server").default;
const mockRecordFirstBundlePreviewEvent = recordFirstBundlePreviewEvent as jest.MockedFunction<typeof recordFirstBundlePreviewEvent>;

const mockAdmin = { graphql: jest.fn() } as any;
const mockSession = {
  shop: "test-shop.myshopify.com",
} as any;

function makeForm(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  return formData;
}

describe("handleRecordBundlePreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records the first Admin preview event with the posted bundle link", async () => {
    getDb().bundle.findUnique.mockResolvedValue({
      id: "bundle-1",
      shopId: "test-shop.myshopify.com",
      bundleType: "product_page",
      status: "active",
      shopifyProductHandle: "bundle-product",
      shopifyPageHandle: null,
      shopifyPreviewPageHandle: null,
    });

    const response = await handleRecordBundlePreview(
      mockAdmin,
      mockSession,
      "bundle-1",
      makeForm({
        bundleLink: "https://test-shop.myshopify.com/products/bundle-product",
        routeFamily: "ppb_configure",
      }),
    );
    const body = await response.json();

    expect(body).toEqual({ success: true });
    expect(mockRecordFirstBundlePreviewEvent).toHaveBeenCalledWith({
      admin: mockAdmin,
      shopDomain: mockSession.shop,
      bundle: expect.objectContaining({
        id: "bundle-1",
        bundleType: "product_page",
        status: "active",
      }),
      bundleLink: "https://test-shop.myshopify.com/products/bundle-product",
      routeFamily: "ppb_configure",
    });
  });

  it("returns 404 without recording when the bundle does not belong to the shop", async () => {
    getDb().bundle.findUnique.mockResolvedValue(null);

    const response = await handleRecordBundlePreview(
      mockAdmin,
      mockSession,
      "missing-bundle",
      makeForm({ bundleLink: "https://test-shop.myshopify.com/products/bundle-product" }),
    );

    expect(response.status).toBe(404);
    expect(mockRecordFirstBundlePreviewEvent).not.toHaveBeenCalled();
  });
});

describe("handleCreateFpbPreview", () => {
  const originalSecret = process.env.SHOPIFY_API_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SHOPIFY_API_SECRET = "preview-secret";
    getDb().bundle.findUnique.mockResolvedValue({
      id: "bundle-1",
      bundleType: "full_page",
      status: "draft",
    });
  });

  afterAll(() => {
    process.env.SHOPIFY_API_SECRET = originalSecret;
  });

  it("returns a fresh valid stateless preview URL on every click", async () => {
    const now = jest.spyOn(Date, "now")
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(2_000);

    const first = await handleCreateFpbPreview(mockAdmin, mockSession, "bundle-1");
    const second = await handleCreateFpbPreview(mockAdmin, mockSession, "bundle-1");
    const firstUrl = new URL((await first.json()).shareablePreviewUrl);
    const secondUrl = new URL((await second.json()).shareablePreviewUrl);

    expect(firstUrl.pathname).toBe("/apps/product-bundles/wpb/bundle-1");
    expect(firstUrl.searchParams.get("wpb_preview")).not.toBe(secondUrl.searchParams.get("wpb_preview"));
    expect(verifyFpbPreviewToken({
      token: firstUrl.searchParams.get("wpb_preview"),
      shop: mockSession.shop,
      bundleId: "bundle-1",
      apiSecret: "preview-secret",
      now: 1_000,
    })).toBe(true);
    now.mockRestore();
  });
});

export {};
