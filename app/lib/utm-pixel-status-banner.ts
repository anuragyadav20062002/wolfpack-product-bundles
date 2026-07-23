export const UTM_PIXEL_PRIVACY_MESSAGE =
  "Wolfpack uses Shopify's pixel privacy controls and only records campaign details when Shopify allows tracking. Your store data stays in your app, and privacy requests are handled through Shopify's required compliance process.";

export type UtmPixelStatusBannerModel = {
  statusLabel: "Active" | "Not active";
  tone: "success" | "neutral";
  statusDotTone: "online" | "offline";
  description: string;
  actionLabel: "Learn more" | null;
  opensDisclosure: boolean;
};

export function getUtmPixelStatusBannerModel(active: boolean): UtmPixelStatusBannerModel {
  if (active) {
    return {
      statusLabel: "Active",
      tone: "success",
      statusDotTone: "online",
      description: "Campaign attribution is active and following Shopify's customer privacy choices.",
      actionLabel: null,
      opensDisclosure: false,
    };
  }

  return {
    statusLabel: "Not active",
    tone: "neutral",
    statusDotTone: "offline",
    description: "Activate tracking to connect UTM-tagged visits with bundle orders.",
    actionLabel: "Learn more",
    opensDisclosure: true,
  };
}
