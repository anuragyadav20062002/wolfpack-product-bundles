import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../../db.server";
import { AppLogger } from "../../lib/logger";
import { verifyAppProxyRequest } from "../../lib/app-proxy.server";
import { BundleStatus } from "../../constants/bundle";
import { formatBundleForWidget } from "../../lib/bundle-formatter.server";
import { verifyFpbPreviewToken } from "../../lib/fpb-preview-token.server";

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const shopDomain = verifyAppProxyRequest(url);
  const bundleId = params.bundleId;

  if (!shopDomain) {
    AppLogger.warn("FPB proxy page rejected unsigned request", {
      component: "wpb.proxy",
      operation: "loader",
      bundleId: bundleId ?? null,
      status: 400,
      failureCategory: "invalid_proxy_signature",
      renderDurationMs: Date.now() - startedAt,
    });
    return new Response("Invalid bundle link", {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (!bundleId) {
    AppLogger.warn("FPB proxy page missing bundle ID", {
      component: "wpb.proxy",
      shop: shopDomain,
      status: 400,
      failureCategory: "missing_bundle_id",
      renderDurationMs: Date.now() - startedAt,
    });
    return new Response("Bundle ID is required", {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const bundle = await db.bundle.findFirst({
    where: {
      id: bundleId,
      shopId: shopDomain,
      bundleType: "full_page",
    },
    include: {
      steps: {
        include: {
          StepProduct: { orderBy: { position: "asc" } },
          StepCategory: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
      pricing: true,
    },
  });

  if (!bundle) {
    AppLogger.info("FPB proxy page not found", {
      component: "wpb.proxy",
      shop: shopDomain,
      bundleId,
      status: 404,
      failureCategory: "not_found",
      renderDurationMs: Date.now() - startedAt,
    });
    return new Response("Bundle not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const isPublic = bundle.status === BundleStatus.ACTIVE
    || bundle.status === BundleStatus.UNLISTED;
  const hasValidDraftPreview = bundle.status === BundleStatus.DRAFT
    && verifyFpbPreviewToken({
      token: url.searchParams.get("wpb_preview"),
      shop: shopDomain,
      bundleId,
    });

  if (!isPublic && !hasValidDraftPreview) {
    AppLogger.info("FPB proxy page hidden by status", {
      component: "wpb.proxy",
      shop: shopDomain,
      bundleId,
      status: 404,
      failureCategory: "status_not_public",
      renderDurationMs: Date.now() - startedAt,
    });
    return new Response("Bundle not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const formattedBundle = formatBundleForWidget(bundle);
  const config = escapeHtmlAttribute(JSON.stringify(formattedBundle));
  const liquid = `<div data-wpb-full-page-bundle data-bundle-id="${escapeHtmlAttribute(bundle.id)}" data-bundle-type="full_page" data-bundle-config-source="app_proxy" data-shop="${escapeHtmlAttribute(shopDomain)}" data-fpb-template-type="${escapeHtmlAttribute(formattedBundle.bundleDesignTemplate ?? "FBP_SIDE_FOOTER")}" data-fpb-design-preset="${escapeHtmlAttribute(formattedBundle.bundleDesignPresetId ?? "STANDARD")}" data-bundle-config='${config}' hidden></div>`;

  AppLogger.info("FPB proxy page rendered", {
    component: "wpb.proxy",
    shop: shopDomain,
    bundleId,
    status: 200,
    renderDurationMs: Date.now() - startedAt,
  });

  return new Response(liquid, {
    status: 200,
    headers: {
      "Content-Type": "application/liquid; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
