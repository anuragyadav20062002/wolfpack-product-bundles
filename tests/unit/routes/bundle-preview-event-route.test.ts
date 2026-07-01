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

import { handleRecordBundlePreview } from "../../../app/routes/app/shared/bundle-preview-action.server";
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

export {};
