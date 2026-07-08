import { json, type ActionFunctionArgs } from "@remix-run/node";
import prisma from "../../db.server";
import { verifyAppProxyRequest } from "../../lib/app-proxy.server";
import { AppLogger } from "../../lib/logger";
import {
  buildRuntimeTokenPayload,
  generateCartTransformRuntimeTokenSecret,
  signRuntimeCartToken,
} from "../../services/cart-transform-runtime-token.server";
import { getBundleProductVariantId } from "../../utils/variant-lookup.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function sanitizeString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const shop = verifyAppProxyRequest(url);

  if (!shop) {
    AppLogger.warn("Runtime cart token rejected unsigned storefront request", {
      component: "api.cart-transform-runtime-token",
      operation: "action",
    });
    return json({ ok: false, error: "Invalid storefront request" }, { status: 400, headers: CORS_HEADERS });
  }

  const body = await request.json().catch(() => null);
  const bundleId = sanitizeString(body?.bundleId);
  const bundleType = sanitizeString(body?.bundleType);
  const offerGroupId = sanitizeString(body?.offerGroupId);

  if (!bundleId || !bundleType || !offerGroupId) {
    return json({ ok: false, error: "Invalid runtime token payload" }, { status: 400, headers: CORS_HEADERS });
  }

  const bundle = await (prisma.bundle as any).findFirst({
    where: { id: bundleId, shopId: shop },
    include: {
      steps: {
        include: {
          StepProduct: { orderBy: { position: "asc" } },
          StepCategory: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { position: "asc" },
      },
      pricing: true,
    },
  });

  if (!bundle || bundle.bundleType !== bundleType || !bundle.shopifyProductId) {
    return json({ ok: false, error: "Invalid runtime token payload" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const { unauthenticated } = await import("../../shopify.server");
    const { admin } = await unauthenticated.admin(shop);
    const parentVariantId = await getBundleProductVariantId(admin as never, bundle.shopifyProductId);
    const payload = buildRuntimeTokenPayload({
      shop,
      bundle,
      parentVariantId: parentVariantId ?? "",
      offerGroupId,
      bundleType,
      selection: {
        components: body?.components,
        addons: body?.addons,
      },
    });
    const secret = generateCartTransformRuntimeTokenSecret(shop);
    const token = signRuntimeCartToken(payload, secret);

    return json({ ok: true, token }, { headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } });
  } catch (error) {
    AppLogger.warn("Runtime cart token payload rejected", {
      component: "api.cart-transform-runtime-token",
      operation: "action",
      shop,
      bundleId,
    }, error);
    return json({ ok: false, error: "Invalid runtime token payload" }, { status: 400, headers: CORS_HEADERS });
  }
}
