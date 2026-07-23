/**
 * Shared Bundle Configure Handlers
 *
 * Contains functions that are identical between the full-page and product-page
 * bundle configure routes. File-specific handlers (handleSaveBundle,
 * handleSyncProduct, handleValidateWidgetPlacement, handleCheckFullPageTemplate)
 * live in their respective route handler files.
 */

import { json } from "@remix-run/node";
import type { ShopifyAdmin } from "../../lib/auth-guards.server";
import type { Session } from "@shopify/shopify-api";
import { AppLogger } from "../../lib/logger";
import db from "../../db.server";
import { ThemeTemplateService } from "../theme-template.server";
import { BundleStatus, BundleType, FullPageLayout } from "../../constants/bundle";
import { SHOPIFY_REST_API_VERSION } from "../../constants/api";
import { buildBundleProductDescriptionHtml } from "../../lib/bundle-product-description.server";

// Re-export so route handlers can import it from this barrel file.
export { buildBundleProductDescriptionHtml };

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Validate and normalise a Shopify product ID to the GID format.
 * Throws with a clear message for UUIDs (corrupted browser state) or unrecognised formats.
 * Called once at the boundary — callers can use the returned value directly.
 */
export function normaliseShopifyProductId(raw: string, context: { title: string; stepName: string }): string {
  if (!raw || typeof raw !== "string") {
    throw new Error(`Invalid product ID: must be a non-empty string. Got: ${typeof raw}`);
  }
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (UUID_RE.test(raw)) {
    throw new Error(
      `Invalid product ID detected: UUID "${raw}" for product "${context.title}" in step "${context.stepName}". ` +
      `This indicates corrupted browser state. Please refresh the page and re-select the product using the product picker.`
    );
  }
  if (raw.startsWith("gid://shopify/Product/")) {
    const numericId = raw.replace("gid://shopify/Product/", "");
    if (!/^\d+$/.test(numericId)) {
      throw new Error(
        `Invalid product ID format: "${raw}" for product "${context.title}". ` +
        `Shopify product IDs must be numeric. Expected format: gid://shopify/Product/123456`
      );
    }
    return raw;
  }
  if (/^\d+$/.test(raw)) {
    return `gid://shopify/Product/${raw}`;
  }
  throw new Error(
    `Invalid product ID format: "${raw}" for product "${context.title}". ` +
    `Expected Shopify GID (gid://shopify/Product/123456) or numeric ID (123456).`
  );
}

// Utility function for safe JSON parsing
export const safeJsonParse = (value: any, defaultValue: any = []) => {
  if (!value) return defaultValue;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      AppLogger.error("JSON parse failed", {
        component: 'bundle-config',
        operation: 'json-parse'
      }, error);
      return defaultValue;
    }
  }
  return defaultValue;
};

// ─── Shared Handlers ─────────────────────────────────────────────────────────

/** Handle updating Wolfpack bundle availability without changing Shopify discoverability. */
export async function handleUpdateBundleStatus(_admin: ShopifyAdmin, session: Session, bundleId: string, formData: FormData) {
  const status = formData.get("status") as string | null;
  if (!Object.values(BundleStatus).includes(status as BundleStatus)) {
    return json({ success: false, error: "Invalid bundle status" }, { status: 400 });
  }

  const finalStatus = status as BundleStatus;

  const updatedBundle = await db.bundle.update({
    where: {
      id: bundleId,
      shopId: session.shop
    },
    data: { status: finalStatus },
    include: {
      steps: true,
      pricing: true
    }
  });

  return json({
    success: true,
    bundle: updatedBundle,
    message: `Bundle status updated to ${status}`
  });
}

/**
 * Handle updating bundle product details (title and image)
 */
