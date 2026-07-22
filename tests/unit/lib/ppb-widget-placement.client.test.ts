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
        "https://admin.test/configure",
        fetcher
      )
    ).resolves.toEqual({ ready: true, installationLink: null, message: null });

    const [, options] = fetcher.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("intent")).toBe("validateWidgetPlacement");
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
