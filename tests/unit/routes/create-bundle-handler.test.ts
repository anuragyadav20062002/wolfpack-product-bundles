import { handleCreateBundle } from "../../../app/routes/app/app.dashboard/handlers/handlers.server";
import db from "../../../app/db.server";
import { WidgetInstallationService } from "../../../app/services/widget-installation.server";

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
    },
  },
}));

jest.mock("../../../app/services/widget-installation.server", () => ({
  WidgetInstallationService: {
    validateProductBundleWidgetSetup: jest.fn(),
  },
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
