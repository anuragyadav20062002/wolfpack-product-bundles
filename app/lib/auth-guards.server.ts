import { json } from "@remix-run/node";
import { timingSafeEqual, createHash } from "node:crypto";
import { authenticate } from "../shopify.server";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import type { Session } from "@shopify/shopify-api";

// ─── Admin Session Guard ──────────────────────────────────────────────────────
// Use on routes that require an authenticated Shopify admin session.
// Equivalent to: await authenticate.admin(request)
// Returns: { admin, session }
export async function requireAdminSession(request: Request): Promise<{
  admin: AdminApiContext["admin"];
  session: Session;
}> {
  const { admin, session } = await authenticate.admin(request);
  return { admin, session };
}

// ─── App Proxy Guard ──────────────────────────────────────────────────────────
// Use on routes called via Shopify's app proxy (storefront widget → Shopify CDN → app).
// Equivalent to: await authenticate.public.appProxy(request)
// Returns: { session } — session.shop is the validated shop domain
export async function requireAppProxy(request: Request): Promise<{
  session: Session;
}> {
  const { session } = await authenticate.public.appProxy(request);
  return { session };
}

// ─── Internal Secret Guard ────────────────────────────────────────────────────
// Use on routes called by internal services (e.g. the Pub/Sub worker).
// Checks Authorization: Bearer <INTERNAL_WEBHOOK_SECRET> with constant-time comparison.
//
// Returns null when authorized (caller may proceed).
// Returns a 401 Response when unauthorized (caller must return it immediately).
//
// Usage:
//   const authError = requireInternalSecret(request);
//   if (authError) return authError;
export function requireInternalSecret(request: Request): Response | null {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET;

  // Fail-closed: if env var is unset or empty, reject all requests.
  if (!secret) {
    console.warn(
      "[auth-guards] INTERNAL_WEBHOOK_SECRET is not set — rejecting all internal requests (fail-closed)"
    );
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const prefix = "Bearer ";

  if (!authHeader.startsWith(prefix)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const provided = authHeader.slice(prefix.length);

  // Constant-time comparison via hashing both sides to equal-length buffers.
  // timingSafeEqual requires equal-length inputs; hashing guarantees that
  // regardless of token length, preventing timing side-channel attacks.
  try {
    const a = createHash("sha256").update(provided).digest();
    const b = createHash("sha256").update(secret).digest();
    if (!timingSafeEqual(a, b)) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // Authorized — caller proceeds
}
