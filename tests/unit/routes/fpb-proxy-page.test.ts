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

jest.mock("../../../app/lib/bundle-formatter.server", () => ({
  formatBundleForWidget: jest.fn((bundle) => ({
    id: bundle.id,
    name: bundle.name,
    steps: [],
  })),
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

  it("renders the full-page widget shell for a valid signed bundle request", async () => {
    getDb().bundle.findFirst.mockResolvedValue({
      id: "bundle-1",
      name: "Build a Box",
      shopId: "test-shop.myshopify.com",
      bundleType: "full_page",
      status: "active",
      steps: [],
      pricing: null,
    });

    const response = (await loader({
      request: makeSignedRequest(),
      params: { bundleId: "bundle-1" },
      context: {},
    } as any)) as Response;
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('data-bundle-id="bundle-1"');
    expect(html).toContain('data-bundle-type="full_page"');
    expect(html).toContain("/apps/product-bundles/assets/bundle-widget-full-page.css");
    expect(html).toContain("/apps/product-bundles/assets/bundle-widget-full-page-bundled.js");
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
