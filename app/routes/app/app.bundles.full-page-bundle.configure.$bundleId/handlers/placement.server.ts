import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import db from "../../../../db.server";
import { WidgetInstallationService } from "../../../../services/widget-installation.server";
import {
  renamePageHandle,
  writeBundleConfigPageMetafield,
  publishPreviewPage,
  refreshFullPageBundlePageBody,
} from "../../../../services/widget-installation/widget-full-page-bundle.server";
import { updateBundleProductMetafields } from "../../../../services/bundles/metafield-sync.server";
import { BundleStatus } from "../../../../constants/bundle";
import { ERROR_MESSAGES } from "../../../../constants/errors";
import {
  buildFullPageBundleMetafieldConfig,
  createProductPageRedirect,
} from "./shared.server";
import { syncFpbProductStatus } from "./product-status.server";

/**
 * Handle widget placement validation with automated page creation
 */
export async function handleValidateWidgetPlacement(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  desiredSlug?: string,
) {
  try {
    AppLogger.debug(
      "[WIDGET_PLACEMENT] Validating widget placement (single-click flow)",
      { bundleId },
    );

    // Load full bundle (steps + products + pricing) needed for the metafield config cache
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      include: {
        steps: {
          include: {
            StepProduct: true,
            StepCategory: { orderBy: { sortOrder: "asc" } },
          },
          orderBy: { position: "asc" },
        },
        pricing: true,
      },
    });

    if (!bundle) {
      return json(
        {
          success: false,
          error: ERROR_MESSAGES.BUNDLE_NOT_FOUND,
        },
        { status: 404 },
      );
    }

    // If a draft preview page exists, promote it to published instead of creating a new page.
    // This prevents duplicate Shopify pages when the merchant previewed before publishing.
    if (bundle.shopifyPreviewPageId) {
      await refreshFullPageBundlePageBody(
        admin,
        bundle.shopifyPreviewPageId,
        bundle.id,
        session.shop,
        bundle,
      );
      await writeBundleConfigPageMetafield(
        admin,
        bundle.shopifyPreviewPageId,
        bundle,
      );

      const publishResult = await publishPreviewPage(
        admin,
        bundle.shopifyPreviewPageId,
        bundleId,
        session.shop,
      );

      if (publishResult.success) {
        await db.bundle.update({
          where: { id: bundleId, shopId: session.shop },
          data: {
            shopifyPageHandle: bundle.shopifyPreviewPageHandle,
            shopifyPageId: bundle.shopifyPreviewPageId,
            shopifyPreviewPageId: null,
            shopifyPreviewPageHandle: null,
            status: BundleStatus.ACTIVE,
          },
        });

        await refreshFullPageBundlePageBody(
          admin,
          bundle.shopifyPreviewPageId,
          bundle.id,
          session.shop,
          {
            ...bundle,
            shopifyPageHandle: bundle.shopifyPreviewPageHandle,
            shopifyPageId: bundle.shopifyPreviewPageId,
            status: BundleStatus.ACTIVE,
          },
        );
        await writeBundleConfigPageMetafield(
          admin,
          bundle.shopifyPreviewPageId,
          {
            ...bundle,
            shopifyPageHandle: bundle.shopifyPreviewPageHandle,
            shopifyPageId: bundle.shopifyPreviewPageId,
            status: BundleStatus.ACTIVE,
          },
        );

        // Create URL redirect so /products/{handle} → /pages/{pageHandle} at routing level
        if (bundle.shopifyProductId && bundle.shopifyPreviewPageHandle) {
          createProductPageRedirect(
            admin,
            bundle.shopifyProductId,
            bundle.shopifyPreviewPageHandle,
          ).catch(() => {});
        }

        AppLogger.info(
          "[WIDGET_PLACEMENT] Draft preview page promoted to published",
          {
            bundleId,
            pageId: bundle.shopifyPreviewPageId,
            pageHandle: bundle.shopifyPreviewPageHandle,
          },
        );

        return json({
          success: true,
          pageHandle: bundle.shopifyPreviewPageHandle,
          pageId: bundle.shopifyPreviewPageId,
          pageUrl: `https://${session.shop.replace(".myshopify.com", "")}.myshopify.com/pages/${bundle.shopifyPreviewPageHandle}`,
          slugAdjusted: false,
          message: `Bundle page published successfully!`,
        });
      }

      // Promotion failed (page deleted externally) — clear stale preview refs and fall through
      AppLogger.warn(
        "[WIDGET_PLACEMENT] Failed to promote draft preview page, falling back to create",
        {
          bundleId,
          previewPageId: bundle.shopifyPreviewPageId,
          error: publishResult.error,
        },
      );
      await db.bundle.update({
        where: { id: bundleId, shopId: session.shop },
        data: { shopifyPreviewPageId: null, shopifyPreviewPageHandle: null },
      });
    }

    if (bundle.shopifyPageId && bundle.shopifyPageHandle) {
      const publishedBundle = {
        ...bundle,
        status: BundleStatus.ACTIVE,
      };

      await refreshFullPageBundlePageBody(
        admin,
        bundle.shopifyPageId,
        bundle.id,
        session.shop,
        publishedBundle,
      );
      await writeBundleConfigPageMetafield(
        admin,
        bundle.shopifyPageId,
        publishedBundle,
      );

      const pageUrl = `https://${session.shop.replace(".myshopify.com", "")}.myshopify.com/pages/${bundle.shopifyPageHandle}`;

      AppLogger.info("[WIDGET_PLACEMENT] Existing page refreshed", {
        bundleId,
        pageId: bundle.shopifyPageId,
        pageHandle: bundle.shopifyPageHandle,
      });

      return json({
        success: true,
        pageHandle: bundle.shopifyPageHandle,
        pageId: bundle.shopifyPageId,
        pageUrl,
        slugAdjusted: false,
        widgetInstallationRequired: true,
        message: `Bundle page refreshed successfully!`,
      });
    }

    // UPDATED: Single-click workflow for full-page bundles
    // This will:
    // 1. Ensures page.full-page-bundle.json template exists in theme
    // 2. Creates page with bundle_id metafield and templateSuffix
    // 3. Returns storefront URL where bundle is live
    const apiKey = process.env.SHOPIFY_API_KEY || "";
    const result = await WidgetInstallationService.createFullPageBundle(
      admin,
      session,
      apiKey,
      bundleId,
      bundle.name,
      desiredSlug,
    );

    if (!result.success) {
      return json(
        {
          success: false,
          error: result.error,
          errorType: result.errorType,
          widgetInstallationRequired: result.widgetInstallationRequired,
          widgetInstallationLink: result.widgetInstallationLink,
        },
        { status: 400 },
      );
    }

    // UPDATED: Save page handle, page ID, and activate bundle
    // This happens EVEN if widget installation is required
    // Setting status to 'active' ensures the bundle is available via the API endpoint
    await db.bundle.update({
      where: { id: bundleId, shopId: session.shop },
      data: {
        shopifyPageHandle: result.pageHandle,
        shopifyPageId: result.pageId,
        status: BundleStatus.ACTIVE, // CRITICAL: Activate bundle so widget can fetch it via API
      },
    });

    // Write bundle config as page metafield for zero-proxy widget initialisation (non-fatal)
    const publishedBundle = {
      ...bundle,
      shopifyPageHandle: result.pageHandle,
      shopifyPageId: result.pageId,
      status: BundleStatus.ACTIVE,
    };

    if (result.pageId) {
      await refreshFullPageBundlePageBody(
        admin,
        result.pageId,
        bundle.id,
        session.shop,
        publishedBundle,
      );
    }
    await writeBundleConfigPageMetafield(
      admin,
      result.pageId ?? null,
      publishedBundle,
    );

    // Create URL redirect so /products/{handle} → /pages/{pageHandle} at routing level (non-fatal)
    if (bundle.shopifyProductId && result.pageHandle) {
      createProductPageRedirect(
        admin,
        bundle.shopifyProductId,
        result.pageHandle,
      ).catch(() => {});
    }

    if (bundle.shopifyProductId) {
      try {
        await syncFpbProductStatus(
          admin,
          bundle.shopifyProductId,
          bundleId,
          BundleStatus.ACTIVE,
          bundle.name,
          bundle.description || null,
        );
        await updateBundleProductMetafields(
          admin,
          bundle.shopifyProductId,
          buildFullPageBundleMetafieldConfig(
            {
              ...bundle,
              status: BundleStatus.ACTIVE,
            },
            {
              shopifyPageHandle: result.pageHandle,
              status: BundleStatus.ACTIVE,
            },
          ),
        );
      } catch (metafieldError) {
        AppLogger.warn(
          "[WIDGET_PLACEMENT] Failed to sync bundle product redirect metadata after page creation (non-fatal)",
          {
            bundleId,
            shopifyProductId: bundle.shopifyProductId,
            pageHandle: result.pageHandle,
          },
          metafieldError as Error,
        );
      }
    }

    AppLogger.info(
      "[WIDGET_PLACEMENT] Page created successfully (single-click mode)",
      {
        bundleId,
        pageId: result.pageId,
        pageHandle: result.pageHandle,
        pageUrl: result.pageUrl,
        widgetInstallationRequired: result.widgetInstallationRequired,
      },
    );

    // Return success with page info and optional installation link
    return json({
      success: true,
      pageUrl: result.pageUrl,
      pageId: result.pageId,
      pageHandle: result.pageHandle,
      slugAdjusted: result.slugAdjusted ?? false,
      widgetInstallationRequired: result.widgetInstallationRequired,
      widgetInstallationLink: result.widgetInstallationLink,
      message: result.widgetInstallationRequired
        ? `Page created successfully! Complete setup by adding the widget to your page.`
        : `Bundle page created successfully! View at: ${result.pageUrl}`,
    });
  } catch (error) {
    AppLogger.error(
      "[WIDGET_PLACEMENT] Error in widget placement:",
      {},
      error as any,
    );
    return json(
      {
        success: false,
        error: (error as Error).message || "Widget placement validation failed",
      },
      { status: 500 },
    );
  }
}

