import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { BillingService } from "../../services/billing.server";
import { AppLogger } from "../../lib/logger";

/**
 * API Route: Create Subscription
 *
 * POST /api/billing/create
 *
 * Creates a new subscription and returns confirmation URL
 * for merchant approval in Shopify admin
 *
 * Body:
 * {
 *   plan: "grow",
 *   returnUrl: "https://your-app.com/billing/confirm"
 * }
 */
export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await requireAdminSession(request);
  const shopDomain = session.shop;

  try {
    const body = await request.json();
    const { plan, returnUrl, test } = body;

    if (!plan) {
      return json(
        {
          success: false,
          error: "Plan is required"
        },
        { status: 400 }
      );
    }

    if (!returnUrl) {
      return json(
        {
          success: false,
          error: "Return URL is required"
        },
        { status: 400 }
      );
    }

    if (plan !== "grow") {
      return json(
        {
          success: false,
          error: "Invalid plan. Only 'grow' plan can be created."
        },
        { status: 400 }
      );
    }

    AppLogger.info("Creating subscription", {
      component: "api.billing.create",
      operation: "action"
    }, { shop: shopDomain, plan });

    const result = await BillingService.createSubscription(admin, {
      shopDomain,
      plan,
      returnUrl,
      test: test !== undefined ? test : true
    });

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
      confirmationUrl: result.confirmationUrl,
      subscriptionId: result.subscriptionId
    });

  } catch (error) {
    AppLogger.error("Error creating subscription", {
      component: "api.billing.create",
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
