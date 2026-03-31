/**
 * Widget Full-Page Bundle Operations
 *
 * Handles creation and management of full-page bundles.
 * Creates a Shopify page with a custom template that includes the app block.
 */

import { AppLogger } from "../../lib/logger";
import { ensurePageBundleIdMetafieldDefinition, ensureCustomPageBundleIdDefinition, ensureCustomPageBundleConfigDefinition } from "../bundles/metafield-sync.server";
import { formatBundleForWidget } from "../../lib/bundle-formatter.server";
import { ensureBundlePageTemplate } from "./widget-theme-template.server";
import { generateThemeEditorDeepLink } from "./widget-theme-editor-links.server";
import { slugify, resolveUniqueHandle } from "../../lib/slug-utils";
import type { FullPageBundleResult } from "./types";

interface ShopSession {
  shop: string;
  accessToken?: string | null;
}

/**
 * Create a full-page bundle with automated template setup
 *
 * Flow:
 * 1. Ensures page.full-page-bundle.json template exists in the active theme
 * 2. Creates page with bundle_id metafield and templateSuffix
 * 3. Returns storefront URL where bundle is live
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

    // Step 0: Ensure the bundle page template exists in the active theme
    const templateResult = await ensureBundlePageTemplate(admin, session, apiKey);

    if (!templateResult.success) {
      AppLogger.warn('Could not ensure bundle page template (non-fatal)', {
        component: 'WidgetFullPageBundle',
        error: templateResult.error
      });
    }

    // Always attach the templateSuffix regardless of whether the template file was
    // just created or already existed. The suffix tells Shopify to serve this page
    // using templates/page.full-page-bundle.json. Even if that template write failed
    // above (unlikely now that UUID comes from EXTENSION_UID), the suffix ensures
    // the page uses the right template as soon as the file exists in the theme.
    const templateSuffix = 'full-page-bundle';

    // Step 1: Resolve page handle — use desiredSlug, fall back to slugified bundle name
    const rawSlug = desiredSlug?.trim() || slugify(bundleName) || `bundle-${bundleId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const { handle: pageHandle, adjusted: slugAdjusted } = await resolveUniqueHandle(admin, rawSlug);
    const pageTitle = bundleName || `Bundle ${bundleId}`;

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
    let shareablePreviewUrl: string | undefined;

    // If page doesn't exist, create it
    if (!createdPage) {
      AppLogger.info('Page does not exist, creating new page', {
        component: 'WidgetFullPageBundle',
        pageHandle,
        bundleId,
        templateSuffix: templateSuffix ?? 'default'
      });

      const CREATE_PAGE = `
        mutation createPage($page: PageCreateInput!) {
          pageCreate(page: $page) {
            page {
              id
              title
              handle
              templateSuffix
              shareablePreviewUrl
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
            body: '',
            isPublished,
            templateSuffix: 'full-page-bundle'
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

      shareablePreviewUrl = pageData.data?.pageCreate?.page?.shareablePreviewUrl ?? undefined;

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
        templateSuffix: createdPage.templateSuffix,
        bundleId
      });

      // Ensure existing page uses the shared full-page-bundle template
      if (createdPage.templateSuffix !== 'full-page-bundle') {
        const UPDATE_PAGE_TEMPLATE = `
          mutation updatePageTemplate($id: ID!, $page: PageUpdateInput!) {
            pageUpdate(id: $id, page: $page) {
              page { id templateSuffix }
              userErrors { field message }
            }
          }
        `;
        const updateResponse = await admin.graphql(UPDATE_PAGE_TEMPLATE, {
          variables: { id: createdPage.id, page: { templateSuffix: 'full-page-bundle' } }
        });
        const updateData = await updateResponse.json();
        if (updateData.data?.pageUpdate?.userErrors?.length > 0) {
          AppLogger.warn('Could not update templateSuffix on existing page (non-critical)', {
            component: 'WidgetFullPageBundle',
            errors: updateData.data.pageUpdate.userErrors
          });
        } else {
          AppLogger.info('Updated existing page templateSuffix to full-page-bundle', {
            component: 'WidgetFullPageBundle',
            pageId: createdPage.id
          });
        }
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
    const pageUrl = `https://${shopDomain}.myshopify.com/pages/${pageHandle}`;

    AppLogger.info('Full-page bundle created successfully', {
      component: 'WidgetFullPageBundle',
      shop,
      bundleId,
      pageId: createdPage.id,
      pageHandle: createdPage.handle,
      pageUrl,
      templateApplied: templateResult.success
    });

    // If template file write failed (e.g. theme API error), surface a deep link
    // so the merchant can manually add the block via Theme Editor as a fallback.
    if (!templateResult.success) {
      const deepLink = generateThemeEditorDeepLink(
        shop,
        apiKey,
        'bundle-full-page',
        bundleId,
        'page',
        'newAppsSection'
      );

      return {
        success: true,
        pageId: createdPage.id,
        pageHandle: createdPage.handle,
        pageUrl: isPublished ? pageUrl : undefined,
        shareablePreviewUrl: !isPublished ? shareablePreviewUrl : undefined,
        slugAdjusted,
        widgetInstallationRequired: true,
        widgetInstallationLink: deepLink.url
      };
    }

    return {
      success: true,
      pageId: createdPage.id,
      pageHandle: createdPage.handle,
      pageUrl: isPublished ? pageUrl : undefined,
      shareablePreviewUrl: !isPublished ? shareablePreviewUrl : undefined,
      slugAdjusted
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
    const { handle: resolvedHandle, adjusted } = await resolveUniqueHandle(admin, desiredSlug, currentSlug);

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
        desiredSlug,
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
 * Write the full bundle config as a `custom:bundle_config` JSON metafield on a Shopify page.
 *
 * This caches the bundle config so the FPB Liquid template can inject it as `data-bundle-config`
 * on the widget container, eliminating the app proxy call for first-paint.
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
  pageId: string
): Promise<{ success: boolean; error?: string }> {
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
    const response = await admin.graphql(PUBLISH_PAGE, {
      variables: { id: pageId, page: { isPublished: true } },
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
    return { success: true };
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
  pageId: string
): Promise<{ success: boolean; shareablePreviewUrl?: string; pageNotFound?: boolean; error?: string }> {
  const GET_PREVIEW_URL = `
    query getPagePreviewUrl($id: ID!) {
      page(id: $id) {
        id
        shareablePreviewUrl
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

    return { success: true, shareablePreviewUrl: page.shareablePreviewUrl };
  } catch (error) {
    AppLogger.error('getPreviewPageUrl: unexpected error', {
      component: 'WidgetFullPageBundle',
      pageId,
    }, error as Error);
    return { success: false, error: (error as Error).message };
  }
}
