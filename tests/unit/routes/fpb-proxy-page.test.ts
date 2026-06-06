import { createHmac } from "node:crypto";
import { loader } from "../../../app/routes/root/wpb.$bundleId";

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

  it("redirects legacy signed full-page proxy links to the Shopify page URL", async () => {
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
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://test-shop.myshopify.com/pages/build-a-box");
  });

  it("does not render an app-proxy asset shell when no Shopify page is linked", async () => {
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

    expect(response.status).toBe(409);
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
              StepProduct: true,
              StepCategory: { orderBy: { sortOrder: "asc" } },
            }),
          }),
        }),
      }),
    );
    expect(response.status).toBe(409);
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
