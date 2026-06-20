import {
  handleCheckFullPageTemplate,
  handleCreatePreviewPage,
  handleUpdateBundleDesignTemplate,
} from "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/page-handlers.server";
import db from "../../../app/db.server";
import {
  getPreviewPageUrl,
  refreshFullPageBundlePageBody,
  writeBundleConfigPageMetafield,
} from "../../../app/services/widget-installation/widget-full-page-bundle.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../app/services/widget-installation.server", () => ({
  WidgetInstallationService: {
    createFullPageBundle: jest.fn(),
  },
}));

jest.mock("../../../app/services/widget-installation/widget-full-page-bundle.server", () => ({
  getPreviewPageUrl: jest.fn(),
  refreshFullPageBundlePageBody: jest.fn(),
  writeBundleConfigPageMetafield: jest.fn(),
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockGetPreviewPageUrl = getPreviewPageUrl as jest.MockedFunction<typeof getPreviewPageUrl>;
const mockRefreshFullPageBundlePageBody = refreshFullPageBundlePageBody as jest.MockedFunction<typeof refreshFullPageBundlePageBody>;
const mockWriteBundleConfigPageMetafield = writeBundleConfigPageMetafield as jest.MockedFunction<typeof writeBundleConfigPageMetafield>;

const session = {
  shop: "test-shop.myshopify.com",
  accessToken: "token",
} as any;

const admin = {
  graphql: jest.fn(),
} as any;

function makeBundle(overrides: Record<string, unknown> = {}) {
  return {
    id: "bundle-1",
    name: "Bundle",
    shopifyPreviewPageId: null,
    shopifyPreviewPageHandle: null,
    steps: [],
    pricing: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SHOPIFY_API_KEY = "test-api-key";
});

describe("FPB page handlers", () => {
  it("returns a cached preview URL after refreshing the existing preview page", async () => {
    mockDb.bundle.findUnique.mockResolvedValue(
      makeBundle({ shopifyPreviewPageId: "gid://shopify/Page/1" }) as any
    );
    mockGetPreviewPageUrl.mockResolvedValue({ success: true, previewUrl: "https://preview.test" } as any);
    mockRefreshFullPageBundlePageBody.mockResolvedValue({ success: true } as any);
    mockWriteBundleConfigPageMetafield.mockResolvedValue(undefined);

    const response = await handleCreatePreviewPage(admin, session, "bundle-1");
    const body = await response.json();

    expect(body).toEqual({ success: true, shareablePreviewUrl: "https://preview.test" });
    expect(mockRefreshFullPageBundlePageBody).toHaveBeenCalledWith(
      admin,
      "gid://shopify/Page/1",
      "bundle-1",
      "test-shop.myshopify.com",
      expect.objectContaining({ id: "bundle-1" }),
    );
    expect(mockWriteBundleConfigPageMetafield).toHaveBeenCalledWith(
      admin,
      "gid://shopify/Page/1",
      expect.objectContaining({ id: "bundle-1" }),
    );
  });

  it("checks the active theme for the full page bundle template", async () => {
    admin.graphql.mockResolvedValue({
      json: async () => ({
        data: {
          themes: { nodes: [{ id: "gid://shopify/Theme/99", name: "Main", role: "MAIN" }] },
        },
      }),
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        assets: [{ key: "templates/page.full-page-bundle.json" }],
      }),
    }) as any;

    const response = await handleCheckFullPageTemplate(admin, session);
    const body = await response.json();

    expect(body).toMatchObject({
      success: true,
      templateExists: true,
      themeName: "Main",
    });
  });

  it("persists trimmed FPB design template fields", async () => {
    mockDb.bundle.update.mockResolvedValue({} as any);
    const formData = new FormData();
    formData.set("bundleDesignTemplate", " FBP_SIDE_FOOTER ");
    formData.set("bundleDesignPresetId", " DEFAULT ");

    const response = await handleUpdateBundleDesignTemplate(admin, session, "bundle-1", formData);
    const body = await response.json();

    expect(body).toEqual({ success: true });
    expect(mockDb.bundle.update).toHaveBeenCalledWith({
      where: { id: "bundle-1", shopId: "test-shop.myshopify.com" },
      data: {
        bundleDesignTemplate: "FBP_SIDE_FOOTER",
        bundleDesignPresetId: "DEFAULT",
      },
    });
  });
});
