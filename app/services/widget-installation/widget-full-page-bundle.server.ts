/**
 * Widget Full-Page Bundle Operations
 *
 * Handles creation and management of full-page bundles.
 * Production-ready, App Store compliant - NO programmatic theme modifications.
 */

import { AppLogger } from "../../lib/logger";
import { WidgetInstallationFlagsService } from "../widget-installation-flags.server";
import type { FullPageBundleResult } from "./types";

/**
 * Create a full-page bundle with production-ready, App Store compliant flow
 *
 * UPDATED FLOW (Single-Click Experience):
 * 1. Creates page with bundle_id metafield immediately
 * 2. Checks if full-page widget is installed in theme
 * 3. If NOT installed: Returns page info + installation link to that specific page
 * 4. If installed: Returns storefront URL where bundle is live
 *
 * This ensures the page exists BEFORE guiding the user to install the widget,
 * eliminating the need for a second "Add to Storefront" click.
 *
 * NO THEME MODIFICATIONS - Fully compliant with Shopify App Store policies.
 *
 * @param admin - Shopify admin API client
 * @param shop - Shop domain
 * @param apiKey - App API key
 * @param bundleId - Bundle ID to associate with page
 * @param bundleName - Bundle name for page title
 * @returns Result with page URL or installation link
 */
export async function createFullPageBundle(
  admin: any,
  shop: string,
  apiKey: string,
  bundleId: string,
  bundleName: string
): Promise<FullPageBundleResult> {
  try {
    AppLogger.info('Creating full-page bundle (single-click mode)', {
      component: 'WidgetFullPageBundle',
      shop,
      bundleId,
      bundleName
    });

    // Step 1: Check if page already exists (prevents duplicate creation if user quits theme editor)
    const pageHandle = `bundle-${bundleId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const pageTitle = bundleName || `Bundle ${bundleId}`;

    // Query for existing page by handle using pages query with filter
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
        bundleId
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

      const pageResponse = await admin.graphql(CREATE_PAGE, {
        variables: {
          page: {
            title: pageTitle,
            handle: pageHandle,
            body: '',
            isPublished: true
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
    }

    // Step 2: Add/update bundle ID as page metafield (metafieldsSet is idempotent)
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

    // Step 3: Check if widget is installed using metafield flags
    // Built for Shopify compliant - no theme file reads required!
    const widgetInstalled = await WidgetInstallationFlagsService.isWidgetInstalled(
      admin,
      shop,
      'full_page'
    );

    const shopDomain = shop.replace('.myshopify.com', '');
    const pageUrl = `https://${shopDomain}.myshopify.com/pages/${pageHandle}`;

    // If widget NOT installed, return page info + installation link to this specific page
    if (!widgetInstalled) {
      const appBlockId = `${apiKey}/bundle-full-page`;

      // Create deep link to theme editor with the actual page preview
      // CRITICAL: Use previewPath to load the actual page (not template preview)
      // This ensures page.metafields[app_namespace].bundle_id is available in Liquid
      const installLink = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?` +
        `previewPath=/pages/${pageHandle}&addAppBlockId=${appBlockId}&target=mainSection`;

      AppLogger.info('Page created, but widget not installed - returning setup link', {
        component: 'WidgetFullPageBundle',
        shop,
        bundleId,
        pageHandle: createdPage.handle,
        installLink
      });

      return {
        success: true,
        pageId: createdPage.id,
        pageHandle: createdPage.handle,
        pageUrl: pageUrl,
        widgetInstallationRequired: true,
        widgetInstallationLink: installLink
      };
    }

    // Step 4: Widget is installed - return success with storefront URL
    AppLogger.info('Full-page bundle created successfully (widget already installed)', {
      component: 'WidgetFullPageBundle',
      shop,
      bundleId,
      pageId: createdPage.id,
      pageHandle: createdPage.handle,
      pageUrl
    });

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
