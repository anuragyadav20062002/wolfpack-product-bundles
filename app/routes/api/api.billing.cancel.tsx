import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { BillingService } from "../../services/billing.server";
import { AppLogger } from "../../lib/logger";
import { ensureShopIdentity, recordBusinessEvent } from "../../services/app-events.server";

/**
 * API Route: Cancel Subscription
 *
 * POST /api/billing/cancel
 *
 * Cancels the current subscription and downgrades to free plan
 * Archives excess bundles if over free plan limit (3 bundles)
 */
export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await requireAdminSession(request);
  const shopDomain = session.shop;
  const shopifyShopGid = await ensureShopIdentity(admin, shopDomain);

  try {
    AppLogger.info("Cancelling subscription", {
      component: "api.billing.cancel",
      operation: "action"
    }, { shop: shopDomain });

    await recordBusinessEvent({
      eventHandle: "billing_cancel_started",
      shopDomain,
      shopifyShopGid,
      surface: "admin",
      actor: "merchant",
      routeFamily: "billing",
      attributes: { plan: "grow" },
    });

    const result = await BillingService.cancelSubscription(admin, shopDomain);

    if (!result.success) {
      await recordBusinessEvent({
        eventHandle: "billing_cancel_failed",
        shopDomain,
        shopifyShopGid,
        surface: "admin",
        actor: "merchant",
        routeFamily: "billing",
        result: "failure",
        errorCode: "subscription_cancel_failed",
        attributes: {
          error_message_safe: result.error ?? "Subscription cancellation failed",
        },
      });
      return json(
        {
          success: false,
          error: result.error
        },
        { status: 400 }
      );
    }

    await recordBusinessEvent({
      eventHandle: "billing_cancelled",
      shopDomain,
      shopifyShopGid,
      surface: "admin",
      actor: "merchant",
      routeFamily: "billing",
      result: "success",
      attributes: { plan: "free" },
    });

    return json({
      success: true,
      message: "Subscription cancelled successfully"
    });

  } catch (error) {
    AppLogger.error("Error cancelling subscription", {
      component: "api.billing.cancel",
      operation: "action"
    }, error);

    await recordBusinessEvent({
      eventHandle: "billing_cancel_failed",
      shopDomain,
      shopifyShopGid,
      surface: "admin",
      actor: "merchant",
      routeFamily: "billing",
      result: "failure",
      errorCode: "exception",
      attributes: {
        error_message_safe: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
