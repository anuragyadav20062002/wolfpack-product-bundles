/**
 * Widget Product Bundle Operations
 *
 * Handles validation and setup of product page bundle widgets.
 * Production-ready, App Store compliant - NO programmatic theme modifications.
 */

import { AppLogger } from "../../lib/logger";
import type { ShopifyAdmin } from "../../lib/auth-guards.server";
import {
  generateProductBundleConfigurationLink,
  generateThemeEditorDeepLink,
} from "./widget-theme-editor-links.server";
import type { ProductBundleWidgetStatus } from "./types";

interface ProductPlacementSeed {
  data?: {
    currentAppInstallation?: { app?: { handle?: string | null } | null } | null;
    product?: {
      id?: string;
      handle?: string | null;
      templateSuffix?: string | null;
    } | null;
    themes?: { nodes?: Array<{ id?: string }> } | null;
  } | null;
}

interface ThemeFileBody {
  content?: string;
  contentBase64?: string;
  url?: string;
}

interface ProductTemplateResponse {
  data?: {
    theme?: {
      files?: {
        nodes?: Array<{ filename?: string; body?: ThemeFileBody }>;
      };
    } | null;
  } | null;
}

function templateFilename(templateSuffix?: string | null) {
  const suffix = templateSuffix?.trim();
  return suffix ? `templates/product.${suffix}.json` : "templates/product.json";
}

function templateHandle(templateSuffix?: string | null) {
  const suffix = templateSuffix?.trim();
  return suffix ? `product.${suffix}` : "product";
}

async function readThemeFileBody(body?: ThemeFileBody) {
  if (typeof body?.content === "string") return body.content;
  if (typeof body?.contentBase64 === "string") {
    return Buffer.from(body.contentBase64, "base64").toString("utf8");
  }
  if (typeof body?.url !== "string") return null;

  const response = await fetch(body.url, {
    headers: { Accept: "application/json" },
  });
  return response.ok ? response.text() : null;
}

function templateContainsProductBundleBlock(content: string, appHandle?: string | null) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content.replace(/^\uFEFF/, "").replace(/^\s*\/\*[\s\S]*?\*\//, ""));
  } catch {
    return false;
  }

  const pending: unknown[] = [parsed];
  while (pending.length > 0) {
    const value = pending.pop();
    if (!value || typeof value !== "object") continue;
    if (Array.isArray(value)) {
      pending.push(...value);
      continue;
    }

    const record = value as Record<string, unknown>;
    if (typeof record.type === "string") {
      const matchesBlock = record.type.includes("/blocks/bundle-product-page/");
      const matchesApp =
        typeof appHandle === "string" && record.type.startsWith(`shopify://apps/${appHandle}/`);
      if (matchesBlock && matchesApp) return true;
    }
    pending.push(...Object.values(record));
  }

  return false;
}

function missingPlacementResult({
  shop,
  apiKey,
  bundleId,
  productHandle,
  productTemplateHandle,
}: {
  shop: string;
  apiKey: string;
  bundleId: string;
  productHandle?: string | null;
  productTemplateHandle: string;
}): ProductBundleWidgetStatus {
  const installationLink = productHandle
    ? generateThemeEditorDeepLink(
        shop,
        apiKey,
        "bundle-product-page",
        bundleId,
        productTemplateHandle,
        "newAppsSection",
        `/products/${productHandle}`,
      ).url
    : undefined;

  return {
    widgetInstalled: false,
    requiresOneTimeSetup: true,
    installationLink,
    message:
      "Place the Bundle Builder block on this product template before previewing the bundle.",
  };
}

/**
 * Validate product bundle widget setup and provide guidance
 *
 * Reads the product's effective template in the main theme and verifies that
 * the product-page app block is placed before reporting the widget as ready.
 *
 * @param admin - Shopify admin API client
 * @param shop - Shop domain
 * @param apiKey - App API key
 * @param bundleId - Bundle ID
 * @param shopifyProductId - Shopify product ID (optional)
 * @returns Widget status with configuration links
 */
