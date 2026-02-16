import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import { BillingService } from "../../services/billing.server";
import { AppLogger } from "../../lib/logger";

/**
 * API Route: Get Subscription Status
 *
 * GET /api/billing/status
 *
 * Returns current subscription information for the shop
 * including plan, bundle limits, and feature access
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  try {
    AppLogger.info("Getting subscription status", {
      component: "api.billing.status",
      operation: "loader"
    }, { shop: shopDomain });

    const subscriptionInfo = await BillingService.getSubscriptionInfo(shopDomain);

    if (!subscriptionInfo) {
      return json(
        {
          success: false,
          error: "Could not retrieve subscription information"
        },
        { status: 500 }
      );
    }

    return json({
      success: true,
      subscription: {
        plan: subscriptionInfo.plan,
        status: subscriptionInfo.status,
        isActive: subscriptionInfo.isActive,
        bundleLimit: subscriptionInfo.bundleLimit,
        currentBundleCount: subscriptionInfo.currentBundleCount,
        canCreateBundle: subscriptionInfo.canCreateBundle
      }
    });

  } catch (error) {
    AppLogger.error("Error getting subscription status", {
      component: "api.billing.status",
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
