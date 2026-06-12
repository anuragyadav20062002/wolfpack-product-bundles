import { MantleClient } from "@heymantle/client";
import { AppLogger } from "../lib/logger";

type AdminGraphqlClient = {
  graphql: (query: string) => Promise<{ json: () => Promise<{
    data?: {
      shop?: {
        id?: string | null;
        name?: string | null;
        email?: string | null;
        myshopifyDomain?: string | null;
      } | null;
    };
  }> }>;
};

export type MantleProviderConfig = {
  appId: string;
  customerApiToken: string;
  apiUrl?: string;
};

type BuildMantleProviderConfigArgs = {
  appId?: string;
  apiKey?: string;
  apiUrl?: string;
  shopDomain: string;
  accessToken?: string | null;
  admin: AdminGraphqlClient;
};

const SHOP_QUERY = `#graphql
  query MantleShopIdentity {
    shop {
      id
      name
      email
      myshopifyDomain
    }
  }
`;

export async function buildMantleProviderConfig({
  appId,
  apiKey,
  apiUrl,
  shopDomain,
  accessToken,
  admin,
}: BuildMantleProviderConfigArgs): Promise<MantleProviderConfig | null> {
  if (!appId || !apiKey || !accessToken) {
    return null;
  }

  try {
    const shopResponse = await admin.graphql(SHOP_QUERY);
    const shopJson = await shopResponse.json();
    const shop = shopJson.data?.shop;
    if (!shop?.id) {
      return null;
    }

    const client = new MantleClient({
      appId,
      apiKey,
      ...(apiUrl ? { apiUrl } : {}),
    });
    const identifyResult = await client.identify({
      platform: "shopify",
      platformId: shop.id,
      myshopifyDomain: shop.myshopifyDomain ?? shopDomain,
      accessToken,
      name: shop.name ?? shopDomain,
      email: shop.email ?? undefined,
    }) as { apiToken?: unknown };

    const customerApiToken = typeof identifyResult.apiToken === "string" ? identifyResult.apiToken : "";
    if (!customerApiToken) {
      return null;
    }

    return {
      appId,
      customerApiToken,
      ...(apiUrl ? { apiUrl } : {}),
    };
  } catch (error) {
    AppLogger.warn("Failed to build Mantle provider config", {
      component: "mantle.server",
      shop: shopDomain,
    }, error);
    return null;
  }
}
