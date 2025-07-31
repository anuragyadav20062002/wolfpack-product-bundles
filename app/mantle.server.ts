import { MantleClient } from "@heymantle/client";

const mantleClient = new MantleClient({
  appId: process.env.MANTLE_APP_ID!,
  apiKey: process.env.MANTLE_API_KEY!,
});

export async function identifyMerchant(shopId: string, shopDomain: string, accessToken: string, name?: string, email?: string) {
  try {
    const response = await mantleClient.identify({
      platform: "shopify",
      platformId: shopId,
      myshopifyDomain: shopDomain,
      accessToken: accessToken,
      name: name,
      email: email,
    });

    if ('apiToken' in response && typeof response.apiToken === 'string') {
      return response.apiToken;
    } else {
      console.error("Mantle identification succeeded but no apiToken found in response:", response);
      return null;
    }
  } catch (error) {
    console.error("Mantle identification failed:", error);
    return null;
  }
}