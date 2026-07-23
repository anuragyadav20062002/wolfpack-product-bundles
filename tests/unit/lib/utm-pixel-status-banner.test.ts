import {
  getUtmPixelStatusBannerModel,
  UTM_PIXEL_PRIVACY_MESSAGE,
} from "../../../app/lib/utm-pixel-status-banner";

describe("UTM pixel status banner model", () => {
  it("explains the active tracking state", () => {
    expect(getUtmPixelStatusBannerModel(true)).toEqual({
      statusLabel: "Active",
      tone: "success",
      statusDotTone: "online",
      description: "Campaign attribution is active and following Shopify's customer privacy choices.",
      actionLabel: null,
      opensDisclosure: false,
    });
  });

  it("explains how to activate tracking when disabled", () => {
    expect(getUtmPixelStatusBannerModel(false)).toEqual({
      statusLabel: "Not active",
      tone: "neutral",
      statusDotTone: "offline",
      description: "Activate tracking to connect UTM-tagged visits with bundle orders.",
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
