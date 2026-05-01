/**
 * Billing Page Route
 *
 * Manages subscription and billing settings.
 * Uses shared billing components from app/components/billing.
 */

import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { BillingService } from "../../services/billing.server";
import { BundleAnalyticsService } from "../../services/bundle-analytics.server";
import { PLANS } from "../../constants/plans";
import { AppLogger } from "../../lib/logger";
import { useCallback, useEffect, useState } from "react";
import billingStyles from "../../styles/routes/app-billing.module.css";
import { useBillingState } from "../../hooks/useBillingState";
import {
  calculateUsagePercentage,
  getProgressBarTone,
} from "../../utils/pricing";

// Import shared billing components
import {
  UpgradeSuccessBanner,
  SubscriptionErrorBanner,
  UpgradeCTACard,
} from "../../components/billing";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await requireAdminSession(request);
  const shopDomain = session.shop;

  try {
    const url = new URL(request.url);
    const upgraded = url.searchParams.get("upgraded");
    const error = url.searchParams.get("error");

    const subscriptionInfo = await BillingService.getSubscriptionInfo(shopDomain);

    if (!subscriptionInfo) {
      throw new Error("Could not retrieve subscription information");
    }

    const quickStats = await BundleAnalyticsService.getQuickStats(shopDomain);

    return json({
      subscription: {
        plan: subscriptionInfo.plan,
        status: subscriptionInfo.status,
        isActive: subscriptionInfo.isActive,
        bundleLimit: subscriptionInfo.bundleLimit,
        currentBundleCount: subscriptionInfo.currentBundleCount,
        canCreateBundle: subscriptionInfo.canCreateBundle,
      },
      stats: quickStats,
      plans: PLANS,
      appUrl: process.env.SHOPIFY_APP_URL || "",
      upgraded: upgraded === "true",
      callbackError: error || null,
    });
  } catch (error) {
    AppLogger.error("Error loading billing page", {
      component: "app.billing",
      operation: "loader"
    }, error);

    return json(
      {
        error: "Failed to load billing information",
        subscription: null,
        stats: null,
        plans: PLANS,
        appUrl: process.env.SHOPIFY_APP_URL || "",
        upgraded: false,
        callbackError: null,
      },
      { status: 500 }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await requireAdminSession(request);
  const shopDomain = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "upgrade") {
    try {
      const storeHandle = shopDomain.replace(".myshopify.com", "");
      const apiKey = process.env.SHOPIFY_API_KEY;
      const returnUrl = `https://admin.shopify.com/store/${storeHandle}/apps/${apiKey}/app/billing/callback`;

      const result = await BillingService.createSubscription(admin, {
        shopDomain,
        plan: "grow",
        returnUrl,
      });

      if (!result.success) {
        return json({ error: result.error }, { status: 400 });
      }

      return json({ success: true, confirmationUrl: result.confirmationUrl });
    } catch (error) {
      AppLogger.error("Error creating subscription", {
        component: "app.billing",
        operation: "action-upgrade"
      }, error);

      return json({ error: "Failed to create subscription" }, { status: 500 });
    }
  }

  if (intent === "cancel") {
    try {
      const result = await BillingService.cancelSubscription(admin, shopDomain);

      if (!result.success) {
        return json({ error: result.error }, { status: 400 });
      }

      return json({ success: true, message: "Subscription cancelled successfully" });
    } catch (error) {
      AppLogger.error("Error cancelling subscription", {
        component: "app.billing",
        operation: "action-cancel"
      }, error);

      return json({ error: "Failed to cancel subscription" }, { status: 500 });
    }
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}

function CustomProgressBar({ progress, tone }: { progress: number; tone: string }) {
  const barColor =
    tone === "success" ? "#008060" :
    tone === "warning" ? "#ffc453" : "#d82c0d";
  return (
    <div style={{ height: 6, background: "#e3e3e3", borderRadius: 3, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, progress))}%`,
          background: barColor,
          borderRadius: 3,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

export default function BillingPage() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();

  const [showCelebration, setShowCelebration] = useState(data.upgraded);

  const billingState = useBillingState({
    upgraded: data.upgraded,
    callbackError: data.callbackError,
  });
  const {
    showCancelConfirm,
    openCancelConfirm,
    closeCancelConfirm,
    showSuccessBanner,
    dismissSuccessBanner,
    showErrorBanner,
    dismissErrorBanner,
  } = billingState;

  const isCancelling = fetcher.state === "submitting" && fetcher.formData?.get("intent") === "cancel";

  const handleViewPricing = useCallback(() => {
    navigate("/app/pricing");
  }, [navigate]);

  const handleCancelSubscription = useCallback(() => {
    fetcher.submit({ intent: "cancel" }, { method: "post" });
    closeCancelConfirm();
  }, [fetcher, closeCancelConfirm]);

  useEffect(() => {
    if (fetcher.data && "confirmationUrl" in fetcher.data && fetcher.data.confirmationUrl) {
      open(fetcher.data.confirmationUrl, "_top");
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  const currentPlan = data.subscription?.plan || "free";
  const isFreePlan = currentPlan === "free";
  const isGrowPlan = currentPlan === "grow";

  const usagePercentage = data.subscription
    ? calculateUsagePercentage(data.subscription.currentBundleCount, data.subscription.bundleLimit)
    : 0;

  const progressBarTone = getProgressBarTone(usagePercentage);

  return (
    <>
      <ui-title-bar title="Subscription & Billing">
        <button variant="breadcrumb" onClick={() => navigate("/app/dashboard")}>
          Dashboard
        </button>
      </ui-title-bar>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 4px 88px" }}>
        <s-stack direction="block" gap="large">

          {showSuccessBanner && (
            <UpgradeSuccessBanner
              showCelebration={showCelebration}
              onDismiss={dismissSuccessBanner}
            />
          )}

          {showErrorBanner && data.callbackError && (
            <SubscriptionErrorBanner
              errorCode={data.callbackError}
              onRetry={handleViewPricing}
              onDismiss={dismissErrorBanner}
            />
          )}

          {/* Current Plan Status */}
          <s-section>
            <s-stack direction="block" gap="base">
              <s-stack direction="inline" justifyContent="space-between" alignItems="start">
                <s-stack direction="block" gap="small-100">
                  <s-stack direction="inline" alignItems="center" gap="small-100">
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Current Plan</h2>
                    {isGrowPlan && (
                      <div className={billingStyles.starIcon}>
                        <s-icon name="star-filled" />
                      </div>
                    )}
                  </s-stack>
                  <s-stack direction="inline" alignItems="center" gap="small">
                    <span style={{ fontSize: 20, fontWeight: 700 }}>{PLANS[currentPlan].name}</span>
                    <s-badge tone={isGrowPlan ? "success" : "info"}>
                      {data.subscription?.isActive ? "Active" : "Inactive"}
                    </s-badge>
                  </s-stack>
                </s-stack>
                {isGrowPlan && (
                  <s-stack direction="block" gap="small-400" alignItems="end">
                    <span style={{ fontSize: 28, fontWeight: 700 }}>${PLANS.grow.price}</span>
                    <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>per month</p>
                  </s-stack>
                )}
              </s-stack>

              <s-divider />

              {/* Bundle Usage */}
              <s-stack direction="block" gap="small">
                <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Bundle Usage</p>
                  <s-badge
                    tone={
                      usagePercentage >= 90 ? "critical" :
                      usagePercentage >= 70 ? "attention" : "success"
                    }
                  >
                    {`${data.subscription?.currentBundleCount || 0} / ${data.subscription?.bundleLimit || 0} bundles`}
                  </s-badge>
                </s-stack>
                <CustomProgressBar progress={usagePercentage} tone={progressBarTone} />
                {!data.subscription?.canCreateBundle && (
                  <s-banner tone="warning">
                    You&apos;ve reached your bundle limit.
                    {isFreePlan && " Upgrade to Grow for more bundles."}
                  </s-banner>
                )}
              </s-stack>

              {/* Quick Stats */}
              {data.stats && (
                <>
                  <s-divider />
                  <s-stack direction="block" gap="small-100">
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Bundle Overview</p>
                    <s-stack direction="inline" gap="base">
                      <s-stack direction="block" gap="small-400">
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{data.stats.activeBundles}</span>
                        <span style={{ fontSize: 12, color: "#6d7175" }}>Active Bundles</span>
                      </s-stack>
                      <s-stack direction="block" gap="small-400">
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{data.stats.totalSteps}</span>
                        <span style={{ fontSize: 12, color: "#6d7175" }}>Total Steps</span>
                      </s-stack>
                      <s-stack direction="block" gap="small-400">
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{data.stats.bundleTypes.productPage}</span>
                        <span style={{ fontSize: 12, color: "#6d7175" }}>Product Page</span>
                      </s-stack>
                      <s-stack direction="block" gap="small-400">
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{data.stats.bundleTypes.fullPage}</span>
                        <span style={{ fontSize: 12, color: "#6d7175" }}>Full Page</span>
                      </s-stack>
                    </s-stack>
                  </s-stack>
                </>
              )}

              {/* Cancel Subscription */}
              {isGrowPlan && !showCancelConfirm && (
                <>
                  <s-divider />
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#d82c0d",
                      cursor: "pointer",
                      fontSize: 14,
                      textAlign: "left",
                    }}
                    onClick={openCancelConfirm}
                    disabled={isCancelling}
                  >
                    Cancel Subscription
                  </button>
                </>
              )}

              {showCancelConfirm && (
                <>
                  <s-divider />
                  <s-banner tone="warning" heading="Cancel Subscription?">
                    <s-stack direction="block" gap="small">
                      <p style={{ margin: 0, fontSize: 14 }}>
                        You will be downgraded to the Free plan with a limit of {PLANS.free.bundleLimit} bundles.
                      </p>
                      {data.subscription && data.subscription.currentBundleCount > PLANS.free.bundleLimit && (
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                          Warning: You have {data.subscription.currentBundleCount} bundles. The excess{" "}
                          {data.subscription.currentBundleCount - PLANS.free.bundleLimit} bundles will be archived (not deleted).
                        </p>
                      )}
                      <s-stack direction="inline" gap="small-100">
                        <s-button
                          variant="primary"
                          onClick={handleCancelSubscription}
                          loading={isCancelling || undefined}
                        >
                          Confirm Cancellation
                        </s-button>
                        <s-button onClick={closeCancelConfirm}>
                          Keep Subscription
                        </s-button>
                      </s-stack>
                    </s-stack>
                  </s-banner>
                </>
              )}
            </s-stack>
          </s-section>

          {/* Upgrade CTA for Free Users */}
          {isFreePlan && <UpgradeCTACard onUpgrade={handleViewPricing} />}

          {/* Plan Features */}
          <s-section>
            <s-stack direction="block" gap="base">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Your Plan Features</h3>
              <div className={billingStyles.featuresGrid}>
                {PLANS[currentPlan].features.map((feature, index) => (
                  <s-stack key={index} direction="inline" alignItems="center" gap="small-100">
                    <div className={billingStyles.checkIcon}>
                      <s-icon name="check-circle" />
                    </div>
                    <span style={{ fontSize: 14 }}>{feature}</span>
                  </s-stack>
                ))}
              </div>
              {isFreePlan && (
                <>
                  <s-divider />
                  <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                    Want more features?{" "}
                    <s-button variant="tertiary" onClick={handleViewPricing}>
                      View all plans
                    </s-button>
                  </p>
                </>
              )}
            </s-stack>
          </s-section>

          {/* Help Section */}
          <s-section>
            <s-stack direction="block" gap="small-100">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Need Help?</h3>
              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                Have questions about billing or need a custom plan? Our team is here to help.
              </p>
              <s-button
                onClick={() => {
                  if (window.$crisp) {
                    window.$crisp.push(["do", "chat:open"]);
                  }
                }}
              >
                Contact Support
              </s-button>
            </s-stack>
          </s-section>

        </s-stack>
      </div>
    </>
  );
}

declare global {
  interface Window {
    $crisp?: any[];
  }
}
