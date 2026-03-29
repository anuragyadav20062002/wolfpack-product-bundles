jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

jest.mock("../../../app/lib/auth-guards.server", () => ({
  requireAppProxy: jest.fn(),
}));

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: {
      findMany: jest.fn(),
    },
  },
}));

import { loader } from "../../../app/routes/api/api.bundles.json";
import { requireAppProxy } from "../../../app/lib/auth-guards.server";

const mockRequireAppProxy = requireAppProxy as jest.MockedFunction<typeof requireAppProxy>;
const getDb = () => require("../../../app/db.server").default;
const mockFindMany = () => getDb().bundle.findMany as jest.MockedFunction<any>;

function makeRequest() {
  return new Request("https://test-shop.myshopify.com/apps/product-bundles/api/bundles.json");
}

describe("api.bundles.json", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAppProxy.mockResolvedValue({
      session: { shop: "test-shop.myshopify.com" },
    } as any);
  });

  it("includes shopifyPageHandle for active full-page bundles", async () => {
    mockFindMany().mockResolvedValue([
      {
        id: "bundle-1",
        name: "FP Bundle",
        description: "desc",
        status: "active",
        bundleType: "full_page",
        shopifyProductId: "gid://shopify/Product/1",
        shopifyPageHandle: "build-your-bundle",
        steps: [],
        pricing: null,
      },
    ]);

    const response = await loader({ request: makeRequest() } as any);
    const body = await (response as Response).json();

    expect(body.success).toBe(true);
    expect(body.bundles["bundle-1"].shopifyPageHandle).toBe("build-your-bundle");
  });
});
