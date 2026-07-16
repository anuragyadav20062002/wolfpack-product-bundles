/**
 * Unit tests — handleUpdateBundleStatus (shared by FPB and PPB)
 *
 * Spec: test-spec/edit-bundle-flow.spec.md § Suite 5
 * Issue: [edit-bundle-flow-tests-1]
 */

import { handleUpdateBundleStatus } from "../../../app/services/bundles/bundle-configure-handlers.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

jest.mock("../../../app/services/theme-template.server", () => ({
  ThemeTemplateService: { ensureTemplates: jest.fn() },
}));

const getDb = () => require("../../../app/db.server").default;

const MOCK_SESSION = { shop: "test-shop.myshopify.com", accessToken: "tok" } as any;

function makeAdmin(graphqlResult: Record<string, unknown> = {}) {
  return {
    graphql: jest.fn().mockResolvedValue({
      json: async () => ({
        data: {
          productUpdate: {
            product: { id: "gid://shopify/Product/1", status: "ACTIVE" },
            userErrors: [],
          },
          ...graphqlResult,
        },
      }),
    }),
  } as any;
}

function makeForm(status: string): FormData {
  const fd = new FormData();
  fd.set("status", status);
  return fd;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("handleUpdateBundleStatus", () => {
  it("calls db.bundle.update with the new status", async () => {
    getDb().bundle.update.mockResolvedValue({ id: "b1", shopifyProductId: null, steps: [], pricing: null });
    const admin = makeAdmin();
    await handleUpdateBundleStatus(admin, MOCK_SESSION, "b1", makeForm("active"));
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "active" },
        where: { id: "b1", shopId: "test-shop.myshopify.com" },
      })
    );
  });

  it("does NOT call admin.graphql when the bundle has no shopifyProductId", async () => {
    getDb().bundle.update.mockResolvedValue({ id: "b1", shopifyProductId: null, steps: [], pricing: null });
    const admin = makeAdmin();
    await handleUpdateBundleStatus(admin, MOCK_SESSION, "b1", makeForm("active"));
    expect(admin.graphql).not.toHaveBeenCalled();
  });

  it("does not mutate Shopify product status when bundle status becomes active", async () => {
    getDb().bundle.update.mockResolvedValue({
      id: "b1",
      shopifyProductId: "gid://shopify/Product/42",
      steps: [],
      pricing: null,
    });
    const admin = makeAdmin();
    await handleUpdateBundleStatus(admin, MOCK_SESSION, "b1", makeForm("active"));
    expect(admin.graphql).not.toHaveBeenCalled();
  });

  it("does not mutate Shopify metadata when bundle status becomes unlisted", async () => {
    getDb().bundle.update.mockResolvedValue({
      id: "b1",
      name: "Test Bundle",
      description: "<p>Merchant copy</p>",
      shopifyProductId: "gid://shopify/Product/42",
      steps: [],
      pricing: null,
    });
    const admin = makeAdmin();
    await handleUpdateBundleStatus(admin, MOCK_SESSION, "b1", makeForm("unlisted"));
    expect(admin.graphql).not.toHaveBeenCalled();
  });

  it("does not mutate Shopify product status when bundle status becomes archived", async () => {
    getDb().bundle.update.mockResolvedValue({
      id: "b1",
      shopifyProductId: "gid://shopify/Product/42",
      steps: [],
      pricing: null,
    });
    const admin = makeAdmin();
    await handleUpdateBundleStatus(admin, MOCK_SESSION, "b1", makeForm("archived"));
    expect(admin.graphql).not.toHaveBeenCalled();
  });

  it("returns success JSON with the updated bundle", async () => {
    const bundle = { id: "b1", shopifyProductId: null, steps: [], pricing: null, status: "active" };
    getDb().bundle.update.mockResolvedValue(bundle);
    const admin = makeAdmin();
    const res = await handleUpdateBundleStatus(admin, MOCK_SESSION, "b1", makeForm("active"));
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.bundle).toMatchObject({ id: "b1" });
  });

  it("returns success without consulting Shopify for bundles with parent products", async () => {
    getDb().bundle.update.mockResolvedValue({
      id: "b1",
      shopifyProductId: "gid://shopify/Product/42",
      steps: [],
      pricing: null,
    });
    const admin = {
      graphql: jest.fn().mockResolvedValue({
        json: async () => ({
          data: {
            productUpdate: { product: null, userErrors: [{ message: "Shopify error" }] },
          },
        }),
      }),
    } as any;
    const res = await handleUpdateBundleStatus(admin, MOCK_SESSION, "b1", makeForm("active"));
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(admin.graphql).not.toHaveBeenCalled();
  });
});
