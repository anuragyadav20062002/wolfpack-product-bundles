import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import db from "../../../../db.server";
import { ERROR_MESSAGES } from "../../../../constants/errors";
import { AppLogger } from "../../../../lib/logger";
import { normaliseShopifyProductId } from "../../../../services/bundles/bundle-configure-handlers.server";
import { WidgetInstallationService } from "../../../../services/widget-installation.server";

export async function handleValidateWidgetPlacement(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
) {
  try {
    AppLogger.debug("[WIDGET_PLACEMENT] Validating widget placement", {
      bundleId,
    });

    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
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

    const apiKey = process.env.SHOPIFY_API_KEY || "";
    const result =
      await WidgetInstallationService.validateProductBundleWidgetSetup(
        admin,
        session.shop,
        apiKey,
        bundleId,
        bundle.shopifyProductId || undefined,
      );

    if (result.requiresOneTimeSetup) {
      return json(
        {
          success: false,
          requiresOneTimeSetup: true,
          installationLink: result.installationLink,
          message: result.message,
        },
        { status: 400 },
      );
    }

    return json({
      success: true,
      productUrl: result.productUrl,
      configurationLink: result.configurationLink,
      message: result.message,
    });
  } catch (error) {
    AppLogger.error(
      "[WIDGET_PLACEMENT] Error validating widget placement:",
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

export async function handleAssignProductTemplate(
  admin: ShopifyAdmin,
  _session: Session,
  _bundleId: string,
  formData: FormData,
) {
  const rawProductId = String(formData.get("productId") ?? "");
  const templateSuffixValue = formData.get("templateSuffix");
  const templateSuffix =
    typeof templateSuffixValue === "string" ? templateSuffixValue.trim() : "";
  const productId = normaliseShopifyProductId(rawProductId, {
    title: "Bundle parent product",
    stepName: "Place Widget",
  });

  const response = await admin.graphql(
    `
    mutation AssignProductTemplate($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product {
          id
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
    {
      variables: {
        product: {
          id: productId,
          templateSuffix: templateSuffix || null,
        },
      },
    },
  );
  const data = await response.json();
  const userErrors = data.data?.productUpdate?.userErrors ?? [];

  if (userErrors.length > 0) {
    const message =
      userErrors[0]?.message ?? "Failed to assign product template";
    return json({ success: false, error: message }, { status: 400 });
  }

  return json({
    success: true,
    productId,
    templateSuffix: templateSuffix || null,
    handle: data.data?.productUpdate?.product?.handle ?? null,
  });
}
