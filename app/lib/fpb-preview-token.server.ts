import { createHmac, timingSafeEqual } from "node:crypto";

export const FPB_PREVIEW_TOKEN_TTL_MS = 15 * 60 * 1000;
const FPB_PREVIEW_KEY_CONTEXT = "wolfpack:fpb-preview:v1";

interface FpbPreviewTokenPayload {
  version: 1;
  shop: string;
  bundleId: string;
  expiresAt: number;
}

function getPreviewSigningKey(apiSecret: string): Buffer {
  return createHmac("sha256", apiSecret)
    .update(FPB_PREVIEW_KEY_CONTEXT)
    .digest();
}

function signEncodedPayload(encodedPayload: string, apiSecret: string): string {
  return createHmac("sha256", getPreviewSigningKey(apiSecret))
    .update(encodedPayload)
    .digest("base64url");
}

export function createFpbPreviewToken(input: {
  shop: string;
  bundleId: string;
  apiSecret?: string;
  now?: number;
}): string {
  const apiSecret = input.apiSecret ?? process.env.SHOPIFY_API_SECRET;
  if (!apiSecret) throw new Error("SHOPIFY_API_SECRET is required for FPB previews");

  const payload: FpbPreviewTokenPayload = {
    version: 1,
    shop: input.shop,
    bundleId: input.bundleId,
    expiresAt: (input.now ?? Date.now()) + FPB_PREVIEW_TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signEncodedPayload(encodedPayload, apiSecret)}`;
}

export function verifyFpbPreviewToken(input: {
  token: string | null;
  shop: string;
  bundleId: string;
  apiSecret?: string;
  now?: number;
}): boolean {
  const apiSecret = input.apiSecret ?? process.env.SHOPIFY_API_SECRET;
  if (!apiSecret || !input.token) return false;

  const [encodedPayload, signature, extra] = input.token.split(".");
  if (!encodedPayload || !signature || extra !== undefined) return false;

  const expected = Buffer.from(signEncodedPayload(encodedPayload, apiSecret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<FpbPreviewTokenPayload>;
    return payload.version === 1
      && payload.shop === input.shop
      && payload.bundleId === input.bundleId
      && typeof payload.expiresAt === "number"
      && payload.expiresAt > (input.now ?? Date.now());
  } catch {
    return false;
  }
}
