import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import { BillingService } from "../../services/billing.server";
import { AppLogger } from "../../lib/logger";

/**
 * API Route: Cancel Subscription
 *
 * POST /api/billing/cancel
 *
 * Cancels the current subscription and downgrades to free plan
 * Archives excess bundles if over free plan limit (3 bundles)
 */
export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  try {
    AppLogger.info("Cancelling subscription", {
      component: "api.billing.cancel",
      operation: "action"
    }, { shop: shopDomain });

    const result = await BillingService.cancelSubscription(admin, shopDomain);

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
      message: "Subscription cancelled successfully"
    });

  } catch (error) {
    AppLogger.error("Error cancelling subscription", {
      component: "api.billing.cancel",
      operation: "action"
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
