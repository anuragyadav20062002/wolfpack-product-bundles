import {
  checkAppEmbedStatusFromCurrentRoute,
  resolveAppEmbedStatusThemeEditorUrl,
  verifyAppEmbedEnabledBeforePreview,
} from "../../../app/lib/app-embed-status-check.client";

describe("checkAppEmbedStatusFromCurrentRoute", () => {
  it("posts the app embed status intent to the dedicated status route", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      headers: new Headers({ "Content-Type": "application/json" }),
      json: jest.fn().mockResolvedValue({
        success: true,
        appEmbedEnabled: true,
        themeEditorUrl: "https://shop.myshopify.com/admin/themes/1/editor",
      }),
    });

    const result = await checkAppEmbedStatusFromCurrentRoute(
      fetchImpl,
      "https://app.example.com/app/bundles/full-page-bundle/configure/1",
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://app.example.com/app/app-embed-status",
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: "application/json" }),
        method: "POST",
      }),
    );
    expect(fetchImpl.mock.calls[0][1]).not.toHaveProperty("body");
    expect(result).toEqual({
      appEmbedEnabled: true,
      themeEditorUrl: "https://shop.myshopify.com/admin/themes/1/editor",
    });
  });

  it("fails closed when the status check response is not successful", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      headers: new Headers({ "Content-Type": "application/json" }),
      json: jest.fn().mockResolvedValue({ success: false }),
    });

    await expect(checkAppEmbedStatusFromCurrentRoute(fetchImpl, "https://app.example.com/app"))
      .resolves.toEqual({ appEmbedEnabled: false, themeEditorUrl: null });
  });

  it("fails closed when the status check response is not JSON", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      headers: new Headers({ "Content-Type": "text/html" }),
      json: jest.fn(),
    });

    await expect(checkAppEmbedStatusFromCurrentRoute(
      fetchImpl,
      "https://app.example.com/app/bundles/full-page-bundle/configure/1",
    )).resolves.toEqual({ appEmbedEnabled: false, themeEditorUrl: null });
  });
});

describe("resolveAppEmbedStatusThemeEditorUrl", () => {
  it("preserves the existing Theme Editor URL when revalidation omits one", () => {
    expect(resolveAppEmbedStatusThemeEditorUrl(
      "https://shop.myshopify.com/admin/themes/1/editor",
      null,
    )).toBe("https://shop.myshopify.com/admin/themes/1/editor");
  });

  it("uses a fresh Theme Editor URL when revalidation returns one", () => {
    expect(resolveAppEmbedStatusThemeEditorUrl(
      "https://shop.myshopify.com/admin/themes/1/editor",
      "https://shop.myshopify.com/admin/themes/2/editor",
    )).toBe("https://shop.myshopify.com/admin/themes/2/editor");
  });
});

describe("verifyAppEmbedEnabledBeforePreview", () => {
  it("does not revalidate when configure state already says the app embed is disabled", async () => {
    const checkStatus = jest.fn();

    await expect(verifyAppEmbedEnabledBeforePreview(false, checkStatus))
      .resolves.toBe(false);

    expect(checkStatus).not.toHaveBeenCalled();
  });

  it("revalidates when configure state says the app embed is enabled", async () => {
    const checkStatus = jest.fn().mockResolvedValue(true);

    await expect(verifyAppEmbedEnabledBeforePreview(true, checkStatus))
      .resolves.toBe(true);

    expect(checkStatus).toHaveBeenCalledTimes(1);
  });

  it("starts preview loading before live revalidation and stops it when revalidation blocks preview", async () => {
    let loading = false;
    const events: string[] = [];
    const checkStatus = jest.fn().mockImplementation(async () => {
      events.push(`check:${loading ? "loading" : "idle"}`);
      return false;
    });

    await expect(verifyAppEmbedEnabledBeforePreview(true, checkStatus, {
      onValidationStart: () => {
        loading = true;
        events.push("start");
      },
      onValidationBlocked: () => {
        loading = false;
        events.push("blocked");
      },
    })).resolves.toBe(false);

    expect(events).toEqual(["start", "check:loading", "blocked"]);
  });
});
