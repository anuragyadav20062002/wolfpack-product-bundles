import {
  handleAssignProductTemplate,
  handleValidateWidgetPlacement,
} from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/widget-placement.server";
import db from "../../../app/db.server";
import { WidgetInstallationService } from "../../../app/services/widget-installation.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: { findUnique: jest.fn() },
  },
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../app/services/widget-installation.server", () => ({
  WidgetInstallationService: {
    validateProductBundleWidgetSetup: jest.fn(),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockValidateProductBundleWidgetSetup =
  WidgetInstallationService.validateProductBundleWidgetSetup as jest.MockedFunction<
    typeof WidgetInstallationService.validateProductBundleWidgetSetup
  >;

const session = { shop: "test-shop.myshopify.com" } as any;
const admin = {
  graphql: jest.fn(),
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SHOPIFY_API_KEY = "test-api-key";
});

describe("PPB widget placement handlers", () => {
  it("returns one-time setup details when product page widget validation requires setup", async () => {
    mockDb.bundle.findUnique.mockResolvedValue({
      id: "bundle-1",
      shopifyProductId: "gid://shopify/Product/1",
    } as any);
    mockValidateProductBundleWidgetSetup.mockResolvedValue({
      requiresOneTimeSetup: true,
      installationLink: "https://theme-editor.test",
      message: "Place the widget",
    } as any);

    const response = await handleValidateWidgetPlacement(admin, session, "bundle-1");
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      requiresOneTimeSetup: true,
      installationLink: "https://theme-editor.test",
      message: "Place the widget",
    });
    expect(mockValidateProductBundleWidgetSetup).toHaveBeenCalledWith(
      admin,
      "test-shop.myshopify.com",
      "test-api-key",
      "bundle-1",
      "gid://shopify/Product/1",
    );
  });

  it("assigns a selected product template suffix to the bundle parent product", async () => {
    admin.graphql.mockResolvedValue({
      json: async () => ({
        data: { productUpdate: { product: { id: "gid://shopify/Product/1" }, userErrors: [] } },
      }),
    });
    const formData = new FormData();
    formData.set("productId", "gid://shopify/Product/1");
    formData.set("templateSuffix", "wpb-product-page-bundle");

    const response = await handleAssignProductTemplate(admin, session, "bundle-1", formData);
    const body = await response.json();

    expect(body).toMatchObject({
      success: true,
      productId: "gid://shopify/Product/1",
      templateSuffix: "wpb-product-page-bundle",
    });
    expect(admin.graphql).toHaveBeenCalledWith(
      expect.stringContaining("productUpdate(product: $product)"),
      {
        variables: {
          product: {
            id: "gid://shopify/Product/1",
            templateSuffix: "wpb-product-page-bundle",
          },
        },
      },
    );
  });
});
