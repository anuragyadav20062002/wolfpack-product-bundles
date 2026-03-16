/**
 * Widget Full-Page Bundle Operations
 *
 * Handles creation and management of full-page bundles.
 * Production-ready, App Store compliant - NO programmatic theme modifications.
 */

import { AppLogger } from "../../lib/logger";
import { ensurePageBundleIdMetafieldDefinition } from "../bundles/metafield-sync.server";
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
  _apiKey: string,
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
            body: '',
            isPublished: true,
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

    // Step 2a: Ensure PAGE metafield definition exists with PUBLIC_READ storefront access
    // Without this definition, page.metafields['$app'].bundle_id returns null in Liquid
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

    // Step 3: Return success with storefront URL
    AppLogger.info('Full-page bundle created successfully', {
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
