import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireOwnerSecret } from "../../lib/auth-guards.server";
import { BillingService } from "../../services/billing.server";
import { AppLogger } from "../../lib/logger";

/**
 * Owner-only API: Grant Grow Plan
 *
 * POST /api/admin/grant-plan
 *
 * Grants a merchant the Grow plan for free — no Shopify billing flow.
 * The grant expires server-side after `days` days (default 14). After expiry
 * the merchant is automatically demoted to Free plan on their next request.
 * Call this endpoint again to renew / extend access.
 *
 * Authentication:
 *   Authorization: Bearer <OWNER_API_SECRET>
 *
 * Request body:
 *   {
 *     shopDomain: string   // e.g. "my-store.myshopify.com"
 *     days?: number        // grant duration in days (default: 14, max: 90)
 *   }
 *
 * Success response (200):
 *   {
 *     success: true,
 *     shopDomain: string,
 *     subscriptionId: string,
 *     expiresAt: string,   // ISO 8601 — when the grant expires
 *     message: string
 *   }
 *
 * Error responses:
 *   401 — Missing or invalid OWNER_API_SECRET
 *   400 — Missing / invalid shopDomain, or days out of range
 *   404 — Shop not found in database (merchant has never installed the app)
 *   500 — Unexpected server error
 *
 * Example — grant 14-day access:
 *   curl -X POST https://your-app.onrender.com/api/admin/grant-plan \
 *     -H "Authorization: Bearer $OWNER_API_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"shopDomain":"merchant-store.myshopify.com"}'
 *
 * Example — extend to 30 days:
 *   curl -X POST https://your-app.onrender.com/api/admin/grant-plan \
 *     -H "Authorization: Bearer $OWNER_API_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"shopDomain":"merchant-store.myshopify.com","days":30}'
 */
export async function action({ request }: ActionFunctionArgs) {
  // ── Owner authentication ──────────────────────────────────────────────────
  const authError = requireOwnerSecret(request);
  if (authError) return authError;

  // ── Only accept POST ──────────────────────────────────────────────────────
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { shopDomain, days: rawDays } = (body ?? {}) as Record<string, unknown>;

  // ── Validate shopDomain ───────────────────────────────────────────────────
  if (!shopDomain || typeof shopDomain !== "string" || shopDomain.trim() === "") {
    return json(
      { success: false, error: "shopDomain is required (e.g. my-store.myshopify.com)" },
      { status: 400 }
    );
  }

  // ── Validate days (optional, default 14, max 90) ──────────────────────────
  let days = 14;
  if (rawDays !== undefined) {
    const parsed = Number(rawDays);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 90) {
      return json(
        { success: false, error: "days must be an integer between 1 and 90" },
        { status: 400 }
      );
    }
    days = parsed;
  }

  const normalizedDomain = shopDomain.trim().toLowerCase();

  AppLogger.info("Owner grant-plan request received", {
    component: "api.admin.grant-plan",
    operation: "action"
  }, { shopDomain: normalizedDomain, days });

  const result = await BillingService.grantGrowPlan(normalizedDomain, days);

  if (!result.success) {
    const isNotFound = result.error?.includes("Shop not found");
    return json(
      { success: false, error: result.error },
      { status: isNotFound ? 404 : 500 }
    );
  }

  AppLogger.info("Grow plan granted successfully via owner API", {
    component: "api.admin.grant-plan",
    operation: "action"
  }, {
    shopDomain: normalizedDomain,
    subscriptionId: result.subscriptionId,
    days,
    expiresAt: result.expiresAt?.toISOString()
  });

  return json({
    success: true,
    shopDomain: normalizedDomain,
    subscriptionId: result.subscriptionId,
    expiresAt: result.expiresAt?.toISOString(),
    message: `Grow plan granted to ${normalizedDomain} for ${days} day${days === 1 ? "" : "s"} (expires ${result.expiresAt?.toDateString()}). Hit this endpoint again to renew.`
  });
}

// GET is not supported — return 405 so the route is not accidentally browsable
export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}
