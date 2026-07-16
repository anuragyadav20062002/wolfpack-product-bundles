import { createHmac } from "node:crypto";
import { loader } from "../../../app/routes/root/wpb.$bundleId";
import { createFpbPreviewToken } from "../../../app/lib/fpb-preview-token.server";

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: {
      findFirst: jest.fn(),
    },
  },
}));

const getDb = () => require("../../../app/db.server").default;

function makeSignedRequest(bundleId = "bundle-1") {
  const params = new URLSearchParams({
    shop: "test-shop.myshopify.com",
    path_prefix: "/apps/product-bundles",
    timestamp: "1770000000",
  });

  const message = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("");
  params.set("signature", createHmac("sha256", "test_api_secret").update(message).digest("hex"));

  return new Request(`https://test-shop.myshopify.com/apps/product-bundles/wpb/${bundleId}?${params.toString()}`);
}

describe("FPB app proxy page", () => {
  const originalSecret = process.env.SHOPIFY_API_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SHOPIFY_API_SECRET = "test_api_secret";
  });

  afterAll(() => {
    process.env.SHOPIFY_API_SECRET = originalSecret;
  });

  it("renders active bundles as a theme-wrapped Liquid marker", async () => {
    getDb().bundle.findFirst.mockResolvedValue({
      id: "bundle-1",
      name: "Build a Box",
      shopId: "test-shop.myshopify.com",
      bundleType: "full_page",
      status: "active",
      shopifyPageHandle: "build-a-box",
      steps: [],
      pricing: null,
    });

    const response = (await loader({
      request: makeSignedRequest(),
      params: { bundleId: "bundle-1" },
      context: {},
    } as any)) as Response;
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/liquid");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(text).toContain("data-wpb-full-page-bundle");
    expect(text).toContain("data-bundle-id=\"bundle-1\"");
    expect(text).not.toContain("/apps/product-bundles/assets/");
  });

  it("does not require a linked Shopify page", async () => {
    getDb().bundle.findFirst.mockResolvedValue({
      id: "bundle-1",
      name: "Build a Box",
      shopId: "test-shop.myshopify.com",
      bundleType: "full_page",
      status: "active",
      shopifyPageHandle: null,
      steps: [],
      pricing: null,
    });

    const response = (await loader({
      request: makeSignedRequest(),
      params: { bundleId: "bundle-1" },
      context: {},
    } as any)) as Response;
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).not.toContain("/apps/product-bundles/assets/");
  });

  it("still loads ordered step categories before legacy page-link handling", async () => {
    const category = {
      id: "category-1",
      name: "Phones",
      sortOrder: 0,
      products: [{ id: "gid://shopify/Product/1", title: "Phone Case" }],
      collections: [],
    };

    getDb().bundle.findFirst.mockResolvedValue({
      id: "bundle-1",
      name: "Build a Box",
      shopId: "test-shop.myshopify.com",
      bundleType: "full_page",
      status: "draft",
      shopifyPageHandle: null,
      steps: [
        {
          id: "step-1",
          position: 1,
          StepProduct: [],
          StepCategory: [category],
        },
      ],
      pricing: null,
    });

    const response = (await loader({
      request: makeSignedRequest(),
      params: { bundleId: "bundle-1" },
      context: {},
    } as any)) as Response;

    expect(getDb().bundle.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          steps: expect.objectContaining({
            include: expect.objectContaining({
              StepProduct: { orderBy: { position: "asc" } },
              StepCategory: { orderBy: { sortOrder: "asc" } },
            }),
          }),
        }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it("renders ordered categories and escaped full configuration", async () => {
    getDb().bundle.findFirst.mockResolvedValue({
      id: "bundle-1",
      name: "Build 'n <Box>",
      description: null,
      shopId: "test-shop.myshopify.com",
      bundleType: "full_page",
      status: "unlisted",
      bundleDesignTemplate: "FBP_SIDE_FOOTER",
      bundleDesignPresetId: "CLASSIC",
      shopifyProductId: null,
      steps: [{
        id: "step-1",
        name: "Choose",
        position: 1,
        enabled: true,
        StepProduct: [],
        StepCategory: [
          { id: "cat-2", name: "Second", sortOrder: 2, products: [], collections: [] },
          { id: "cat-1", name: "First", sortOrder: 1, products: [], collections: [] },
        ],
      }],
      pricing: null,
    });

    const response = await loader({
      request: makeSignedRequest(),
      params: { bundleId: "bundle-1" },
      context: {},
    } as any) as Response;
    const text = await response.text();

    expect(text).toContain('data-bundle-config-source="app_proxy"');
    expect(text).toContain("data-fpb-design-preset=\"CLASSIC\"");
    expect(text).toContain("Build &#39;n &lt;Box&gt;");
    expect(text).not.toContain("Build 'n <Box>");
  });

  it("requires a valid bound preview token for drafts", async () => {
    getDb().bundle.findFirst.mockResolvedValue({
      id: "bundle-1",
      name: "Draft",
      description: null,
      shopId: "test-shop.myshopify.com",
      bundleType: "full_page",
      status: "draft",
      shopifyProductId: null,
      steps: [],
      pricing: null,
    });

    const unsigned = await loader({
      request: makeSignedRequest(),
      params: { bundleId: "bundle-1" },
      context: {},
    } as any) as Response;
    expect(unsigned.status).toBe(404);

    const request = makeSignedRequest();
    const url = new URL(request.url);
    url.searchParams.set("wpb_preview", createFpbPreviewToken({
      shop: "test-shop.myshopify.com",
      bundleId: "bundle-1",
      apiSecret: "test_api_secret",
    }));
    const paramsWithoutSignature = new URLSearchParams(url.searchParams);
    paramsWithoutSignature.delete("signature");
    const message = [...paramsWithoutSignature.entries()]
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join("");
    url.searchParams.set("signature", createHmac("sha256", "test_api_secret").update(message).digest("hex"));

    const signed = await loader({
      request: new Request(url),
      params: { bundleId: "bundle-1" },
      context: {},
    } as any) as Response;
    expect(signed.status).toBe(200);
  });

  it("rejects invalid signatures before querying the bundle", async () => {
    const request = makeSignedRequest();
    const url = new URL(request.url);
    url.searchParams.set("signature", "bad-signature");

    const response = (await loader({
      request: new Request(url.toString()),
      params: { bundleId: "bundle-1" },
      context: {},
    } as any)) as Response;

    expect(response.status).toBe(400);
    expect(getDb().bundle.findFirst).not.toHaveBeenCalled();
  });
});
