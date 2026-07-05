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
import { getCachedSubscriptionInfo, getSubscriptionInfoFromCache } from "../../services/subscription-cache.server";
import { BundleAnalyticsService } from "../../services/bundle-analytics.server";
import { PLANS } from "../../constants/plans";
import { AppLogger } from "../../lib/logger";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import billingStyles from "../../styles/routes/app-billing.module.css";
import { useBillingState } from "../../hooks/useBillingState";
import {
  calculateUsagePercentage,
  getProgressBarTone,
} from "../../utils/pricing";
import { navigateBackOrFallback } from "../../lib/navigation";
import { openSupportChat } from "../../lib/support-chat.client";

// Import shared billing components
import {
  UpgradeSuccessBanner,
  SubscriptionErrorBanner,
} from "../../components/billing";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await requireAdminSession(request);
  const shopDomain = session.shop;

  try {
    const url = new URL(request.url);
    const upgraded = url.searchParams.get("upgraded");
    const error = url.searchParams.get("error");

    const cachedSubscriptionInfo = getCachedSubscriptionInfo(shopDomain);
    const subscriptionInfoPromise = cachedSubscriptionInfo !== undefined
      ? Promise.resolve(cachedSubscriptionInfo)
      : getSubscriptionInfoFromCache(shopDomain);

    const [subscriptionInfo, quickStats] = await Promise.all([
      subscriptionInfoPromise,
      BundleAnalyticsService.getQuickStats(shopDomain),
    ]);

    if (!subscriptionInfo) {
      throw new Error("Could not retrieve subscription information");
    }

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
  const { t } = useTranslation();

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
      <ui-title-bar title={t("billing.route.title")}>
        <button
          variant="breadcrumb"
          onClick={() =>
            navigateBackOrFallback(navigate, "/app/dashboard", { replaceFallback: true })
          }
        >
          {t("billing.route.dashboard")}
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
              onRetry={dismissErrorBanner}
              onDismiss={dismissErrorBanner}
            />
          )}

          {/* Current Plan Status */}
          <s-section>
            <s-stack direction="block" gap="base">
              <s-stack direction="inline" justifyContent="space-between" alignItems="start">
                <s-stack direction="block" gap="small-100">
                  <s-stack direction="inline" alignItems="center" gap="small-100">
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{t("billing.route.currentPlan")}</h2>
                    {isGrowPlan && (
                      <div className={billingStyles.starIcon}>
                        <s-icon type="check" />
                      </div>
                    )}
                  </s-stack>
                  <s-stack direction="inline" alignItems="center" gap="small">
                    <span style={{ fontSize: 20, fontWeight: 700 }}>{PLANS[currentPlan].name}</span>
                    <s-badge tone={isGrowPlan ? "success" : "info"}>
                      {data.subscription?.isActive ? t("billing.route.active") : t("billing.route.inactive")}
                    </s-badge>
                  </s-stack>
                </s-stack>
                {isGrowPlan && (
                  <s-stack direction="block" gap="small-400" alignItems="end">
                    <span style={{ fontSize: 28, fontWeight: 700 }}>${PLANS.grow.price}</span>
                    <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>{t("billing.cards.perMonth")}</p>
                  </s-stack>
                )}
              </s-stack>

              <s-divider />

              {/* Bundle Usage */}
              <s-stack direction="block" gap="small">
                <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{t("billing.route.bundleUsage")}</p>
                  <s-badge
                    tone={
                      usagePercentage >= 90 ? "critical" :
                      usagePercentage >= 70 ? "warning" : "success"
                    }
                  >
                    {t("billing.route.bundleCount", { current: data.subscription?.currentBundleCount || 0, limit: data.subscription?.bundleLimit || 0 })}
                  </s-badge>
                </s-stack>
                <CustomProgressBar progress={usagePercentage} tone={progressBarTone} />
                {!data.subscription?.canCreateBundle && (
                  <s-banner tone="warning">
                    {t("billing.route.limitReached")}
                    {isFreePlan && ` ${t("billing.route.limitUpgrade")}`}
                  </s-banner>
                )}
              </s-stack>

              {/* Quick Stats */}
              {data.stats && (
                <>
                  <s-divider />
                  <s-stack direction="block" gap="small-100">
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{t("billing.route.overview")}</p>
                    <s-stack direction="inline" gap="base">
                      <s-stack direction="block" gap="small-400">
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{data.stats.activeBundles}</span>
                        <span style={{ fontSize: 12, color: "#6d7175" }}>{t("billing.route.activeBundles")}</span>
                      </s-stack>
                      <s-stack direction="block" gap="small-400">
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{data.stats.totalSteps}</span>
                        <span style={{ fontSize: 12, color: "#6d7175" }}>{t("billing.route.totalSteps")}</span>
                      </s-stack>
                      <s-stack direction="block" gap="small-400">
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{data.stats.bundleTypes.productPage}</span>
                        <span style={{ fontSize: 12, color: "#6d7175" }}>{t("billing.route.productPage")}</span>
                      </s-stack>
                      <s-stack direction="block" gap="small-400">
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{data.stats.bundleTypes.fullPage}</span>
                        <span style={{ fontSize: 12, color: "#6d7175" }}>{t("billing.route.fullPage")}</span>
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
                    {t("billing.route.cancelSubscription")}
                  </button>
                </>
              )}

              {showCancelConfirm && (
                <>
                  <s-divider />
                  <s-banner tone="warning" heading={t("billing.route.cancelHeading")}>
                    <s-stack direction="block" gap="small">
                      <p style={{ margin: 0, fontSize: 14 }}>
                        {t("billing.route.downgradeBody", { limit: PLANS.free.bundleLimit })}
                      </p>
                      {data.subscription && data.subscription.currentBundleCount > PLANS.free.bundleLimit && (
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                          {t("billing.route.archiveWarning", { current: data.subscription.currentBundleCount, excess: data.subscription.currentBundleCount - PLANS.free.bundleLimit })}
                        </p>
                      )}
                      <s-stack direction="inline" gap="small-100">
                        <s-button
                          variant="primary"
                          onClick={handleCancelSubscription}
                          loading={isCancelling || undefined}
                        >
                          {t("billing.route.confirmCancellation")}
                        </s-button>
                        <s-button onClick={closeCancelConfirm}>
                          {t("billing.route.keepSubscription")}
                        </s-button>
                      </s-stack>
                    </s-stack>
                  </s-banner>
                </>
              )}
            </s-stack>
          </s-section>

          {/* Plan Features */}
          <s-section>
            <s-stack direction="block" gap="base">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{t("billing.route.features")}</h3>
              <div className={billingStyles.featuresGrid}>
                {PLANS[currentPlan].features.map((feature, index) => (
                  <s-stack key={index} direction="inline" alignItems="center" gap="small-100">
                    <div className={billingStyles.checkIcon}>
                      <s-icon type="check" />
                    </div>
                    <span style={{ fontSize: 14 }}>{feature}</span>
                  </s-stack>
                ))}
              </div>
            </s-stack>
          </s-section>

          {/* Help Section */}
          <s-section>
            <s-stack direction="block" gap="small-100">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{t("billing.route.needHelp")}</h3>
              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                {t("billing.route.helpBody")}
              </p>
              <s-button
                onClick={() => openSupportChat()}
              >
                {t("billing.actions.contactSupport")}
              </s-button>
            </s-stack>
          </s-section>

        </s-stack>
      </div>
    </>
  );
}
