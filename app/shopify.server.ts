import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  LATEST_API_VERSION,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { createStorefrontAccessToken } from "./services/storefront-token.server";
import { CartTransformService } from "./services/cart-transform-service.server";
import { BillingService } from "./services/billing.server";
import { ensureVariantBundleMetafieldDefinitions } from "./services/bundles/metafield-sync.server";
import { AppLogger } from "./lib/logger";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25, // 2025-10: Required for functionHandle support in cart transforms
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  hooks: {
    afterAuth: async ({ session, admin }) => {
      AppLogger.info("afterAuth hook triggered", { shop: session.shop });

      // Create variant-level metafield definitions with storefront access.
      // These enable the Liquid widget to read bundle_ui_config and other metafields.
      try {
        await ensureVariantBundleMetafieldDefinitions(admin);
      } catch (error: any) {
        AppLogger.error("Failed to create metafield definitions", { shop: session.shop }, error);
      }

      // Create or get shop record with free plan subscription
      try {
        await BillingService.ensureShop(session.shop, session.shop);
      } catch (error: any) {
        AppLogger.error("Failed to create shop record", { shop: session.shop }, error);
      }

      // Create storefront access token after successful auth (optional, non-critical)
      try {
        await createStorefrontAccessToken(admin, session.shop);
      } catch (error: any) {
        AppLogger.error("Failed to create storefront access token", { shop: session.shop }, error);
      }

      // Sync $app:serverUrl metafield so the theme widget can read the app server URL.
      // Runs on install/re-install; URL is a static deploy-time value so syncing once is sufficient.
      try {
        const appUrl = process.env.SHOPIFY_APP_URL;
        if (appUrl) {
          const shopIdResponse = await admin.graphql(`query { shop { id } }`);
          if (shopIdResponse.ok) {
            const shopIdData = await shopIdResponse.json();
            const shopGlobalId = shopIdData.data?.shop?.id;
            if (shopGlobalId) {
              await admin.graphql(
                `mutation UpdateAppUrlMetafield($metafields: [MetafieldsSetInput!]!) {
                   metafieldsSet(metafields: $metafields) {
                     metafields { id }
                     userErrors { field message }
                   }
                 }`,
                {
                  variables: {
                    metafields: [{
                      ownerId: shopGlobalId,
                      namespace: "$app",
                      key: "serverUrl",
                      type: "single_line_text_field",
                      value: appUrl,
                    }],
                  },
                },
              );
            }
          }
        }
      } catch (error: any) {
        AppLogger.error("Failed to sync $app:serverUrl metafield", { shop: session.shop }, error);
      }

      // UTM pixel is NOT activated automatically on install.
      // Merchants enable it explicitly via the toggle on the Analytics page.

      // Automatically activate cart transform for new installations
      try {
        const result = await CartTransformService.completeSetup(admin, session.shop);
        if (!result.success) {
          AppLogger.warn("Cart transform setup failed (non-critical)", { shop: session.shop, error: result.error });
        }
      } catch (error: any) {
        AppLogger.error("Error during cart transform setup", { shop: session.shop }, error);
      }
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25; // Match the runtime API version
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const sessionStorage = shopify.sessionStorage;
