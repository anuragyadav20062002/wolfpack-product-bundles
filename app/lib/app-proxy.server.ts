import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyAppProxyRequest(url: URL): string | null {
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const shop = url.searchParams.get("shop");
  const signature = url.searchParams.get("signature");

  if (!apiSecret || !shop || !signature) return null;

  const params = new Map<string, string[]>();

  for (const [key, value] of url.searchParams.entries()) {
    if (key === "signature") continue;
    const values = params.get(key) ?? [];
    values.push(value);
    params.set(key, values);
  }

  const message = [...params.entries()]
    .map(([key, values]) => `${key}=${values.join(",")}`)
    .sort()
    .join("");

  const expected = createHmac("sha256", apiSecret).update(message).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== signatureBuffer.length) return null;
  return timingSafeEqual(expectedBuffer, signatureBuffer) ? shop : null;
}
