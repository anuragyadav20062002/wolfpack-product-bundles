import { createHash } from "node:crypto";
import prisma from "../db.server";
import { AppLogger } from "../lib/logger";

const SHOPIFY_AUTH_URL = "https://api.shopify.com/auth/access_token";
const MAX_ATTRIBUTES = 15;
const MAX_ATTRIBUTE_STRING_BYTES = 128;
const MAX_IDEMPOTENCY_KEY_LENGTH = 64;
const RETRYABLE_STATUS_CODES = new Set([409, 429, 500, 502, 503, 504]);
const IDENTIFYING_KEY_PATTERN = /(email|phone|address|customer|buyer|merchant|token|secret|password|stack|url|domain|name)/i;

type ScalarAttribute = string | number | boolean | null;
type AttributeInput = Record<string, unknown>;

export type BusinessEventInput = {
  eventHandle: string;
  shopDomain: string;
  shopifyShopGid?: string | null;
  bundleId?: string | null;
  bundleType?: string | null;
  surface?: string | null;
  actor?: string | null;
  routeFamily?: string | null;
  correlationId?: string | null;
  result?: string | null;
  errorCode?: string | null;
  attributes?: AttributeInput;
  occurredAt?: Date;
  idempotencyKey?: string;
  sendToShopify?: boolean;
};

export type ShopifyAppEventInput = {
  eventHandle: string;
  shopifyShopGid: string;
  idempotencyKey: string;
  occurredAt: Date;
  attributes?: AttributeInput;
};

export type ShopifyDeliveryResult = {
  status: "delivered" | "failed" | "skipped";
  retryCount: number;
  error?: string;
};

let tokenCache: { token: string; expiresAt: number } | null = null;

export function sanitizeAppEventAttributes(attributes: AttributeInput = {}): Record<string, ScalarAttribute> {
  const sanitized: Record<string, ScalarAttribute> = { schema_version: 1 };

  for (const [key, value] of Object.entries(attributes)) {
    if (Object.keys(sanitized).length >= MAX_ATTRIBUTES) break;
    if (!/^[a-z][a-z0-9_]*$/.test(key)) continue;
    if (IDENTIFYING_KEY_PATTERN.test(key)) continue;

    const scalar = sanitizeScalar(value);
    if (scalar === undefined) continue;
    sanitized[key] = scalar;
  }

  return sanitized;
}

function sanitizeScalar(value: unknown): ScalarAttribute | undefined {
  if (value === null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  return truncateUtf8(value.replace(/[\r\n\t]+/g, " ").trim(), MAX_ATTRIBUTE_STRING_BYTES);
}

function truncateUtf8(value: string, maxBytes: number): string {
  let output = value;
  while (Buffer.byteLength(output, "utf8") > maxBytes) {
    output = output.slice(0, -1);
  }
  return output;
}

export function buildIdempotencyKey(input: {
  shopifyShopGid?: string | null;
  shopDomain?: string | null;
  eventHandle: string;
  bundleId?: string | null;
  correlationId?: string | null;
  occurredAt?: Date;
}): string {
  const base = [
    input.shopifyShopGid || input.shopDomain || "unknown_shop",
    input.eventHandle,
    input.bundleId || "no_bundle",
    input.correlationId || input.occurredAt?.toISOString() || "no_correlation",
  ].join(":");

  if (base.length <= MAX_IDEMPOTENCY_KEY_LENGTH) return base;

  const digest = createHash("sha256").update(base).digest("hex").slice(0, 32);
  const prefix = `${input.eventHandle}:`.slice(0, MAX_IDEMPOTENCY_KEY_LENGTH - digest.length - 1);
  return `${prefix}:${digest}`;
}

export async function recordBusinessEvent(input: BusinessEventInput): Promise<unknown | null> {
  const occurredAt = input.occurredAt ?? new Date();
  const attributes = sanitizeAppEventAttributes({
    ...(input.attributes ?? {}),
    ...(input.bundleId ? { bundle_id: input.bundleId } : {}),
    ...(input.bundleType ? { bundle_type: input.bundleType } : {}),
    ...(input.surface ? { surface: input.surface } : {}),
    ...(input.actor ? { actor: input.actor } : {}),
    ...(input.routeFamily ? { route_family: input.routeFamily } : {}),
    ...(input.correlationId ? { correlation_id: input.correlationId } : {}),
    ...(input.result ? { result: input.result } : {}),
    ...(input.errorCode ? { error_code: input.errorCode } : {}),
  });
  const idempotencyKey = input.idempotencyKey ?? buildIdempotencyKey({
    shopifyShopGid: input.shopifyShopGid,
    shopDomain: input.shopDomain,
    eventHandle: input.eventHandle,
    bundleId: input.bundleId,
    correlationId: input.correlationId,
    occurredAt,
  });

  try {
    const event = await (prisma as any).businessEvent.create({
      data: {
        eventHandle: input.eventHandle,
        shopDomain: input.shopDomain,
        shopifyShopGid: input.shopifyShopGid ?? null,
        bundleId: input.bundleId ?? null,
        bundleType: input.bundleType ?? null,
        surface: input.surface ?? null,
        actor: input.actor ?? null,
        routeFamily: input.routeFamily ?? null,
        correlationId: input.correlationId ?? null,
        result: input.result ?? null,
        errorCode: input.errorCode ?? null,
        attributes,
        idempotencyKey,
        occurredAt,
        shopifyDeliveryStatus: shouldSendToShopify(input) && input.shopifyShopGid ? "pending" : "not_sent",
      },
    });

    if (!shouldSendToShopify(input) || !input.shopifyShopGid) return event;

    const delivery = await emitShopifyAppEvent({
      eventHandle: input.eventHandle,
      shopifyShopGid: input.shopifyShopGid,
      idempotencyKey,
      occurredAt,
      attributes,
    });

    await (prisma as any).businessEvent.update({
      where: { id: (event as any).id },
      data: {
        shopifyDeliveryStatus: delivery.status,
        shopifyDeliveredAt: delivery.status === "delivered" ? new Date() : null,
        shopifyRetryCount: delivery.retryCount,
        shopifyLastError: delivery.error ? truncateUtf8(delivery.error, 512) : null,
      },
    });

    return event;
  } catch (error) {
    AppLogger.error("Failed to record business event", {
      component: "app-events",
      shopId: input.shopDomain,
      operation: input.eventHandle,
    }, error);
    return null;
  }
}

function shouldSendToShopify(input: BusinessEventInput): boolean {
  return input.sendToShopify !== false && process.env.SHOPIFY_APP_EVENTS_ENABLED === "true";
}

export async function emitShopifyAppEvent(input: ShopifyAppEventInput): Promise<ShopifyDeliveryResult> {
  if (process.env.SHOPIFY_APP_EVENTS_ENABLED !== "true") {
    return { status: "skipped", retryCount: 0 };
  }

  try {
    const token = await getShopifyAppEventsToken();
    if (!token) {
      return { status: "failed", retryCount: 0, error: "Missing Shopify App Events bearer token" };
    }

    const attributes = sanitizeAppEventAttributes(input.attributes);
    const body = JSON.stringify({
      shop_id: input.shopifyShopGid,
      event_handle: input.eventHandle,
      timestamp: input.occurredAt.toISOString(),
      idempotency_key: input.idempotencyKey,
      attributes,
    });
    const apiVersion = process.env.SHOPIFY_APP_EVENTS_API_VERSION || "unstable";
    const endpoint = `https://api.shopify.com/app/${apiVersion}/events`;
    let retryCount = 0;
    let lastError = "";

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      });

      if (response.status === 202) {
        return { status: "delivered", retryCount };
      }

      const responseText = await safeResponseText(response);
      lastError = `Shopify App Events ${response.status}: ${responseText}`;

      if (!RETRYABLE_STATUS_CODES.has(response.status)) {
        return { status: "failed", retryCount, error: truncateUtf8(lastError, 512) };
      }

      retryCount += 1;
      await sleep(25 * retryCount);
    }

    return { status: "failed", retryCount, error: truncateUtf8(lastError || "Retry limit reached", 512) };
  } catch (error) {
    AppLogger.warn("Shopify App Events delivery failed", { component: "app-events" }, error);
    return {
      status: "failed",
      retryCount: 0,
      error: error instanceof Error ? truncateUtf8(error.message, 512) : "Unknown Shopify App Events error",
    };
  }
}

