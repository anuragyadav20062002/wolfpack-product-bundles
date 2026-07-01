import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import db from "../../../../db.server";
import { SHOPIFY_REST_API_VERSION } from "../../../../constants/api";
import { ERROR_MESSAGES } from "../../../../constants/errors";
import { AppLogger } from "../../../../lib/logger";
import { WidgetInstallationService } from "../../../../services/widget-installation.server";
import {
  getPreviewPageUrl,
  refreshFullPageBundlePageBody,
  writeBundleConfigPageMetafield,
} from "../../../../services/widget-installation/widget-full-page-bundle.server";
import { recordFirstBundlePreviewEvent } from "../../../../services/bundles/bundle-preview-event.server";

export async function handleCheckFullPageTemplate(
  admin: ShopifyAdmin,
  session: Session,
) {
  try {
    AppLogger.debug("[TEMPLATE_CHECK] Checking for full-page-bundle template");

    const themeResponse = await admin.graphql(`
      query {
        themes(first: 1, roles: MAIN) {
          nodes {
            id
            name
            role
          }
        }
      }
    `);
    const themeData = await themeResponse.json();
    const theme = themeData.data?.themes?.nodes?.[0];

    if (!theme) {
      return json({
        success: false,
        templateExists: false,
        error: "No active theme found",
      });
    }

    const themeId = theme.id.split("/").pop();
    const { accessToken, shop } = session;

    const assetsResponse = await fetch(
      `https://${shop}/admin/api/${SHOPIFY_REST_API_VERSION}/themes/${themeId}/assets.json`,
      {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": accessToken ?? "",
          "Content-Type": "application/json",
        },
      },
    );

    if (!assetsResponse.ok) {
      throw new Error(`Failed to fetch theme assets: ${assetsResponse.status}`);
    }

    const assetsData = await assetsResponse.json();
    const templateExists = assetsData.assets.some(
      (asset: any) =>
        asset.key === "templates/page.full-page-bundle.json" ||
        asset.key === "templates/page.full-page-bundle.liquid",
    );

    AppLogger.debug(`[TEMPLATE_CHECK] Template exists: ${templateExists}`);

    return json({
      success: true,
      templateExists,
      themeName: theme.name,
      themeId: theme.id,
    });
  } catch (error) {
    AppLogger.error(
      "[TEMPLATE_CHECK] Error checking template:",
      {},
      error as any,
    );
    return json(
      {
        success: false,
        templateExists: false,
        error: (error as Error).message || "Failed to check template",
      },
      { status: 500 },
    );
  }
}

export async function handleCreatePreviewPage(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  routeFamily = "fpb_configure",
) {
  try {
    AppLogger.debug("[PREVIEW_PAGE] Creating/retrieving preview page", {
      bundleId,
    });

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

    if (bundle.shopifyPreviewPageId) {
      const urlResult = await getPreviewPageUrl(
        admin,
        bundle.shopifyPreviewPageId,
        session.shop,
        bundleId,
      );

      if (urlResult.success) {
        const bodyRefresh = await refreshFullPageBundlePageBody(
          admin,
          bundle.shopifyPreviewPageId,
          bundle.id,
          session.shop,
          bundle,
        );
        if (!bodyRefresh.success) {
          return json(
            {
              success: false,
              error: bodyRefresh.error || "Failed to refresh preview page body",
            },
            { status: 400 },
          );
        }
        await writeBundleConfigPageMetafield(
          admin,
          bundle.shopifyPreviewPageId,
          bundle,
        );

        AppLogger.info("[PREVIEW_PAGE] Returning existing preview URL", {
          bundleId,
          previewPageId: bundle.shopifyPreviewPageId,
        });
        if (urlResult.previewUrl) {
          await recordFirstBundlePreviewEvent({
            admin,
            shopDomain: session.shop,
            bundle,
            bundleLink: urlResult.previewUrl,
            routeFamily,
          });
        }
        return json({
          success: true,
          shareablePreviewUrl: urlResult.previewUrl,
        });
      }

      AppLogger.warn(
        "[PREVIEW_PAGE] Existing draft page not found, recreating",
        {
          bundleId,
          previewPageId: bundle.shopifyPreviewPageId,
        },
      );
      await db.bundle.update({
        where: { id: bundleId, shopId: session.shop },
        data: { shopifyPreviewPageId: null, shopifyPreviewPageHandle: null },
      });
    }

    const apiKey = process.env.SHOPIFY_API_KEY || "";
    const result = await WidgetInstallationService.createFullPageBundle(
      admin,
      session,
      apiKey,
      bundleId,
      `[Preview] ${bundle.name}`,
      undefined,
      true,
    );

    if (!result.success) {
      AppLogger.error("[PREVIEW_PAGE] Draft page creation failed", {
        bundleId,
        error: result.error,
      });
      return json({ success: false, error: result.error }, { status: 400 });
    }

    if (result.pageId) {
      const bodyRefresh = await refreshFullPageBundlePageBody(
        admin,
        result.pageId,
        bundle.id,
        session.shop,
        bundle,
      );
      if (!bodyRefresh.success) {
        return json(
          {
            success: false,
            error: bodyRefresh.error || "Failed to refresh preview page body",
          },
          { status: 400 },
        );
      }
    }

    await writeBundleConfigPageMetafield(admin, result.pageId ?? null, bundle);
    await db.bundle.update({
      where: { id: bundleId, shopId: session.shop },
      data: {
        shopifyPreviewPageId: result.pageId,
        shopifyPreviewPageHandle: result.pageHandle,
      },
    });

    AppLogger.info("[PREVIEW_PAGE] Draft preview page created", {
      bundleId,
      previewPageId: result.pageId,
      previewPageHandle: result.pageHandle,
    });

    if (result.pageUrl) {
      await recordFirstBundlePreviewEvent({
        admin,
        shopDomain: session.shop,
        bundle,
        bundleLink: result.pageUrl,
        routeFamily,
      });
    }

    return json({ success: true, shareablePreviewUrl: result.pageUrl });
  } catch (error) {
    AppLogger.error("[PREVIEW_PAGE] Unexpected error", {}, error as Error);
    return json(
      {
        success: false,
        error: (error as Error).message || "Failed to create preview page",
      },
      { status: 500 },
    );
  }
}

export async function handleUpdateBundleDesignTemplate(
  _admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  formData: FormData,
) {
  const bundleDesignTemplate =
    (formData.get("bundleDesignTemplate") as string)?.trim() || null;
  const bundleDesignPresetId =
    (formData.get("bundleDesignPresetId") as string)?.trim() || null;

  await db.bundle.update({
    where: { id: bundleId, shopId: session.shop },
    data: { bundleDesignTemplate, bundleDesignPresetId },
  });

  return json({ success: true });
}
