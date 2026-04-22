import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { createHmac } from "node:crypto";
import { AppLogger } from "../../lib/logger";
import { CartTransformService } from "../../services/cart-transform-service.server";
import { unauthenticated } from "../../shopify.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const CHECK_COOLDOWN_MS = 60 * 60 * 1000;

type HealCache = Map<string, number>;

function getHealCache(): HealCache {
  const globalObject = globalThis as typeof globalThis & {
    __wolfpackCartTransformHealCache?: HealCache;
  };
  globalObject.__wolfpackCartTransformHealCache ??= new Map();
  return globalObject.__wolfpackCartTransformHealCache;
}

function verifyAppProxyRequest(url: URL): string | null {
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const shop = url.searchParams.get("shop");
  const signature = url.searchParams.get("signature");

  if (!apiSecret || !shop || !signature) return null;

  const message = [...url.searchParams.entries()]
    .filter(([key]) => key !== "signature")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const expected = createHmac("sha256", apiSecret).update(message).digest("hex");
  return expected === signature ? shop : null;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shopDomain = verifyAppProxyRequest(url);

  if (!shopDomain) {
    AppLogger.warn("Cart transform heal rejected unsigned storefront request", {
      component: "api.cart-transform-heal",
      operation: "loader",
    });
    return json({ ok: false, error: "Invalid storefront request" }, { status: 400, headers: CORS_HEADERS });
  }

  const cache = getHealCache();
  const lastCheckedAt = cache.get(shopDomain) ?? 0;
  const now = Date.now();

  if (now - lastCheckedAt < CHECK_COOLDOWN_MS) {
    return json({
      ok: true,
      skipped: true,
      reason: "cooldown",
      checkedAt: new Date(lastCheckedAt).toISOString(),
    }, {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    const { admin } = await unauthenticated.admin(shopDomain);
    const result = await CartTransformService.activateForNewInstallation(admin, shopDomain);

    if (result.success) {
      cache.set(shopDomain, now);
    }

    return json({
      ok: result.success,
      activated: result.success && !result.alreadyExists,
      alreadyExists: result.alreadyExists ?? false,
      cartTransformId: result.cartTransformId ?? null,
      error: result.success ? null : result.error,
    }, {
      status: result.success ? 200 : 500,
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    AppLogger.error("Cart transform storefront self-heal failed", {
      component: "api.cart-transform-heal",
      operation: "loader",
      shop: shopDomain,
    }, error);

    return json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown cart transform heal error",
    }, { status: 500, headers: CORS_HEADERS });
  }
}
