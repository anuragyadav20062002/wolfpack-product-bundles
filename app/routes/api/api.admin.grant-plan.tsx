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
 * Used to issue early-access / complimentary invites to existing merchants.
 *
 * Authentication:
 *   Authorization: Bearer <OWNER_API_SECRET>
 *
 * Request body:
 *   {
 *     shopDomain: string   // e.g. "my-store.myshopify.com"
 *   }
 *
 * Success response (200):
 *   { success: true, shopDomain: string, subscriptionId: string }
 *
 * Error responses:
 *   401 — Missing or invalid OWNER_API_SECRET
 *   400 — Missing or invalid shopDomain
 *   404 — Shop not found in database
 *   500 — Unexpected server error
 *
 * Example cURL:
 *   curl -X POST https://your-app.onrender.com/api/admin/grant-plan \
 *     -H "Authorization: Bearer <OWNER_API_SECRET>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"shopDomain":"merchant-store.myshopify.com"}'
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

  const { shopDomain } = (body ?? {}) as Record<string, unknown>;

  if (!shopDomain || typeof shopDomain !== "string" || shopDomain.trim() === "") {
    return json(
      { success: false, error: "shopDomain is required (e.g. my-store.myshopify.com)" },
      { status: 400 }
    );
  }

  const normalizedDomain = shopDomain.trim().toLowerCase();

  AppLogger.info("Owner grant-plan request received", {
    component: "api.admin.grant-plan",
    operation: "action"
  }, { shopDomain: normalizedDomain });

  const result = await BillingService.grantGrowPlan(normalizedDomain);

  if (!result.success) {
    // Distinguish "shop not found" from other errors for a cleaner response
    const isNotFound = result.error?.includes("Shop not found");
    return json(
      { success: false, error: result.error },
      { status: isNotFound ? 404 : 500 }
    );
  }

  AppLogger.info("Grow plan granted successfully via owner API", {
    component: "api.admin.grant-plan",
    operation: "action"
  }, { shopDomain: normalizedDomain, subscriptionId: result.subscriptionId });

  return json({
    success: true,
    shopDomain: normalizedDomain,
    subscriptionId: result.subscriptionId,
    message: `Grow plan granted to ${normalizedDomain}. The merchant will see the upgrade immediately on their next page load.`
  });
}

// GET is not supported — return 405 so the route is not accidentally browsable
export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}
