import { json, type ActionFunctionArgs } from "@remix-run/node";
import prisma from "../../db.server";
import { SHOPIFY_REST_API_VERSION } from "../../constants/api";
import { verifyAppProxyRequest } from "../../lib/app-proxy.server";
import { AppLogger } from "../../lib/logger";
import { getOfflineSessionForShop } from "../../services/offline-token.server";
import { sessionStorage } from "../../shopify.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type DisplayProperties = Record<string, string>;

const GET_CART_BUNDLE_DETAILS_QUERY = `
  query GetCartBundleDetails($cartId: ID!) {
    cart(id: $cartId) {
      id
      metafields(identifiers: [{ key: "bundle_details" }]) {
        key
        type
        value
      }
    }
  }
`;

const SET_CART_BUNDLE_DETAILS_MUTATION = `
  mutation SetCartBundleDetails($metafields: [CartMetafieldsSetInput!]!) {
    cartMetafieldsSet(metafields: $metafields) {
      metafields {
        key
        type
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function normalizeCartId(cartId: unknown, cartToken: unknown) {
  if (typeof cartId === "string" && cartId.startsWith("gid://shopify/Cart/")) {
    return cartId;
  }

  if (typeof cartToken !== "string") {
    return null;
  }

  const trimmedToken = cartToken.trim();
  if (!trimmedToken) return null;

  return `gid://shopify/Cart/${trimmedToken}`;
}

export function sanitizeDisplayProperties(input: unknown): DisplayProperties {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};

  return Object.entries(input).reduce<DisplayProperties>((acc, [key, value]) => {
    if (!key || value === null || value === undefined) return acc;
    if (!["string", "number", "boolean"].includes(typeof value)) return acc;
    acc[key] = String(value);
    return acc;
  }, {});
}

export function mergeBundleDetailsValue(
  existingValue: string | null | undefined,
  bundleDetailsKey: string,
  displayProperties: DisplayProperties,
) {
  let existingDetails: Record<string, unknown> = {};

  if (existingValue) {
    try {
      const parsed = JSON.parse(existingValue);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        existingDetails = parsed;
      }
    } catch {
      existingDetails = {};
    }
  }

  return {
    ...existingDetails,
    [bundleDetailsKey]: { displayProperties },
  };
}

function validateBundleDetailsKey(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[A-Za-z0-9:_-]+_[A-Za-z0-9]+$/.test(trimmed)) return null;
  return trimmed;
}

async function postStorefrontGraphql(
  shop: string,
  storefrontAccessToken: string,
  query: string,
  variables: Record<string, unknown>,
) {
  const response = await fetch(`https://${shop}/api/${SHOPIFY_REST_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`Storefront API request failed: ${response.status}`);
  }

  if (payload?.errors?.length) {
    throw new Error(payload.errors.map((error: { message?: string }) => error.message).join(", "));
  }

  return payload;
}

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const shop = verifyAppProxyRequest(url);

  if (!shop) {
    AppLogger.warn("Cart bundle_details rejected unsigned storefront request", {
      component: "api.cart-bundle-details",
      operation: "action",
    });
    return json({ ok: false, error: "Invalid storefront request" }, { status: 400, headers: CORS_HEADERS });
  }

  const body = await request.json().catch(() => null);
  const cartId = normalizeCartId(body?.cartId, body?.cartToken);
  const bundleDetailsKey = validateBundleDetailsKey(body?.bundleDetailsKey);
  const displayProperties = sanitizeDisplayProperties(body?.displayProperties);

  if (!cartId || !bundleDetailsKey || Object.keys(displayProperties).length === 0) {
    return json({ ok: false, error: "Invalid bundle details payload" }, { status: 400, headers: CORS_HEADERS });
  }

  const session = await getOfflineSessionForShop(prisma, shop, sessionStorage);

  if (!session?.storefrontAccessToken) {
    AppLogger.warn("Cart bundle_details missing Storefront token", {
      component: "api.cart-bundle-details",
      operation: "action",
      shop,
    });
    return json({ ok: false, error: "Shop not configured" }, { status: 404, headers: CORS_HEADERS });
  }

  try {
    const existingPayload = await postStorefrontGraphql(
      shop,
      session.storefrontAccessToken,
      GET_CART_BUNDLE_DETAILS_QUERY,
      { cartId },
    );
    const existingValue = existingPayload?.data?.cart?.metafields?.[0]?.value ?? null;
    const mergedDetails = mergeBundleDetailsValue(existingValue, bundleDetailsKey, displayProperties);

    const setPayload = await postStorefrontGraphql(
      shop,
      session.storefrontAccessToken,
      SET_CART_BUNDLE_DETAILS_MUTATION,
      {
        metafields: [{
          ownerId: cartId,
          key: "bundle_details",
          type: "json",
          value: JSON.stringify(mergedDetails),
        }],
      },
    );
    const userErrors = setPayload?.data?.cartMetafieldsSet?.userErrors ?? [];

    if (userErrors.length > 0) {
      throw new Error(userErrors.map((error: { message?: string }) => error.message).join(", "));
    }

    return json({ ok: true }, { headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } });
  } catch (error) {
    AppLogger.error("Cart bundle_details sync failed", {
      component: "api.cart-bundle-details",
      operation: "action",
      shop,
    }, error);
    return json({ ok: false, error: "Failed to sync bundle details" }, { status: 502, headers: CORS_HEADERS });
  }
}
