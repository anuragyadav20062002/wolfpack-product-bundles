import type { ActionFunctionArgs } from "@remix-run/node";
import { action as fpbAction } from "../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route";
import { action as ppbAction } from "../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route";
import { requireAdminSession } from "../../app/lib/auth-guards.server";
import * as fpbHandlers from "../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers";
import * as ppbHandlers from "../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers";
import * as storefrontSyncAction from "../../app/routes/app/shared/storefront-sync-action.server";

jest.mock("../../app/lib/auth-guards.server", () => ({
  requireAdminSession: jest.fn(),
}));

jest.mock("../../app/db.server", () => ({
  __esModule: true,
  default: {},
}));

jest.mock("../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers", () => ({
  handleSaveBundle: jest.fn(),
  handleUpdateBundleStatus: jest.fn(),
  handleSyncProduct: jest.fn(),
  handleUpdateBundleProduct: jest.fn(),
  handleGetPages: jest.fn(),
  handleGetThemeTemplates: jest.fn(),
  handleGetCurrentTheme: jest.fn(),
  handleEnsureBundleTemplates: jest.fn(),
  handleCheckFullPageTemplate: jest.fn(),
  handleValidateWidgetPlacement: jest.fn(),
  handleCreatePreviewPage: jest.fn(),
  handleRenamePageSlug: jest.fn(),
  handleUpdateBundleDesignTemplate: jest.fn(),
}));

jest.mock("../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers", () => ({
  handleSaveBundle: jest.fn(),
  handleUpdateBundleStatus: jest.fn(),
  handleSyncProduct: jest.fn(),
  handleUpdateBundleProduct: jest.fn(),
  handleGetThemeTemplates: jest.fn(),
  handleGetCurrentTheme: jest.fn(),
  handleEnsureBundleTemplates: jest.fn(),
  handleValidateWidgetPlacement: jest.fn(),
  handleAssignProductTemplate: jest.fn(),
  handleUpdateBundleDesignTemplate: jest.fn(),
  handleValidateSellingPlanGroups: jest.fn(),
}));

jest.mock("../../app/routes/app/shared/storefront-sync-action.server", () => ({
  handlePrepareStorefrontPreview: jest.fn(),
  handleSyncStorefrontNow: jest.fn(),
}));

jest.mock("../../app/components/shared/FilePicker", () => ({
  FilePicker: () => null,
}));

jest.mock("../../app/components/bundle-configure/BundleGuidedTour", () => ({
  BundleGuidedTour: () => null,
}));

jest.mock("../../app/components/bundle-configure/BundleReadinessOverlay", () => ({
  BundleReadinessOverlay: () => null,
}));

jest.mock("@shopify/app-bridge-react", () => ({
  SaveBar: () => null,
  useAppBridge: () => ({}),
}));

const mockRequireAdminSession = requireAdminSession as jest.MockedFunction<typeof requireAdminSession>;
const mockSession = { shop: "test-shop.myshopify.com", accessToken: "token" } as any;
const mockAdmin = { graphql: jest.fn() } as any;

function makeActionArgs(intent: string, extras: Record<string, string> = {}): ActionFunctionArgs {
  const formData = new FormData();
  formData.set("intent", intent);
  Object.entries(extras).forEach(([key, value]) => formData.set(key, value));

  return {
    request: new Request("https://test.example.com/app/configure/bundle-1", {
      method: "POST",
      body: formData,
    }),
    params: { bundleId: "bundle-1" },
    context: {},
  };
}

function responseFor(intent: string): Response {
  return Response.json({ success: true, intent });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireAdminSession.mockResolvedValue({ session: mockSession, admin: mockAdmin } as any);
});

describe("FPB configure action dispatch", () => {
  it.each([
    ["saveBundle", "handleSaveBundle"],
    ["updateBundleStatus", "handleUpdateBundleStatus"],
    ["syncProduct", "handleSyncProduct"],
    ["updateBundleProduct", "handleUpdateBundleProduct"],
    ["getPages", "handleGetPages"],
    ["getThemeTemplates", "handleGetThemeTemplates"],
    ["getCurrentTheme", "handleGetCurrentTheme"],
    ["ensureBundleTemplates", "handleEnsureBundleTemplates"],
    ["checkFullPageTemplate", "handleCheckFullPageTemplate"],
    ["validateWidgetPlacement", "handleValidateWidgetPlacement"],
    ["createPreviewPage", "handleCreatePreviewPage"],
    ["updateBundleDesignTemplate", "handleUpdateBundleDesignTemplate"],
  ] as const)("routes %s to %s", async (intent, handlerName) => {
    const handler = fpbHandlers[handlerName] as jest.Mock;
    handler.mockResolvedValue(responseFor(intent));

    const response = await fpbAction(makeActionArgs(intent, {
      desiredSlug: "bundle-page",
      newSlug: "renamed-page",
    }));
    const body = await response.json();

    expect(body).toEqual({ success: true, intent });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("routes syncBundle to shared storefront sync with full_page type", async () => {
    const handler = storefrontSyncAction.handleSyncStorefrontNow as jest.Mock;
    handler.mockResolvedValue(responseFor("syncBundle"));

    const response = await fpbAction(makeActionArgs("syncBundle"));
    const body = await response.json();

    expect(body).toEqual({ success: true, intent: "syncBundle" });
    expect(handler).toHaveBeenCalledWith(
      mockAdmin,
      mockSession,
      "bundle-1",
      "full_page",
      "sync_bundle",
    );
  });

  it("returns a 400 response for unknown FPB intents", async () => {
    const response = await fpbAction(makeActionArgs("not-real"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe("PPB configure action dispatch", () => {
  it.each([
    ["saveBundle", "handleSaveBundle"],
    ["updateBundleStatus", "handleUpdateBundleStatus"],
    ["syncProduct", "handleSyncProduct"],
    ["updateBundleProduct", "handleUpdateBundleProduct"],
    ["getThemeTemplates", "handleGetThemeTemplates"],
    ["getCurrentTheme", "handleGetCurrentTheme"],
    ["ensureBundleTemplates", "handleEnsureBundleTemplates"],
    ["validateWidgetPlacement", "handleValidateWidgetPlacement"],
    ["updateBundleDesignTemplate", "handleUpdateBundleDesignTemplate"],
    ["assignProductTemplate", "handleAssignProductTemplate"],
    ["validateSellingPlanGroups", "handleValidateSellingPlanGroups"],
  ] as const)("routes %s to %s", async (intent, handlerName) => {
    const handler = ppbHandlers[handlerName] as jest.Mock;
    handler.mockResolvedValue(responseFor(intent));

    const response = await ppbAction(makeActionArgs(intent));
    const body = await response.json();

    expect(body).toEqual({ success: true, intent });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("routes syncBundle to shared storefront sync with product_page type", async () => {
    const handler = storefrontSyncAction.handleSyncStorefrontNow as jest.Mock;
    handler.mockResolvedValue(responseFor("syncBundle"));

    const response = await ppbAction(makeActionArgs("syncBundle"));
    const body = await response.json();

    expect(body).toEqual({ success: true, intent: "syncBundle" });
    expect(handler).toHaveBeenCalledWith(
      mockAdmin,
      mockSession,
      "bundle-1",
      "product_page",
      "sync_bundle",
    );
  });

  it("returns a 400 response for unknown PPB intents", async () => {
    const response = await ppbAction(makeActionArgs("not-real"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });
});