export async function handleUpdateBundleProduct(admin: ShopifyAdmin, session: Session, bundleId: string, formData: FormData) {
  try {
    const productId = formData.get("productId") as string;
    const productTitle = formData.get("productTitle") as string;
    const productImageUrl = formData.get("productImageUrl") as string;

    if (!productId) {
      return json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    AppLogger.debug("[PRODUCT_UPDATE] Updating product details", {
      productId,
      productTitle,
      hasImageUrl: !!productImageUrl
    });

    const mediaInput = productImageUrl
      ? [{
          originalSource: productImageUrl,
          alt: `${productTitle || "Bundle"} - Bundle`,
          mediaContentType: "IMAGE" as const,
        }]
      : undefined;

    // Update product title and optional media in one current product mutation.
    const UPDATE_PRODUCT = `
      mutation UpdateProduct($product: ProductUpdateInput!, $media: [CreateMediaInput!]) {
        productUpdate(product: $product, media: $media) {
          product {
            id
            title
            media(first: 10) {
              nodes {
                alt
                mediaContentType
                preview {
                  status
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const updateResponse = await admin.graphql(UPDATE_PRODUCT, {
      variables: {
        product: {
          id: productId,
          title: productTitle
        },
        ...(mediaInput ? { media: mediaInput } : {}),
      }
    });

    const updateData = await updateResponse.json();

    if (updateData.data?.productUpdate?.userErrors?.length > 0) {
      const error = updateData.data.productUpdate.userErrors[0];
      throw new Error(`Failed to update product: ${error.message}`);
    }

    AppLogger.info("[PRODUCT_UPDATE] Product details updated successfully");

    return json({
      success: true,
      message: "Product details updated successfully"
    });

  } catch (error) {
    AppLogger.error("[PRODUCT_UPDATE] Error updating product:", {}, error as any);
    return json({
      success: false,
      error: (error as Error).message || "Failed to update product"
    }, { status: 500 });
  }
}

/**
 * Handle getting available pages for widget placement
 */
export async function handleGetPages(admin: ShopifyAdmin, _session: Session) {
  const GET_PAGES = `
    query getPages($first: Int!) {
      pages(first: $first) {
        nodes {
          id
          title
          handle
          createdAt
          updatedAt
        }
      }
    }
  `;

  const response = await admin.graphql(GET_PAGES, {
    variables: { first: 50 } // Get first 50 pages
  });

  const data = await response.json();

  if (data.data?.pages?.nodes) {
    return json({
      success: true,
      pages: data.data.pages.nodes
    });
  } else {
    return json({
      success: false,
      error: "Failed to fetch pages"
    });
  }
}

/**
 * Handle getting theme templates
 */
export async function handleGetThemeTemplates(admin: ShopifyAdmin, session: Session) {
  try {
    // Get the published theme directly
    const GET_PUBLISHED_THEME = `
      query getPublishedTheme {
        themes(first: 1, roles: [MAIN]) {
          nodes {
            id
            name
            role
          }
        }
      }
    `;

    const themesResponse = await admin.graphql(GET_PUBLISHED_THEME);

    const themesData = await themesResponse.json();

    if (!themesData.data?.themes?.nodes) {
      return json({
        success: false,
        error: "Failed to fetch themes"
      });
    }

    // Get the published theme (should be the first and only one)
    const publishedTheme = themesData.data.themes.nodes[0];

    if (!publishedTheme) {
      AppLogger.error("No themes returned from GraphQL:", {}, themesData);
      return json({
        success: false,
        error: "No published theme found"
      });
    }


    // Extract theme ID (remove gid prefix if present)
    const themeId = publishedTheme.id.replace('gid://shopify/OnlineStoreTheme/', '');

    // Now fetch theme assets using REST API (since GraphQL doesn't expose theme assets)
    const shop = session.shop;
    const accessToken = session.accessToken;

    const assetsUrl = `https://${shop}/admin/api/${SHOPIFY_REST_API_VERSION}/themes/${themeId}/assets.json`;

    const assetsResponse = await fetch(assetsUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken ?? "",
        'Content-Type': 'application/json',
      },
    });

    if (!assetsResponse.ok) {
      const errorText = await assetsResponse.text();
      AppLogger.error("Assets response error:", {
        status: assetsResponse.status,
        statusText: assetsResponse.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch theme assets: ${assetsResponse.status} ${assetsResponse.statusText}`);
    }

    const assetsData = await assetsResponse.json();

    // Filter for product template files returned by the merchant's published theme.
    const templates = assetsData.assets
      .filter((asset: any) => asset.key.startsWith('templates/') &&
        (asset.key.endsWith('.liquid') || asset.key.endsWith('.json')))
      .map((asset: any) => {
        const templateName = asset.key.replace('templates/', '').replace(/\.(liquid|json)$/, '');
        const isJson = asset.key.endsWith('.json');

        return {
          id: templateName,
          title: templateName,
          handle: templateName,
          description: asset.key,
          recommended: templateName === "product",
          bundleRelevant: true,
          fileType: isJson ? 'JSON' : 'Liquid',
          fullKey: asset.key
        };
      })
      .filter((template: any) => {
        return template.handle === "product" || template.handle.startsWith("product.");
      })
      .sort((a: any, b: any) => {
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return a.title.localeCompare(b.title);
      });

    AppLogger.debug(`[TEMPLATE_FILTER] Filtered to ${templates.length} product templates`);

    return json({
      success: true,
      templates,
      themeId,
      themeName: publishedTheme.name,
      bundleContainerCount: 0
    });

  } catch (error) {
    AppLogger.error("Error fetching theme templates:", {}, error as any);
    return json({
      success: false,
      error: "Failed to fetch theme templates"
    });
  }
}

/**
 * Handle getting current theme for deep linking
 */
export async function handleGetCurrentTheme(admin: ShopifyAdmin, _session: Session) {
  const GET_CURRENT_THEME = `
    query getCurrentTheme {
      themes(first: 1, query: "role:main") {
        nodes {
          id
          name
          role
        }
      }
    }
  `;

  const response = await admin.graphql(GET_CURRENT_THEME);
  const data = await response.json();

  if (data.data?.themes?.nodes?.[0]) {
    const theme = data.data.themes.nodes[0];
    return json({
      success: true,
      themeId: theme.id.replace('gid://shopify/Theme/', ''),
      themeName: theme.name
    });
  } else {
    return json({
      success: false,
      error: "Failed to fetch current theme"
    });
  }
}

/**
 * Handle ensuring bundle templates exist
 */
export async function handleEnsureBundleTemplates(admin: ShopifyAdmin, session: Session) {
  try {
    AppLogger.debug("[TEMPLATE_HANDLER] Ensuring bundle templates exist");

    const templateService = new ThemeTemplateService(admin, session);

    // Get all active bundles with container products
    const activeBundles = await db.bundle.findMany({
      where: {
        shopId: session.shop,
        status: BundleStatus.ACTIVE
      },
      select: {
        id: true,
        name: true,
        shopifyProductId: true
      }
    });

    AppLogger.debug(`[TEMPLATE_HANDLER] Found ${activeBundles.length} active bundles`);

    if (activeBundles.length === 0) {
      return json({
        success: true,
        message: "No active bundles found - no templates to create",
        results: []
      });
    }

    // Get product handles from Shopify
    const productIds = activeBundles
      .filter(bundle => bundle.shopifyProductId)
      .map(bundle => bundle.shopifyProductId);

    if (productIds.length === 0) {
      return json({
        success: true,
        message: "No bundle container products found",
        results: []
      });
    }

    const GET_BUNDLE_PRODUCTS = `
      query getBundleContainerProducts($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            handle
            title
            legacyResourceId
          }
        }
      }
    `;

    const response = await admin.graphql(GET_BUNDLE_PRODUCTS, {
      variables: { ids: productIds }
    });
    const data = await response.json();
    const products = data.data?.nodes?.filter((node: any) => node) || [];

    AppLogger.debug(`[TEMPLATE_HANDLER] Found ${products.length} bundle container products`);

    // Create templates for each bundle container product
    const results = [];
    for (const product of products) {
      AppLogger.debug(`[TEMPLATE_HANDLER] Processing product: ${product.title} (${product.handle})`);

      const result = await templateService.ensureProductTemplate(product.handle);
      results.push({
        productId: product.id,
        productHandle: product.handle,
        productTitle: product.title,
        templatePath: result.templatePath,
        created: result.created || false,
        success: result.success,
        error: result.error
      });

      AppLogger.debug(`[TEMPLATE_HANDLER] Product ${product.handle}: ${result.success ? 'SUCCESS' : 'FAILED'} ${result.created ? '(CREATED)' : '(EXISTS)'}`);
    }

    const successCount = results.filter(r => r.success).length;
    const createdCount = results.filter(r => r.created).length;

    AppLogger.debug(`[TEMPLATE_HANDLER] Template creation completed: ${successCount}/${results.length} successful, ${createdCount} created`);

    return json({
      success: true,
      message: `Template creation completed: ${successCount}/${results.length} successful, ${createdCount} new templates created`,
      results,
      summary: {
        totalProducts: products.length,
        successCount,
        createdCount,
        failedCount: results.length - successCount
      }
    });

  } catch (error) {
    AppLogger.error("[TEMPLATE_HANDLER] Error during template creation:", {}, error as any);
    return json({
      success: false,
      error: (error as Error).message || "Template creation failed"
    }, { status: 500 });
  }
}
