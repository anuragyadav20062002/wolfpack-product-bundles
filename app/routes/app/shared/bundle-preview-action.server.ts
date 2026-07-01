import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../lib/auth-guards.server";
import db from "../../../db.server";
import { ERROR_MESSAGES } from "../../../constants/errors";
import { BundleType } from "../../../constants/bundle";
import { recordFirstBundlePreviewEvent } from "../../../services/bundles/bundle-preview-event.server";

export async function handleRecordBundlePreview(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  formData: FormData,
) {
  const bundle = await db.bundle.findUnique({
    where: { id: bundleId, shopId: session.shop },
    select: {
      id: true,
      bundleType: true,
      status: true,
      shopifyProductHandle: true,
      shopifyPageHandle: true,
      shopifyPreviewPageHandle: true,
    },
  });

  if (!bundle) {
    return json(
      { success: false, error: ERROR_MESSAGES.BUNDLE_NOT_FOUND },
      { status: 404 },
    );
  }

  const postedLink = String(formData.get("bundleLink") ?? "").trim();
  const bundleLink = postedLink !== "" ? postedLink : resolveBundleLink(session.shop, bundle);

  if (!bundleLink) {
    return json(
      { success: false, error: "Bundle preview link is unavailable." },
      { status: 400 },
    );
  }

  await recordFirstBundlePreviewEvent({
    admin,
    shopDomain: session.shop,
    bundle,
    bundleLink,
    routeFamily: resolveRouteFamily(formData, bundle.bundleType),
  });

  return json({ success: true });
}

function defaultRouteFamily(bundleType: string | null): string {
  return bundleType === BundleType.PRODUCT_PAGE ? "ppb_configure" : "fpb_configure";
}

function resolveRouteFamily(formData: FormData, bundleType: string | null): string {
  const postedRouteFamily = String(formData.get("routeFamily") ?? "").trim();
  return postedRouteFamily !== "" ? postedRouteFamily : defaultRouteFamily(bundleType);
}

function resolveBundleLink(
  shopDomain: string,
  bundle: {
    bundleType: string | null;
    shopifyProductHandle: string | null;
    shopifyPageHandle: string | null;
    shopifyPreviewPageHandle: string | null;
  },
): string {
  const host = shopDomain.includes(".myshopify.com")
    ? shopDomain
    : `${shopDomain}.myshopify.com`;

  if (bundle.bundleType === BundleType.PRODUCT_PAGE && bundle.shopifyProductHandle) {
    return `https://${host}/products/${bundle.shopifyProductHandle}`;
  }

  const pageHandle = bundle.shopifyPageHandle ?? bundle.shopifyPreviewPageHandle;
  if (pageHandle) return `https://${host}/pages/${pageHandle}`;

  return "";
}
