import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  LATEST_API_VERSION,
  DeliveryMethod,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { createStorefrontAccessToken } from "./services/storefront-token.server";
import { CartTransformService } from "./services/cart-transform-service.server";
import { ensureStandardMetafieldDefinitions } from "./services/bundles/standard-metafields.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
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
      console.log("[SHOPIFY] afterAuth hook triggered for shop:", session.shop);

      // Ensure metafield definitions exist with proper storefront access
      try {
        console.log("[SHOPIFY] Ensuring metafield definitions...");
        await ensureStandardMetafieldDefinitions(admin);
        console.log("[SHOPIFY] ✅ Metafield definitions verified");
      } catch (error: any) {
        console.error("[SHOPIFY] ⚠️ Failed to ensure metafield definitions:", error?.message || error);
        console.error("[SHOPIFY] ℹ️ This is non-critical. Definitions will be created when bundles are saved.");
      }

      // Create storefront access token after successful auth
      // This is optional - the app will work without it, but product fetching will be slower
      try {
        console.log("[SHOPIFY] Creating storefront access token...");
        const token = await createStorefrontAccessToken(admin, session.shop);
        console.log("[SHOPIFY] ✅ Storefront access token created:", token.substring(0, 20) + "...");
      } catch (error: any) {
        // Log detailed error but don't fail the installation
        console.error("[SHOPIFY] ⚠️ Failed to create storefront access token:", error?.message || error);
        console.error("[SHOPIFY] ⚠️ This is non-critical. App will use Admin API fallback for product fetching.");
        console.error("[SHOPIFY] ℹ️ To enable storefront tokens, ensure app has 'unauthenticated_read_products' scope and reinstall.");
      }

      // Automatically activate cart transform for new installations
      try {
        console.log("[SHOPIFY] Setting up cart transform...");
        const result = await CartTransformService.completeSetup(admin, session.shop);

        if (result.success) {
          if (result.alreadyExists) {
            console.log("[SHOPIFY] ✅ Cart transform already active");
          } else {
            console.log("[SHOPIFY] ✅ Cart transform activated:", result.cartTransformId);
          }
        } else {
          console.error("[SHOPIFY] ⚠️ Cart transform setup failed:", result.error);
          console.error("[SHOPIFY] ℹ️ This is non-critical. Cart transform can be activated manually later.");
        }
      } catch (error: any) {
        console.error("[SHOPIFY] ⚠️ Error during cart transform setup:", error?.message || error);
        console.error("[SHOPIFY] ℹ️ This is non-critical. Cart transform can be activated manually later.");
      }
    },
  },
  webhooks: {
    PRODUCTS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/products/update",
    },
    PRODUCTS_DELETE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/products/delete",
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
