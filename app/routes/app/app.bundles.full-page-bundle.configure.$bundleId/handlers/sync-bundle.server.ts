import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import db from "../../../../db.server";
import { WidgetInstallationService } from "../../../../services/widget-installation.server";
import { writeBundleConfigPageMetafield } from "../../../../services/widget-installation/widget-full-page-bundle.server";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../../../../services/bundles/metafield-sync.server";
import { calculateBundlePrice } from "../../../../services/bundles/pricing-calculation.server";
import {
  convertBundleToStandardMetafields,
  updateProductStandardMetafields,
} from "../../../../services/bundles/standard-metafields.server";
import { syncThemeColors } from "../../../../services/theme-colors.server";
import {
  buildFullPageBundleMetafieldConfig,
  createProductPageRedirect,
} from "./shared.server";

/**
 * Handle hard-reset sync of a full-page bundle:
 * Deletes the Shopify page and re-creates it, then re-runs all metafield operations
 * from the current DB state. DB child records (steps, pricing) are preserved in place.
 */
export async function handleSyncBundle(admin: ShopifyAdmin, session: Session, bundleId: string) {
  AppLogger.info('[SYNC_BUNDLE] Starting hard-reset sync for full-page bundle', { bundleId, shopId: session.shop });

  try {
    // 1. Load bundle + steps + pricing from DB
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      include: {
        steps: { include: { StepProduct: true, StepCategory: { orderBy: { sortOrder: 'asc' } } }, orderBy: { position: 'asc' } },
        pricing: true,
      },
    });

    if (!bundle) {
      return json({ success: false, error: 'Bundle not found' }, { status: 404 });
    }

    // 2. Delete existing Shopify page (only if one exists — bundles without a page skip
    //    straight to creation, which fixes broken/migrated records in a single sync).
    if (bundle.shopifyPageId) {
      const DELETE_PAGE = `
        mutation DeletePage($id: ID!) {
          pageDelete(id: $id) {
            deletedPageId
            userErrors { field message }
          }
        }
      `;

      const deleteResponse = await admin.graphql(DELETE_PAGE, {
        variables: { id: bundle.shopifyPageId },
      });
      const deleteData = await deleteResponse.json();

      if (deleteData.data?.pageDelete?.userErrors?.length > 0) {
        const err = deleteData.data.pageDelete.userErrors[0];
        return json({ success: false, error: `Failed to delete Shopify page: ${err.message}` }, { status: 400 });
      }

      AppLogger.info('[SYNC_BUNDLE] Shopify page deleted', { bundleId, pageId: bundle.shopifyPageId });

      // 3. Clear page reference from DB so createFullPageBundle will create a fresh page
      await db.bundle.update({
        where: { id: bundleId },
        data: { shopifyPageId: null, shopifyPageHandle: null },
      });
    } else {
      AppLogger.info('[SYNC_BUNDLE] No existing Shopify page — proceeding to create one', { bundleId });
    }

    // 4. Re-create the Shopify page via WidgetInstallationService
    const apiKey = process.env.SHOPIFY_API_KEY || '';
    const result = await WidgetInstallationService.createFullPageBundle(
      admin, session, apiKey, bundleId, bundle.name,
    );

    if (!result.success) {
      AppLogger.error('[SYNC_BUNDLE] Failed to re-create Shopify page', { bundleId }, result.error as any);
      return json({
        success: false,
        error: result.error || 'Failed to re-create Shopify page',
      }, { status: 500 });
    }

    AppLogger.info('[SYNC_BUNDLE] Shopify page re-created', { bundleId, pageId: result.pageId, pageHandle: result.pageHandle });

    // 5. Update DB with new page ID and handle
    await db.bundle.update({
      where: { id: bundleId },
      data: { shopifyPageId: result.pageId, shopifyPageHandle: result.pageHandle },
    });

    // 5b. Write bundle config metafield on the new page (non-fatal)
    await writeBundleConfigPageMetafield(admin, result.pageId ?? null, bundle);

    // 6. Ensure a Shopify product exists — required for Cart Transform MERGE.
    //    If the bundle was created before product auto-creation was added (or the product was
    //    deleted), create one now and wire up the URL redirect.
    let shopifyProductId = bundle.shopifyProductId;
    if (!shopifyProductId) {
      AppLogger.info('[SYNC_BUNDLE] No Shopify product — creating one for Cart Transform MERGE', { bundleId });
      try {
        const bundlePrice = await calculateBundlePrice(admin, bundle);
        const createResponse = await admin.graphql(`
          mutation CreateBundleProduct($input: ProductInput!) {
            productCreate(input: $input) {
              product {
                id handle
                variants(first: 1) { edges { node { id } } }
              }
              userErrors { field message }
            }
          }
        `, {
          variables: {
            input: {
              title: bundle.name,
              handle: `bundle-${bundle.id}`,
              productType: 'Bundle',
              vendor: 'Bundle Builder',
              status: 'DRAFT',
              descriptionHtml: bundle.description || `${bundle.name} - Bundle Product`,
              tags: ['WP-Bundles'],
            },
          },
        });
        const createData = await createResponse.json() as { data?: Record<string, any> };
        const productErrors = createData.data?.productCreate?.userErrors ?? [];
        if (productErrors.length > 0) {
          AppLogger.error('[SYNC_BUNDLE] Failed to create Shopify product', { bundleId }, productErrors);
        } else {
          shopifyProductId = createData.data?.productCreate?.product?.id ?? null;
          if (shopifyProductId) {
            // Set price and inventory policy on the auto-created default variant
            // (productVariantUpdate removed in API 2025-10, use productVariantsBulkUpdate)
            const defaultVariantId = createData.data?.productCreate?.product?.variants?.edges?.[0]?.node?.id;
            if (defaultVariantId && shopifyProductId) {
              await admin.graphql(`
                mutation UpdateBundleVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
                  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
                    productVariants { id price }
                    userErrors { field message }
                  }
                }
              `, {
                variables: {
                  productId: shopifyProductId,
                  variants: [{
                    id: defaultVariantId,
                    price: bundlePrice,
                    inventoryPolicy: 'CONTINUE'
                  }]
                }
              });
            }
            await db.bundle.update({ where: { id: bundleId }, data: { shopifyProductId, shopifyProductHandle: `bundle-${bundleId}` } });
            // Create URL redirect /products/{handle} → /pages/{pageHandle} (non-fatal)
            if (result.pageHandle) {
              createProductPageRedirect(admin, shopifyProductId, result.pageHandle).catch(() => {});
            }
            AppLogger.info('[SYNC_BUNDLE] Created Shopify product for bundle', { bundleId, shopifyProductId });
          }
        }
      } catch (createError) {
        AppLogger.error('[SYNC_BUNDLE] Exception creating Shopify product (non-fatal)', { bundleId }, createError as Error);
      }
    }

    // 7. Re-run metafield operations from DB-authoritative state (if shopifyProductId exists)
    if (shopifyProductId) {
      const bundleConfig = buildFullPageBundleMetafieldConfig({
        ...bundle,
        shopifyPageHandle: result.pageHandle,
      });

      AppLogger.info('[SYNC_BUNDLE] Re-running metafield operations', { bundleId, shopifyProductId });

      const [standardResult, componentResult, variantResult] = await Promise.allSettled([
        (async () => {
          const { metafields: standardMetafields } = await convertBundleToStandardMetafields(admin, bundleConfig);
          if (Object.keys(standardMetafields).length > 0) {
            await updateProductStandardMetafields(admin, shopifyProductId, standardMetafields);
          }
        })(),
        updateComponentProductMetafields(admin, shopifyProductId, bundleConfig),
        updateBundleProductMetafields(admin, shopifyProductId, bundleConfig),
      ]);

      if (standardResult.status === 'rejected') {
        AppLogger.warn('[SYNC_BUNDLE] Standard metafields update failed (non-critical)', { bundleId }, standardResult.reason);
      }
      if (componentResult.status === 'rejected') {
        throw new Error(`Failed to update component metafields: ${componentResult.reason}`);
      }
      if (variantResult.status === 'rejected') {
        throw new Error(`Failed to update bundle variant metafields: ${variantResult.reason}`);
      }

      AppLogger.info('[SYNC_BUNDLE] All metafields re-synced successfully', { bundleId });
    }

    // Sync theme colors for bundle widget color inheritance (non-critical, silent fail)
    syncThemeColors(admin, session.shop).catch(() => { /* swallowed — syncThemeColors handles logging */ });

    // Return embed activation link — merchant needs to activate the single app embed
    // once in Theme Settings > App Embeds. After that all bundle surfaces can render.
    const shopDomain = session.shop.replace('.myshopify.com', '');
    const widgetInstallationLink = apiKey
      ? `https://${shopDomain}.myshopify.com/admin/themes/current/editor?context=apps&activateAppId=${apiKey}/bundle-app-embed`
      : undefined;

    return json({
      success: true,
      synced: true,
      message: 'Bundle synced successfully',
      widgetInstallationRequired: true,
      widgetInstallationLink,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    AppLogger.error('[SYNC_BUNDLE] Error during sync:', { bundleId }, error as any);
    return json({ success: false, error: `Sync failed: ${message}` }, { status: 500 });
  }
}

