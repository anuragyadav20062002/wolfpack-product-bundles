/**
 * Widget Full-Page Bundle Operations
 *
 * Handles creation and management of full-page bundles.
 * Creates a Shopify page with a custom template that includes the app block.
 */

import { AppLogger } from "../../lib/logger";
import { ensurePageBundleIdMetafieldDefinition } from "../bundles/metafield-sync.server";
import { ensureBundlePageTemplate } from "./widget-theme-template.server";
import { generateThemeEditorDeepLink } from "./widget-theme-editor-links.server";
import type { FullPageBundleResult } from "./types";

interface ShopSession {
  shop: string;
  accessToken: string | null | undefined;
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
  bundleName: string
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

    const useCustomTemplate = templateResult.success;
    const templateSuffix = useCustomTemplate ? 'full-page-bundle' : undefined;

    // Step 1: Check if page already exists (prevents duplicate creation)
    const pageHandle = `bundle-${bundleId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const pageTitle = bundleName || `Bundle ${bundleId}`;

    const CHECK_PAGE_QUERY = `
      query getPageByHandle($query: String!) {
        pages(first: 1, query: $query) {
          edges {
            node {
              id
              title
              handle
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
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const pageInput: Record<string, any> = {
        title: pageTitle,
        handle: pageHandle,
        body: '',
        isPublished: true
      };

      if (templateSuffix) {
        pageInput.templateSuffix = templateSuffix;
      }

      const pageResponse = await admin.graphql(CREATE_PAGE, {
        variables: { page: pageInput }
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

      // Update existing page to use the custom template if available
      if (templateSuffix) {
        try {
          const UPDATE_PAGE = `
            mutation updatePage($id: ID!, $page: PageUpdateInput!) {
              pageUpdate(id: $id, page: $page) {
                page { id }
                userErrors { field message }
              }
            }
          `;

          await admin.graphql(UPDATE_PAGE, {
            variables: {
              id: createdPage.id,
              page: { templateSuffix }
            }
          });

          AppLogger.info('Updated existing page with template suffix', {
            component: 'WidgetFullPageBundle',
            pageId: createdPage.id,
            templateSuffix
          });
        } catch (err) {
          AppLogger.warn('Failed to update page template suffix (non-critical)', {
            component: 'WidgetFullPageBundle',
          }, err as Error);
        }
      }
    }

    // Step 2a: Ensure PAGE metafield definition exists with PUBLIC_READ storefront access
    await ensurePageBundleIdMetafieldDefinition(admin);

    // Step 2b: Add/update bundle ID as page metafield (metafieldsSet is idempotent)
    const SET_METAFIELD = `
      mutation setPageMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            key
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
        metafields: [{
          ownerId: createdPage.id,
          namespace: '$app',
          key: 'bundle_id',
          value: bundleId,
          type: 'single_line_text_field'
        }]
      }
    });

    const metafieldData = await metafieldResponse.json();

    if (metafieldData.data?.metafieldsSet?.userErrors?.length > 0) {
      AppLogger.warn('Metafield update failed (non-critical)', {
        component: 'WidgetFullPageBundle',
        errors: metafieldData.data.metafieldsSet.userErrors
      });
    } else {
      AppLogger.info('Bundle ID metafield set on page', {
        component: 'WidgetFullPageBundle',
        pageId: createdPage.id,
        bundleId,
        note: 'Metafield created or updated'
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
      templateApplied: useCustomTemplate
    });

    // If template was not created (e.g. fresh install, no block UUID),
    // return a theme editor deep link so the merchant can do a one-time setup
    if (!useCustomTemplate) {
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
        pageUrl: pageUrl,
        widgetInstallationRequired: true,
        widgetInstallationLink: deepLink.url
      };
    }

    return {
      success: true,
      pageId: createdPage.id,
      pageHandle: createdPage.handle,
      pageUrl: pageUrl
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
