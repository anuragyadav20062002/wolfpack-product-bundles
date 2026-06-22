import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { AppLogger } from "../../lib/logger";
import { recordBusinessEvent } from "../../services/app-events.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Receives widget error reports from the storefront and logs them server-side.
 * Called by the FPB/PDP bundle widget when an unhandled init error occurs.
 * No auth required — carries no sensitive data, just error telemetry.
 *
 * POST /apps/product-bundles/api/widget-error
 * Body: { message, bundleId, bundleType, shop, url }
 */
export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: CORS_HEADERS });
  }

  try {
    const body = await request.json() as {
      message?: string;
      bundleId?: string;
      bundleType?: string;
      shop?: string;
      url?: string;
    };

    AppLogger.error("Bundle widget init error (storefront)", {
      component: "bundle-widget",
      operation: "init",
      bundleId: body.bundleId,
      bundleType: body.bundleType,
      shop: body.shop,
      url: body.url,
    }, new Error(body.message ?? "Unknown widget error"));

    await recordBusinessEvent({
      eventHandle: "widget_runtime_error_reported",
      shopDomain: sanitizeShopDomain(body.shop),
      bundleId: sanitizeOptionalString(body.bundleId),
      bundleType: sanitizeOptionalString(body.bundleType),
      surface: "storefront",
      actor: "buyer",
      result: "failure",
      errorCode: "widget_runtime_error",
      attributes: {
        category: categorizeWidgetError(body.message),
        message: sanitizeWidgetMessage(body.message),
      },
    });

    return json({ ok: true }, { headers: CORS_HEADERS });
  } catch {
    return json({ ok: true }, { headers: CORS_HEADERS });
  }
};

function sanitizeOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function sanitizeShopDomain(value: unknown): string {
  return sanitizeOptionalString(value) ?? "unknown_shop";
}

function sanitizeWidgetMessage(value: unknown): string {
  if (typeof value !== "string") return "unknown_widget_error";
  return value
    .replace(/https?:\/\/\S+/gi, "[redacted_url]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted_email]")
    .slice(0, 128);
}

function categorizeWidgetError(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  const lower = value.toLowerCase();
  if (lower.includes("typeerror")) return "type_error";
  if (lower.includes("network") || lower.includes("fetch")) return "network_error";
  if (lower.includes("config")) return "config_error";
  return "runtime_error";
}
