import { validatePpbWidgetPlacementBeforePreview } from "../../../app/lib/ppb-widget-placement.client";

describe("validatePpbWidgetPlacementBeforePreview", () => {
  it("allows preview when the server confirms placement", async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        productUrl: "https://shop.test/products/bundle",
      }),
    });

    await expect(
      validatePpbWidgetPlacementBeforePreview(
        "https://admin.test/configure?embedded=1",
        fetcher
      )
    ).resolves.toEqual({ ready: true, installationLink: null, message: null });

    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe(
      "https://admin.test/configure/validate-widget-placement?embedded=1"
    );
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ Accept: "application/json" });
    expect(options.body).toBeUndefined();
  });

  it("blocks preview and preserves the placement link when setup is required", async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        requiresOneTimeSetup: true,
        installationLink: "https://theme-editor.test/place",
        message: "Place the bundle widget",
      }),
    });

    await expect(
      validatePpbWidgetPlacementBeforePreview(
        "https://admin.test/configure",
        fetcher
      )
    ).resolves.toEqual({
      ready: false,
      installationLink: "https://theme-editor.test/place",
      message: "Place the bundle widget",
    });
  });

  it("fails closed when placement validation throws", async () => {
    const fetcher = jest
      .fn()
      .mockRejectedValue(new Error("network unavailable"));

    await expect(
      validatePpbWidgetPlacementBeforePreview(
        "https://admin.test/configure",
        fetcher
      )
    ).resolves.toEqual({
      ready: false,
      installationLink: null,
      message: "Unable to verify bundle widget placement",
    });
  });
});
