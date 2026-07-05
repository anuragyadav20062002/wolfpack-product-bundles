import {
  getUtmPixelStatusBannerModel,
  UTM_PIXEL_PRIVACY_MESSAGE,
} from "../../../app/lib/utm-pixel-status-banner";

describe("UTM pixel status banner model", () => {
  it("keeps the active banner compact and status-only", () => {
    expect(getUtmPixelStatusBannerModel(true)).toEqual({
      statusLabel: "Active",
      tone: "success",
      statusDotTone: "online",
      actionLabel: null,
      opensDisclosure: false,
    });
  });

  it("uses the same compact shell when tracking is disabled", () => {
    expect(getUtmPixelStatusBannerModel(false)).toEqual({
      statusLabel: "Not active",
      tone: "neutral",
      statusDotTone: "offline",
      actionLabel: "Learn more",
      opensDisclosure: true,
    });
  });

  it("uses plain-language Shopify privacy and consent copy", () => {
    expect(UTM_PIXEL_PRIVACY_MESSAGE).toBe(
      "Wolfpack uses Shopify's pixel privacy controls and only records campaign details when Shopify allows tracking. Your store data stays in your app, and privacy requests are handled through Shopify's required compliance process.",
    );
  });
});
