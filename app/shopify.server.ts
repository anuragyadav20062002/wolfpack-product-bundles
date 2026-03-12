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
import { ensureVariantBundleMetafieldDefinitions, ensurePageBundleIdMetafieldDefinition } from "./services/bundles/metafield-sync.server";
import { activateUtmPixel } from "./services/pixel-activation.server";

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
      console.log("[SHOPIFY] afterAuth hook triggered for shop:", session.shop);

      // CRITICAL: Create variant-level metafield definitions with storefront access
      // These definitions enable Liquid widget to read bundle_ui_config and other metafields
      try {
        console.log("[SHOPIFY] Creating variant-level metafield definitions...");
        await ensureVariantBundleMetafieldDefinitions(admin);
        await ensurePageBundleIdMetafieldDefinition(admin);
        console.log("[SHOPIFY] ✅ Metafield definitions created with storefront access");
      } catch (error: any) {
        console.error("[SHOPIFY] ⚠️ Failed to create metafield definitions:", error?.message || error);
        console.error("[SHOPIFY] ℹ️ This may prevent the widget from loading. Definitions can be created manually.");
      }

      // Create or get shop record with free plan subscription
      try {
        console.log("[SHOPIFY] Ensuring shop record with subscription...");
        await BillingService.ensureShop(
          session.shop,
          session.shop // Use shop domain as name if not provided
        );
        console.log("[SHOPIFY] ✅ Shop record created/retrieved with free plan");
      } catch (error: any) {
        console.error("[SHOPIFY] ⚠️ Failed to create shop record:", error?.message || error);
        console.error("[SHOPIFY] ⚠️ This may affect subscription billing. Please check logs.");
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

      // Sync $app:serverUrl metafield so the theme widget can read the app server URL.
      // This runs on install/re-install; the URL is a static deploy-time value so
      // syncing once is sufficient (previously done on every /app load in app._index.tsx,
      // which caused a parallel-loader race condition with unstable_newEmbeddedAuthStrategy).
      try {
        const appUrl = process.env.SHOPIFY_APP_URL;
        if (appUrl) {
          console.log("[SHOPIFY] Syncing $app:serverUrl metafield...");
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
              console.log("[SHOPIFY] ✅ $app:serverUrl metafield synced");
            }
          }
        }
      } catch (error: any) {
        console.error("[SHOPIFY] ⚠️ Failed to sync $app:serverUrl metafield:", error?.message || error);
        console.error("[SHOPIFY] ℹ️ Widget API calls may use a stale server URL until next reinstall.");
      }

      // Activate the Wolfpack UTM Attribution web pixel.
      // Strategy: always delete-then-recreate on install/reinstall.
      // This ensures the pixel record binds to the CURRENT deployed extension.
      // See services/pixel-activation.server.ts for full implementation.
      try {
        const appUrl = process.env.SHOPIFY_APP_URL;
        if (appUrl) {
          console.log("[SHOPIFY] Activating UTM attribution web pixel...");
          await activateUtmPixel(admin, appUrl);
        }
      } catch (error: unknown) {
        console.error("[SHOPIFY] ⚠️ Failed to activate UTM pixel:", (error as Error)?.message || error);
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