export async function validateProductBundleWidgetSetup(
  admin: ShopifyAdmin,
  shop: string,
  apiKey: string,
  bundleId: string,
  shopifyProductId?: string
): Promise<ProductBundleWidgetStatus> {
  try {
    AppLogger.info('Validating product bundle widget setup', {
      component: 'WidgetProductBundle',
      shop,
      bundleId,
      shopifyProductId
    });

    if (shopifyProductId) {
      const placementSeedResponse = await admin.graphql(
        `
        query GetProductBundlePlacementSeed($id: ID!) {
          currentAppInstallation {
            app {
              handle
            }
          }
          product(id: $id) {
            id
            handle
            templateSuffix
          }
          themes(first: 1, roles: [MAIN]) {
            nodes {
              id
            }
          }
        }
      `,
        {
          variables: { id: shopifyProductId },
        },
      );
      const placementSeed = (await placementSeedResponse.json()) as ProductPlacementSeed;
      const product = placementSeed.data?.product;
      const productHandle = product?.handle;

      if (productHandle) {
        const productTemplateFilename = templateFilename(product.templateSuffix);
        const productTemplateHandle = templateHandle(product.templateSuffix);
        const themeId = placementSeed.data?.themes?.nodes?.[0]?.id;
        const appHandle = placementSeed.data?.currentAppInstallation?.app?.handle;
        if (!themeId) {
          return missingPlacementResult({
            shop,
            apiKey,
            bundleId,
            productHandle,
            productTemplateHandle,
          });
        }

        const templateResponse = await admin.graphql(
          `
          query GetProductBundleTemplate($themeId: ID!, $filenames: [String!]!) {
            theme(id: $themeId) {
              files(filenames: $filenames) {
                nodes {
                  filename
                  body {
                    ... on OnlineStoreThemeFileBodyText {
                      content
                    }
                    ... on OnlineStoreThemeFileBodyBase64 {
                      contentBase64
                    }
                    ... on OnlineStoreThemeFileBodyUrl {
                      url
                    }
                  }
                }
              }
            }
          }
        `,
          {
            variables: {
              themeId,
              filenames: [productTemplateFilename],
            },
          },
        );
        const templateData = (await templateResponse.json()) as ProductTemplateResponse;
        const templateFile =
          templateData.data?.theme?.files?.nodes?.find(
            (file) => file.filename === productTemplateFilename,
          ) ?? templateData.data?.theme?.files?.nodes?.[0];
        const templateContent = await readThemeFileBody(templateFile?.body);

        if (!templateContent || !templateContainsProductBundleBlock(templateContent, appHandle)) {
          return missingPlacementResult({
            shop,
            apiKey,
            bundleId,
            productHandle,
            productTemplateHandle,
          });
        }

        const shopDomain = shop.replace('.myshopify.com', '');
        const productUrl = `https://${shopDomain}.myshopify.com/products/${productHandle}`;
        const configLink = generateProductBundleConfigurationLink(
          shop,
          apiKey,
          bundleId,
          productHandle
        );

        AppLogger.info('Product bundle ready', {
          component: 'WidgetProductBundle',
          shop,
          bundleId,
          productHandle
        });

        return {
          widgetInstalled: true,
          requiresOneTimeSetup: false,
          productUrl: productUrl,
          configurationLink: configLink,
          message: 'Bundle is ready! View it on your storefront or configure in theme editor'
        };
      }
    }

    // No product yet
    return {
      widgetInstalled: false,
      requiresOneTimeSetup: false,
      message: 'Bundle widget is installed. Create a bundle product to see it on your storefront.'
    };

  } catch (error) {
    AppLogger.error('Failed to validate product bundle widget setup', {
      component: 'WidgetProductBundle',
      shop,
      bundleId
    }, error);

    return {
      widgetInstalled: false,
      requiresOneTimeSetup: true,
      message: 'Unable to verify bundle widget placement'
    };
  }
}
