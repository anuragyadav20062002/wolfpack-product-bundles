/**
 * Widget Full-Page Bundle Operations
 *
 * Handles creation and management of full-page bundles.
 * Creates a Shopify page linked to the full-page bundle app block.
 */

import { AppLogger } from "../../lib/logger";
import { ensurePageBundleIdMetafieldDefinition, ensureCustomPageBundleIdDefinition } from "../bundles/metafield-sync.server";
import { formatBundleForWidget } from "../../lib/bundle-formatter.server";
import { generateThemeEditorDeepLink } from "./widget-theme-editor-links.server";
import { slugify, resolveUniqueHandle } from "../../lib/slug-utils";
import type { FullPageBundleResult } from "./types";

interface ShopSession {
  shop: string;
  accessToken?: string | null;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type BundleBootstrapHint = {
  bundleDesignTemplate?: unknown;
  bundleDesignPresetId?: unknown;
  updatedAt?: unknown;
};

function buildBundleConfigBootstrap(bundleId: string, bundle?: BundleBootstrapHint): object {
  const bundleDesignTemplate =
    typeof bundle?.bundleDesignTemplate === "string" && bundle.bundleDesignTemplate.trim() !== ""
      ? bundle.bundleDesignTemplate.trim()
      : "FBP_SIDE_FOOTER";
  const bundleDesignPresetId =
    typeof bundle?.bundleDesignPresetId === "string" && bundle.bundleDesignPresetId.trim() !== ""
      ? bundle.bundleDesignPresetId.trim().toUpperCase()
      : "STANDARD";
  const base = {
    v: 2,
    type: "full_page",
    bundleType: "full_page",
    id: bundleId,
    bundleDesignTemplate,
    bundleDesignPresetId,
  };

  if (bundle?.updatedAt) {
    return { ...base, updatedAt: String(bundle.updatedAt) };
  }

  return base;
}

function buildFullPageBundleBodyHtml(bundleId: string, shop: string, bundle?: any): string {
  const escapedBundleId = escapeHtmlAttribute(bundleId);
  const escapedShop = escapeHtmlAttribute(shop);
  const bundleConfigPayload = buildBundleConfigBootstrap(bundleId, bundle as BundleBootstrapHint | undefined) as {
    bundleDesignTemplate: string;
    bundleDesignPresetId: string;
  };
  const bundleConfig = JSON.stringify(bundleConfigPayload);
  const bundleSettings = bundle ? JSON.stringify(buildBundleSettings(bundle)) : "null";
  const escapedTemplate = escapeHtmlAttribute(bundleConfigPayload.bundleDesignTemplate);
  const escapedPreset = escapeHtmlAttribute(bundleConfigPayload.bundleDesignPresetId);

  return `
<div
  data-wpb-full-page-bundle
  data-bundle-id="${escapedBundleId}"
  data-bundle-type="full_page"
  data-fpb-template-type="${escapedTemplate}"
  data-fpb-design-preset="${escapedPreset}"
  data-bundle-config="${escapeHtmlAttribute(bundleConfig)}"
  data-bundle-settings="${escapeHtmlAttribute(bundleSettings)}"
  data-shop="${escapedShop}"
  hidden></div>
`.trim();
}

async function updateFullPageBundlePageBody(admin: any, pageId: string, body: string): Promise<{ success: boolean; error?: string }> {
  const UPDATE_PAGE_BODY = `
    mutation updateFullPageBundlePageBody($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page {
          id
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(UPDATE_PAGE_BODY, {
    variables: { id: pageId, page: { body } },
  });
  const data = await response.json();
  const userErrors = data.data?.pageUpdate?.userErrors ?? [];

  if (userErrors.length > 0) {
    return { success: false, error: userErrors[0].message };
  }

  return { success: true };
}

export async function refreshFullPageBundlePageBody(
  admin: any,
  pageId: string,
  bundleId: string,
  shop: string,
  bundle?: any
): Promise<{ success: boolean; error?: string }> {
  return updateFullPageBundlePageBody(admin, pageId, buildFullPageBundleBodyHtml(bundleId, shop, bundle));
}

/**
 * Create a full-page bundle with automated template setup
 *
 * Flow:
 * 1. Creates or reuses a Shopify page
 * 2. Writes a bundle marker into the page body; the app embed hydrates it unless a full-page app block is already present
 * 3. Sets bundle_id metafields and returns the Shopify page URL
 *
 * @param admin - Shopify admin API client
 * @param session - Shop session with domain and access token
 * @param apiKey - App API key
 * @param bundleId - Bundle ID to associate with page
 * @param bundleName - Bundle name for page title
 * @returns Result with page URL
 */
export async function createFullPageBundle(
  admin: any,
  session: ShopSession,
  apiKey: string,
  bundleId: string,
  bundleName: string,
  desiredSlug?: string,
  isPublished = true
): Promise<FullPageBundleResult> {
  const shop = session.shop;

  try {
    AppLogger.info('Creating full-page bundle', {
      component: 'WidgetFullPageBundle',
      shop,
      bundleId,
      bundleName
    });

    // Pages use the default page template so the store theme header/footer remain intact.
    // A hidden marker is written into the page body so the app embed can hydrate
    // the widget inside normal page content when the dedicated app block is absent.

    // Step 1: Resolve page handle — use desiredSlug, fall back to slugified bundle name
    const rawSlug = slugify(desiredSlug ?? '') || slugify(bundleName) || `bundle-${bundleId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const { handle: pageHandle, adjusted: slugAdjusted } = await resolveUniqueHandle(admin, rawSlug);
    const pageTitle = bundleName || `Bundle ${bundleId}`;
    const pageBodyHtml = buildFullPageBundleBodyHtml(bundleId, shop);

    const CHECK_PAGE_QUERY = `
      query getPageByHandle($query: String!) {
        pages(first: 1, query: $query) {
          edges {
            node {
              id
              title
              handle
              templateSuffix
            }
          }
        }
      }
    `;

    const checkResponse = await admin.graphql(CHECK_PAGE_QUERY, {
      variables: { query: `handle:${pageHandle}` }
    });

    const checkData = await checkResponse.json();
    let createdPage = checkData.data?.pages?.edges?.[0]?.node || null;

    // If page doesn't exist, create it
    if (!createdPage) {
      AppLogger.info('Page does not exist, creating new page', {
        component: 'WidgetFullPageBundle',
        pageHandle,
        bundleId
      });

      const CREATE_PAGE = `
        mutation createPage($page: PageCreateInput!) {
          pageCreate(page: $page) {
            page {
              id
              title
              handle
              templateSuffix
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const pageResponse = await admin.graphql(CREATE_PAGE, {
        variables: {
          page: {
            title: pageTitle,
            handle: pageHandle,
            body: pageBodyHtml,
            isPublished
          }
        }
      });

      const pageData = await pageResponse.json();

      if (pageData.data?.pageCreate?.userErrors?.length > 0) {
        const errors = pageData.data.pageCreate.userErrors;
        AppLogger.error('Page creation failed', {
          component: 'WidgetFullPageBundle',
          errors
        });
        return {
          success: false,
          error: `Failed to create page: ${errors[0].message}`,
          errorType: 'page_creation_failed'
        };
      }

      createdPage = pageData.data?.pageCreate?.page;

      if (!createdPage) {
        return {
          success: false,
          error: 'Page creation failed - no page returned',
          errorType: 'page_creation_failed'
        };
      }

      AppLogger.info('Page created successfully', {
        component: 'WidgetFullPageBundle',
        pageId: createdPage.id,
        pageHandle: createdPage.handle
      });
    } else {
      AppLogger.info('Page already exists, reusing existing page', {
        component: 'WidgetFullPageBundle',
        pageId: createdPage.id,
        pageHandle: createdPage.handle,
        bundleId
      });

      const bodyUpdate = await updateFullPageBundlePageBody(admin, createdPage.id, pageBodyHtml);
      if (!bodyUpdate.success) {
        return {
          success: false,
          error: `Failed to update page body: ${bodyUpdate.error}`,
          errorType: 'page_creation_failed'
        };
      }
    }

    // Step 2a: Ensure PAGE metafield definitions exist with PUBLIC_READ storefront access
    await ensurePageBundleIdMetafieldDefinition(admin);
    await ensureCustomPageBundleIdDefinition(admin);

    // Step 2b: Set bundle ID on both custom and $app namespaces
    // custom:bundle_id — PRIMARY: Liquid reads it as page.metafields.custom.bundle_id (reliable)
    // $app:bundle_id   — LEGACY: kept for backwards compatibility
    const SET_METAFIELD = `
      mutation setPageMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            key
            namespace
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const metafieldResponse = await admin.graphql(SET_METAFIELD, {
      variables: {
        metafields: [
          {
            ownerId: createdPage.id,
            namespace: 'custom',
            key: 'bundle_id',
            value: bundleId,
            type: 'single_line_text_field'
          },
          {
            ownerId: createdPage.id,
            namespace: '$app',
            key: 'bundle_id',
            value: bundleId,
            type: 'single_line_text_field'
          }
        ]
      }
    });

    const metafieldData = await metafieldResponse.json();

    if (metafieldData.data?.metafieldsSet?.userErrors?.length > 0) {
      AppLogger.warn('Metafield update had errors', {
        component: 'WidgetFullPageBundle',
        errors: metafieldData.data.metafieldsSet.userErrors
      });
    } else {
      AppLogger.info('Bundle ID metafields set on page (custom + $app)', {
        component: 'WidgetFullPageBundle',
        pageId: createdPage.id,
        bundleId
      });
    }

    const shopDomain = shop.replace('.myshopify.com', '');
    const pageUrl = `https://${shopDomain}.myshopify.com/pages/${createdPage.handle}`;

    // Return embed activation deep link — directs merchant to Theme Settings > App Embeds
    // to activate the single app embed (one-time per store).
    const widgetInstallationLink = apiKey
      ? generateThemeEditorDeepLink(
          shop,
          apiKey,
          "bundle-full-page",
          bundleId,
          "page",
          "newAppsSection",
          `/pages/${createdPage.handle}`,
        ).url
      : undefined;

    AppLogger.info('Full-page bundle created successfully', {
      component: 'WidgetFullPageBundle',
      shop,
      bundleId,
      pageId: createdPage.id,
      pageHandle: createdPage.handle,
      pageUrl,
    });

    return {
      success: true,
      pageId: createdPage.id,
      pageHandle: createdPage.handle,
      pageUrl,
      slugAdjusted,
      widgetInstallationRequired: true,
      widgetInstallationLink,
    };

  } catch (error) {
    AppLogger.error('Failed to create full-page bundle', {
      component: 'WidgetFullPageBundle',
      shop,
      bundleId
    }, error);

    return {
      success: false,
      error: `Failed to create page: ${(error as Error).message}`,
      errorType: 'unknown'
    };
  }
}

/**
 * Renames an existing Shopify page handle.
 *
 * Resolves uniqueness (skipping the page's own current handle) before calling pageUpdate.
 *
 * @param admin - Shopify Admin API client
 * @param pageId - GID of the Shopify page to rename
 * @param desiredSlug - New handle the merchant wants
 * @param currentSlug - The page's current handle (to skip self in uniqueness check)
 */
export async function renamePageHandle(
  admin: any,
  pageId: string,
  desiredSlug: string,
  currentSlug: string
): Promise<{ success: boolean; newHandle?: string; adjusted?: boolean; error?: string }> {
  try {
    const normalizedSlug = slugify(desiredSlug);
    const { handle: resolvedHandle, adjusted } = await resolveUniqueHandle(admin, normalizedSlug, currentSlug);

    const UPDATE_PAGE_HANDLE = `
      mutation updatePageHandle($id: ID!, $page: PageUpdateInput!) {
        pageUpdate(id: $id, page: $page) {
          page {
            id
            handle
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(UPDATE_PAGE_HANDLE, {
      variables: { id: pageId, page: { handle: resolvedHandle } }
    });
    const data = await response.json();

    if (data?.data?.pageUpdate?.userErrors?.length > 0) {
      const errors = data.data.pageUpdate.userErrors;
      AppLogger.error('renamePageHandle: pageUpdate returned userErrors', {
        component: 'WidgetFullPageBundle',
        pageId,
        desiredSlug: normalizedSlug,
        errors
      });
      return { success: false, error: errors[0].message };
    }

    const newHandle = data?.data?.pageUpdate?.page?.handle ?? resolvedHandle;
    AppLogger.info('renamePageHandle: page handle updated', {
      component: 'WidgetFullPageBundle',
      pageId,
      oldHandle: currentSlug,
      newHandle
    });
    return { success: true, newHandle, adjusted };

  } catch (error) {
    AppLogger.error('renamePageHandle: unexpected error', {
      component: 'WidgetFullPageBundle',
      pageId
    }, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Extract the display settings from a raw Prisma bundle for the bundle_settings metafield.
 * These fields are intentionally kept out of bundle_config to allow lightweight display-only writes.
 */
function buildBundleSettings(bundle: any) {
  return {
    promoBannerBgImage: bundle.promoBannerBgImage ?? null,
    bundleBannerDesktopUrl: bundle.bundleBannerDesktopUrl ?? null,
    bundleBannerMobileUrl: bundle.bundleBannerMobileUrl ?? null,
    loadingGif: bundle.loadingGif ?? null,
    showStepTimeline: bundle.showStepTimeline ?? null,
    floatingBadgeEnabled: bundle.floatingBadgeEnabled ?? false,
    floatingBadgeText: bundle.floatingBadgeText ?? '',
    tierConfig: bundle.tierConfig ?? null,
  };
}

/**
 * Write the full bundle config as a `custom:bundle_config` JSON metafield on a Shopify page.
 *
 * This caches the bundle config so the FPB Liquid template can inject it as `data-bundle-config`
 * on the widget container, eliminating the app proxy call for first-paint.
 * Also atomically writes `custom:bundle_settings` for the display settings.
 *
 * Non-fatal: errors are logged but never thrown — a missing metafield means the widget falls
 * back to the proxy API, which is still functional.
 *
 * @param admin  - Shopify Admin API client
 * @param pageId - GID of the Shopify page (e.g. "gid://shopify/Page/123"). Skipped if null/undefined.
 * @param bundle - Raw Prisma bundle with steps + StepProduct + pricing included
 */
export async function writeBundleConfigPageMetafield(
  admin: any,
  pageId: string | null | undefined,
  bundle: any
): Promise<void> {
  if (!pageId) return;

  try {
    const formattedBundle = formatBundleForWidget(bundle);
    const configJson = JSON.stringify(formattedBundle);
    const settingsJson = JSON.stringify(buildBundleSettings(bundle));

    const SET_METAFIELD = `
      mutation SetBundleConfigMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id key }
          userErrors { field message }
        }
      }
    `;

    const response = await admin.graphql(SET_METAFIELD, {
      variables: {
        metafields: [
          {
            ownerId: pageId,
            namespace: "custom",
            key: "bundle_config",
            value: configJson,
            type: "json",
          },
          {
            ownerId: pageId,
            namespace: "custom",
            key: "bundle_settings",
            value: settingsJson,
            type: "json",
          },
        ],
      },
    });

    const data = await response.json();
    const userErrors = data.data?.metafieldsSet?.userErrors ?? [];

    if (userErrors.length > 0) {
      AppLogger.warn("Failed to write bundle_config metafield on page (non-fatal)", {
        component: "WidgetFullPageBundle",
        pageId,
        errors: userErrors,
      }, userErrors[0]);
    } else {
      AppLogger.info("bundle_config metafield written on page", {
        component: "WidgetFullPageBundle",
        pageId,
        bundleId: bundle.id,
      });
    }
  } catch (error) {
    AppLogger.error("Error writing bundle_config metafield on page (non-fatal)", {
      component: "WidgetFullPageBundle",
      pageId,
      bundleId: bundle?.id,
    }, error as Error);
  }
}

/**
 * Promote a draft Shopify page to published.
 *
 * Used when the merchant clicks "Add to Storefront" after previewing their bundle
 * via a draft page. Calls pageUpdate with isPublished: true.
 *
 * @param admin  - Shopify Admin API client
 * @param pageId - GID of the draft page (e.g. "gid://shopify/Page/123")
 */
export async function publishPreviewPage(
  admin: any,
  pageId: string,
  bundleId?: string,
  shopDomain?: string,
  publishOptions?: {
    title?: string;
    desiredSlug?: string;
    currentHandle?: string;
  },
): Promise<{ success: boolean; newHandle?: string; adjusted?: boolean; error?: string }> {
  const PUBLISH_PAGE = `
    mutation publishPage($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page {
          id
          handle
          isPublished
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    if (bundleId && shopDomain) {
      const bodyUpdate = await updateFullPageBundlePageBody(
        admin,
        pageId,
        buildFullPageBundleBodyHtml(bundleId, shopDomain),
      );
      if (!bodyUpdate.success) {
        return { success: false, error: bodyUpdate.error };
      }
    }

    const pageInput: { isPublished: boolean; title?: string; handle?: string } = {
      isPublished: true,
    };
    const title = publishOptions?.title?.trim();
    if (title) {
      pageInput.title = title;
    }

    let resolvedHandle: string | undefined;
    let adjusted = false;
    const desiredHandle = slugify(publishOptions?.desiredSlug ?? title ?? "");
    if (desiredHandle) {
      const resolved = await resolveUniqueHandle(
        admin,
        desiredHandle,
        publishOptions?.currentHandle,
      );
      resolvedHandle = resolved.handle;
      adjusted = resolved.adjusted;
      pageInput.handle = resolvedHandle;
    }

    const response = await admin.graphql(PUBLISH_PAGE, {
      variables: { id: pageId, page: pageInput },
    });
    const data = await response.json();
    const userErrors = data.data?.pageUpdate?.userErrors ?? [];

    if (userErrors.length > 0) {
      AppLogger.error('publishPreviewPage: pageUpdate returned userErrors', {
        component: 'WidgetFullPageBundle',
        pageId,
        errors: userErrors,
      });
      return { success: false, error: userErrors[0].message };
    }

    AppLogger.info('publishPreviewPage: draft page promoted to published', {
      component: 'WidgetFullPageBundle',
      pageId,
    });
    const newHandle = data.data?.pageUpdate?.page?.handle ?? resolvedHandle;
    return { success: true, newHandle, adjusted };
  } catch (error) {
    AppLogger.error('publishPreviewPage: unexpected error', {
      component: 'WidgetFullPageBundle',
      pageId,
    }, error as Error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Retrieve the shareablePreviewUrl for an existing draft page.
 *
 * Used on subsequent "Preview" clicks when a draft page already exists
 * (stored as shopifyPreviewPageId on the bundle). Returns pageNotFound:true
 * if the page has been deleted externally.
 *
 * @param admin  - Shopify Admin API client
 * @param pageId - GID of the draft page
 */
export async function getPreviewPageUrl(
  admin: any,
  pageId: string,
  shopDomain: string,
  bundleId?: string
): Promise<{ success: boolean; previewUrl?: string; pageNotFound?: boolean; error?: string }> {
  const GET_PREVIEW_URL = `
    query getPagePreviewUrl($id: ID!) {
      page(id: $id) {
        id
        handle
      }
    }
  `;

  try {
    const response = await admin.graphql(GET_PREVIEW_URL, {
      variables: { id: pageId },
    });
    const data = await response.json();
    const page = data.data?.page;

    if (!page) {
      AppLogger.warn('getPreviewPageUrl: page not found (may have been deleted)', {
        component: 'WidgetFullPageBundle',
        pageId,
      });
      return { success: false, pageNotFound: true };
    }

    if (bundleId) {
      const bodyUpdate = await updateFullPageBundlePageBody(
        admin,
        pageId,
        buildFullPageBundleBodyHtml(bundleId, shopDomain),
      );
      if (!bodyUpdate.success) {
        AppLogger.warn('getPreviewPageUrl: failed to refresh preview page body', {
          component: 'WidgetFullPageBundle',
          pageId,
          bundleId,
          error: bodyUpdate.error,
        });
      }
    }

    const shop = shopDomain.replace('.myshopify.com', '');
    return { success: true, previewUrl: `https://${shop}.myshopify.com/pages/${page.handle}` };
  } catch (error) {
    AppLogger.error('getPreviewPageUrl: unexpected error', {
      component: 'WidgetFullPageBundle',
      pageId,
    }, error as Error);
    return { success: false, error: (error as Error).message };
  }
}
