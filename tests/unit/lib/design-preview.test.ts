import {
  buildDesignPreviewVariables,
} from "../../../app/routes/app/app.settings/settings-state";

describe("design preview variables", () => {
  it("builds only validated variables used by the app-owned preview", () => {
    expect(buildDesignPreviewVariables({
      "Primary Color": "#123456",
      "Button Text Color": "#ffffff",
      unknown: "body { display: none }",
    })).toEqual({
      "--bundle-global-primary-button": "#123456",
      "--bundle-button-bg": "#123456",
      "--bundle-global-button-text": "#ffffff",
      "--bundle-button-text-color": "#ffffff",
    });
  });

  it("rejects invalid design values", () => {
    expect(buildDesignPreviewVariables({
      "Primary Color": "url(javascript:alert(1))",
      "Primary Font Size": "10000px",
      "Image Fit": "invalid",
    })).toEqual({});
  });
});
