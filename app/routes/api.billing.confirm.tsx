import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { BillingService } from "../services/billing.server";
import { AppLogger } from "../lib/logger";

/**
 * API Route: Confirm Subscription
 *
 * GET /api/billing/confirm?charge_id={shopifySubscriptionId}
 *
 * This route is called when merchant returns from Shopify's
 * subscription approval page. It confirms the subscription
 * and activates it.
 *
 * Shopify redirects to returnUrl with query params:
 * - charge_id: Shopify subscription ID (GID)
 * - host: Shopify admin host
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const shopDomain = session.shop;

  try {
    const url = new URL(request.url);
    const shopifySubscriptionId = url.searchParams.get("charge_id");

    if (!shopifySubscriptionId) {
      return json(
        {
          success: false,
          error: "Missing charge_id parameter"
        },
        { status: 400 }
      );
    }

    AppLogger.info("Confirming subscription", {
      component: "api.billing.confirm",
      operation: "loader"
    }, { shop: shopDomain, shopifySubscriptionId });

    const result = await BillingService.confirmSubscription(
      admin,
      shopDomain,
      shopifySubscriptionId
    );

    if (!result.success) {
      return json(
        {
          success: false,
          error: result.error
        },
        { status: 400 }
      );
    }

    return json({
      success: true,
      message: "Subscription confirmed successfully"
    });

  } catch (error) {
    AppLogger.error("Error confirming subscription", {
      component: "api.billing.confirm",
      operation: "loader"
    }, error);

    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