async function getShopifyAppEventsToken(): Promise<string | null> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 30_000) {
    return tokenCache.token;
  }

  const clientId = process.env.SHOPIFY_API_KEY;
  const clientSecret = process.env.SHOPIFY_API_SECRET;
  if (!clientId || !clientSecret) return null;

  const response = await fetch(SHOPIFY_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const responseText = await safeResponseText(response);
    AppLogger.warn("Shopify App Events token request failed", {
      component: "app-events",
      status: response.status,
    }, responseText);
    return null;
  }

  const payload = await response.json() as { access_token?: string; expires_in?: number };
  if (!payload.access_token) return null;

  tokenCache = {
    token: payload.access_token,
    expiresAt: now + Math.max((payload.expires_in ?? 300) - 30, 30) * 1000,
  };
  return tokenCache.token;
}

async function safeResponseText(response: Response): Promise<string> {
  try {
    return truncateUtf8(await response.text(), 512);
  } catch {
    return "";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function ensureShopIdentity(admin: { graphql: (query: string) => Promise<Response> }, shopDomain: string): Promise<string | null> {
  try {
    if (!(prisma as any).shop?.findUnique) return null;

    const existingShop = await (prisma as any).shop.findUnique({
      where: { shopDomain },
      select: { shopifyShopGid: true },
    });

    if (existingShop?.shopifyShopGid) {
      return existingShop.shopifyShopGid;
    }

    const response = await admin.graphql("query WpbAppEventsShopIdentity { shop { id } }");
    if (!response.ok) return null;

    const payload = await response.json() as { data?: { shop?: { id?: string } } };
    const shopifyShopGid = payload.data?.shop?.id ?? null;
    if (!shopifyShopGid) return null;

    await (prisma as any).shop?.update({
      where: { shopDomain },
      data: { shopifyShopGid },
    });

    return shopifyShopGid;
  } catch (error) {
    AppLogger.warn("Failed to ensure Shopify shop identity", {
      component: "app-events",
      shopId: shopDomain,
    }, error);
    return null;
  }
}

export async function getCachedShopifyShopGid(shopDomain: string): Promise<string | null> {
  try {
    const shop = await (prisma as any).shop.findUnique({
      where: { shopDomain },
      select: { shopifyShopGid: true },
    });

    return shop?.shopifyShopGid ?? null;
  } catch (error) {
    AppLogger.warn("Failed to load cached Shopify Shop GID", {
      component: "app-events",
      shopId: shopDomain,
    }, error);
    return null;
  }
}
