import {
  getPrepareStorefrontPreviewUrl,
  prepareStorefrontPreviewForOpen,
} from "../../../app/lib/storefront-sync-preview.client";

describe("storefront sync preview client", () => {
  const originalWindow = (global as any).window;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).window = {
      location: {
        href: "https://admin.shopify.com/store/test/apps/wpb/app/bundle",
      },
    };
  });

  afterEach(() => {
    (global as any).window = originalWindow;
    global.fetch = originalFetch;
  });

  it("builds a resource-route URL instead of posting to the configure document", () => {
    const location = new URL(
      "https://app.example.com/app/bundles/full-page-bundle/configure/bundle-1?embedded=1",
    ) as unknown as Location;

    expect(getPrepareStorefrontPreviewUrl(location)).toBe(
      "https://app.example.com/app/bundles/full-page-bundle/configure/bundle-1/prepare-preview?embedded=1",
    );
  });

  it("posts a single preparePreviewBundle intent", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true, ready: true }),
    });
    global.fetch = fetchMock;

    await prepareStorefrontPreviewForOpen();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://admin.shopify.com/store/test/apps/wpb/app/bundle/prepare-preview",
    );
    expect(init.method).toBe("POST");
    expect(init.body.get("intent")).toBe("preparePreviewBundle");
  });

  it("throws the compact server error when preview preparation fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({
        success: false,
        error: "publish failed",
      }),
    });

    await expect(prepareStorefrontPreviewForOpen()).rejects.toThrow(
      "publish failed",
    );
  });
});
