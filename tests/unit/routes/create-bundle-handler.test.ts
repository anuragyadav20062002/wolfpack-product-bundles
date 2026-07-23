import {
  handleCloneBundle,
  handleCreateBundle,
} from "../../../app/routes/app/app.dashboard/handlers/handlers.server";
import db from "../../../app/db.server";
import { WidgetInstallationService } from "../../../app/services/widget-installation.server";
import { ensureBundleParentProduct } from "../../../app/services/bundles/bundle-parent-product.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    shop: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bundle: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    bundleStep: {
      create: jest.fn(),
    },
    stepProduct: {
      createMany: jest.fn(),
    },
    bundlePricing: {
      create: jest.fn(),
    },
  },
}));

jest.mock("../../../app/services/widget-installation.server", () => ({
  WidgetInstallationService: {
    validateProductBundleWidgetSetup: jest.fn(),
  },
}));

jest.mock("../../../app/services/bundles/bundle-parent-product.server", () => ({
  ensureBundleParentProduct: jest.fn(),
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

function makeForm(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

function makeAdmin() {
  return {
    graphql: jest
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            productCreate: {
              product: {
                id: "gid://shopify/Product/1",
                handle: "standard-bundle",
              },
              userErrors: [],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            publications: {
              edges: [],
            },
          },
        }),
      }),
  };
}

describe("handleCreateBundle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockDb.shop.findUnique as jest.Mock).mockResolvedValue({ firstCreateTourEligible: false });
    (mockDb.bundle.count as jest.Mock).mockResolvedValue(1);
    (mockDb.bundle.create as jest.Mock).mockResolvedValue({
      id: "bundle-1",
      name: "Standard Bundle",
      shopifyProductId: null,
      shopifyProductHandle: null,
    });
    (ensureBundleParentProduct as jest.Mock).mockResolvedValue({
      productId: "gid://shopify/Product/1",
      variantId: "gid://shopify/ProductVariant/1",
      handle: "standard-bundle",
      status: "UNLISTED",
      created: true,
    });
    (WidgetInstallationService.validateProductBundleWidgetSetup as jest.Mock).mockResolvedValue({
      widgetInstalled: false,
      requiresOneTimeSetup: false,
      message: "",
    });
  });

  it("creates new FPB bundles with the Standard template selected", async () => {
    const response = await handleCreateBundle(
      makeAdmin() as any,
      { shop: "test-shop.myshopify.com" },
      makeForm({
        bundleName: "Standard Bundle",
        bundleType: "full_page",
      }),
    );

    expect(response.status).toBe(200);
    expect(mockDb.bundle.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        bundleType: "full_page",
        bundleDesignTemplate: "FBP_SIDE_FOOTER",
        bundleDesignPresetId: "STANDARD",
      }),
    }));
  });
});

describe("handleCloneBundle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockDb.bundle.create as jest.Mock).mockResolvedValue({
      id: "cloned-bundle",
      name: "Cloned Bundle",
    });
    (ensureBundleParentProduct as jest.Mock).mockResolvedValue({
      productId: "gid://shopify/Product/2",
      variantId: "gid://shopify/ProductVariant/2",
      handle: "cloned-bundle",
      status: "UNLISTED",
      created: true,
    });
  });

  it.each([
    ["full_page", "/app/bundles/full-page-bundle/configure/cloned-bundle?mode=create"],
    ["product_page", "/app/bundles/product-page-bundle/configure/cloned-bundle?mode=create"],
  ])("returns the %s configure redirect", async (bundleType, expectedRedirect) => {
    (mockDb.bundle.findUnique as jest.Mock).mockResolvedValue({
      id: "source-bundle",
      name: "Source Bundle",
      description: null,
      bundleType,
      templateName: null,
      steps: [],
      pricing: null,
    });

    const response = await handleCloneBundle(
      makeAdmin() as any,
      { shop: "test-shop.myshopify.com" },
      makeForm({ bundleId: "source-bundle" }),
    );

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      bundleId: "cloned-bundle",
      redirectTo: expectedRedirect,
    });
  });
});