/**
 * Handle renaming the Shopify page handle for an already-placed full-page bundle.
 * Called when the merchant edits the slug and saves from the configure page.
 */
export async function handleRenamePageSlug(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  newSlug: string,
) {
  try {
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
      include: {
        steps: {
          include: {
            StepProduct: true,
            StepCategory: { orderBy: { sortOrder: "asc" } },
          },
          orderBy: { position: "asc" },
        },
        pricing: true,
      },
    });

    if (!bundle) {
      return json(
        { success: false, error: ERROR_MESSAGES.BUNDLE_NOT_FOUND },
        { status: 404 },
      );
    }

    if (!bundle.shopifyPageId) {
      return json(
        { success: false, error: "Bundle page has not been placed yet." },
        { status: 400 },
      );
    }

    const result = await renamePageHandle(
      admin,
      bundle.shopifyPageId,
      newSlug,
      bundle.shopifyPageHandle ?? "",
    );

    if (!result.success) {
      return json({ success: false, error: result.error }, { status: 400 });
    }

    await db.bundle.update({
      where: { id: bundleId, shopId: session.shop },
      data: { shopifyPageHandle: result.newHandle },
    });

    if (bundle.shopifyProductId) {
      try {
        await updateBundleProductMetafields(
          admin,
          bundle.shopifyProductId,
          buildFullPageBundleMetafieldConfig(bundle, {
            shopifyPageHandle: result.newHandle,
          }),
        );
      } catch (metafieldError) {
        AppLogger.warn(
          "[RENAME_PAGE_SLUG] Failed to sync bundle product redirect metadata after slug rename (non-fatal)",
          {
            bundleId,
            shopifyProductId: bundle.shopifyProductId,
            newHandle: result.newHandle,
          },
          metafieldError as Error,
        );
      }
    }

    AppLogger.info("[RENAME_PAGE_SLUG] Page handle renamed successfully", {
      bundleId,
      oldHandle: bundle.shopifyPageHandle,
      newHandle: result.newHandle,
    });

    return json({
      success: true,
      newHandle: result.newHandle,
      adjusted: result.adjusted ?? false,
    });
  } catch (error) {
    AppLogger.error(
      "[RENAME_PAGE_SLUG] Error renaming page slug:",
      {},
      error as any,
    );
    return json(
      {
        success: false,
        error: (error as Error).message || "Failed to rename page slug",
      },
      { status: 500 },
    );
  }
}
