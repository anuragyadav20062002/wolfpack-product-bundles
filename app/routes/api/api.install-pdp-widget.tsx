/**
 * POST /api/install-pdp-widget
 *
 * Programmatically installs the bundle-product-page app block into the active
 * Shopify theme by writing `templates/product.product-page-bundle.json`.
 *
 * Also sets templateSuffix: "product-page-bundle" on the actual PDP product so
 * it uses the correct template in the storefront and Shopify Theme Editor picks
 * it as the representative product (not the synthetic bundle product).
 *
 * This gives merchants a one-click "Add to Storefront" flow from the configure
 * page without needing to open the Theme Editor manually.
 * The operation is idempotent — safe to call multiple times.
 *
 * Request body: { productHandle?: string, bundleId?: string }
 * Response:     { success, templateCreated, templateAlreadyExists } | { success: false, error }
 */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import type { ShopifyAdmin } from "../../lib/auth-guards.server";
import { ensureProductBundleTemplate } from "../../services/widget-installation/widget-theme-template.server";
import { AppLogger } from "../../lib/logger";

const COMPONENT = "InstallPdpWidget";

async function applyTemplateSuffixToProduct(admin: ShopifyAdmin, productHandle: string): Promise<void> {
  // Fetch the product GID by handle
  const GET_PRODUCT = `
    query GetProductByHandle($handle: String!) {
      productByHandle(handle: $handle) { id templateSuffix }
    }
  `;
  const res = await admin.graphql(GET_PRODUCT, { variables: { handle: productHandle } });
  const data = await res.json();
  const product = data.data?.productByHandle;

  if (!product) {
    AppLogger.warn("[INSTALL] Product not found by handle — skipping templateSuffix", { component: COMPONENT, productHandle });
    return;
  }

  if (product.templateSuffix === "product-page-bundle") {
    AppLogger.info("[INSTALL] Product already has correct templateSuffix", { component: COMPONENT, productHandle });
    return;
  }

  const UPDATE_SUFFIX = `
    mutation SetTemplateSuffix($id: ID!, $suffix: String!) {
      productUpdate(input: { id: $id, templateSuffix: $suffix }) {
        product { id templateSuffix }
        userErrors { field message }
      }
    }
  `;
  const updateRes = await admin.graphql(UPDATE_SUFFIX, {
    variables: { id: product.id, suffix: "product-page-bundle" },
  });
  const updateData = await updateRes.json();
  const userErrors = updateData.data?.productUpdate?.userErrors ?? [];
  if (userErrors.length > 0) {
    AppLogger.warn("[INSTALL] templateSuffix update had user errors", { component: COMPONENT, productHandle, userErrors });
  } else {
    AppLogger.info("[INSTALL] templateSuffix applied to PDP product", { component: COMPONENT, productHandle });
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { admin, session } = await requireAdminSession(request);

    const apiKey = process.env.SHOPIFY_API_KEY;
    if (!apiKey) {
      AppLogger.error("[INSTALL] SHOPIFY_API_KEY env var not set", { component: COMPONENT });
      return json({ success: false, error: "App configuration error: missing API key" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { productHandle, bundleId } = body as { productHandle?: string; bundleId?: string };

    AppLogger.info("[INSTALL] Installing PDP widget template", { component: COMPONENT, productHandle, bundleId });

    const result = await ensureProductBundleTemplate(admin, session, apiKey);

    if (!result.success) {
      AppLogger.error("[INSTALL] Template install failed", { component: COMPONENT, error: result.error });
      return json({ success: false, error: result.error ?? "Template install failed" }, { status: 500 });
    }

    // Set templateSuffix on the actual PDP product so the storefront uses the
    // correct template and Shopify Theme Editor selects the right preview product.
    if (productHandle) {
      await applyTemplateSuffixToProduct(admin, productHandle).catch((err) => {
        AppLogger.warn("[INSTALL] templateSuffix step failed (non-fatal)", { component: COMPONENT, productHandle }, err);
      });
    }

    AppLogger.info("[INSTALL] Template install succeeded", {
      component: COMPONENT,
      templateCreated: result.templateCreated,
      templateAlreadyExists: result.templateAlreadyExists,
    });

    return json({
      success: true,
      templateCreated: result.templateCreated,
      templateAlreadyExists: result.templateAlreadyExists,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    AppLogger.error("[INSTALL] Unexpected error", { component: COMPONENT, error: message });
    return json({ success: false, error: message }, { status: 500 });
  }
};
