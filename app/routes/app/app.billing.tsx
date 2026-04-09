/**
 * Billing Page Route
 *
 * Manages subscription and billing settings.
 * Uses shared billing components from app/components/billing.
 */

import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  Banner,
  Divider,
  ProgressBar,
  Icon,
} from "@shopify/polaris";
import { CheckCircleIcon, AlertTriangleIcon, StarFilledIcon } from "@shopify/polaris-icons";
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

    // Get subscription info
    const subscriptionInfo = await BillingService.getSubscriptionInfo(shopDomain);

    if (!subscriptionInfo) {
      throw new Error("Could not retrieve subscription information");
    }

    // Get quick stats for display
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
      // Pass callback status to UI
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
        return json(
          { error: result.error },
          { status: 400 }
        );
      }

      return json({
        success: true,
        confirmationUrl: result.confirmationUrl,
      });

    } catch (error) {
      AppLogger.error("Error creating subscription", {
        component: "app.billing",
        operation: "action-upgrade"
      }, error);

      return json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }
  }

  if (intent === "cancel") {
    try {
      const result = await BillingService.cancelSubscription(admin, shopDomain);

      if (!result.success) {
        return json(
          { error: result.error },
          { status: 400 }
        );
      }

      return json({ success: true, message: "Subscription cancelled successfully" });

    } catch (error) {
      AppLogger.error("Error cancelling subscription", {
        component: "app.billing",
        operation: "action-cancel"
      }, error);

      return json(
        { error: "Failed to cancel subscription" },
        { status: 500 }
      );
    }
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}

export default function BillingPage() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();

  // State for celebration animation
  const [showCelebration, setShowCelebration] = useState(data.upgraded);

  // Use centralized billing state hook
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
    fetcher.submit(
      { intent: "cancel" },
      { method: "post" }
    );
    closeCancelConfirm();
  }, [fetcher, closeCancelConfirm]);

  // Handle redirect to Shopify billing confirmation
  useEffect(() => {
    if (fetcher.data && "confirmationUrl" in fetcher.data && fetcher.data.confirmationUrl) {
      open(fetcher.data.confirmationUrl, '_top');
    }
  }, [fetcher.data]);

  // Auto-hide celebration after 5 seconds
  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  const currentPlan = data.subscription?.plan || "free";
  const isFreePlan = currentPlan === "free";
  const isGrowPlan = currentPlan === "grow";

  // Calculate usage percentage using shared utility
  const usagePercentage = data.subscription
    ? calculateUsagePercentage(data.subscription.currentBundleCount, data.subscription.bundleLimit)
    : 0;

  const progressBarTone = getProgressBarTone(usagePercentage);

  return (
    <Page
      title="Subscription & Billing"
      subtitle="Manage your subscription plan and billing settings"
      backAction={{ content: "Dashboard", onAction: () => navigate("/app/dashboard") }}
    >
      <Layout>
        {/* Success Celebration Banner */}
        {showSuccessBanner && (
          <Layout.Section>
            <UpgradeSuccessBanner
              showCelebration={showCelebration}
              onDismiss={dismissSuccessBanner}
            />
          </Layout.Section>
        )}

        {/* Error Banner */}
        {showErrorBanner && data.callbackError && (
          <Layout.Section>
            <SubscriptionErrorBanner
              errorCode={data.callbackError}
              onRetry={handleViewPricing}
              onDismiss={dismissErrorBanner}
            />
          </Layout.Section>
        )}

        {/* Current Plan Status */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="start">
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Current Plan
                    </Text>
                    {isGrowPlan && (
                      <div className={billingStyles.starIcon}>
                        <Icon source={StarFilledIcon} />
                      </div>
                    )}
                  </InlineStack>
                  <InlineStack gap="300" blockAlign="center">
                    <Text as="p" variant="headingLg" fontWeight="bold">
                      {PLANS[currentPlan].name}
                    </Text>
                    <Badge tone={isGrowPlan ? "success" : "info"}>
                      {data.subscription?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </InlineStack>
                </BlockStack>
                {isGrowPlan && (
                  <BlockStack gap="100" align="end">
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      ${PLANS.grow.price}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      per month
                    </Text>
                  </BlockStack>
                )}
              </InlineStack>

              <Divider />

              {/* Bundle Usage with Progress Bar */}
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Bundle Usage
                  </Text>
                  <Badge tone={usagePercentage >= 90 ? "critical" : usagePercentage >= 70 ? "attention" : "success"}>
                    {`${data.subscription?.currentBundleCount || 0} / ${data.subscription?.bundleLimit || 0} bundles`}
                  </Badge>
                </InlineStack>
                <ProgressBar
                  progress={usagePercentage}
                  tone={progressBarTone}
                  size="small"
                />
                {!data.subscription?.canCreateBundle && (
                  <Banner tone="warning">
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={AlertTriangleIcon} tone="warning" />
                      <Text as="span" variant="bodyMd">
                        You've reached your bundle limit.
                        {isFreePlan && " Upgrade to Grow for more bundles."}
                      </Text>
                    </InlineStack>
                  </Banner>
                )}
              </BlockStack>

              {/* Quick Stats */}
              {data.stats && (
                <>
                  <Divider />
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Bundle Overview
                    </Text>
                    <InlineStack gap="400">
                      <BlockStack gap="100">
                        <Text as="span" variant="headingMd" fontWeight="bold">
                          {data.stats.activeBundles}
                        </Text>
                        <Text as="span" variant="bodySm" tone="subdued">
                          Active Bundles
                        </Text>
                      </BlockStack>
                      <BlockStack gap="100">
                        <Text as="span" variant="headingMd" fontWeight="bold">
                          {data.stats.totalSteps}
                        </Text>
                        <Text as="span" variant="bodySm" tone="subdued">
                          Total Steps
                        </Text>
                      </BlockStack>
                      <BlockStack gap="100">
                        <Text as="span" variant="headingMd" fontWeight="bold">
                          {data.stats.bundleTypes.productPage}
                        </Text>
                        <Text as="span" variant="bodySm" tone="subdued">
                          Product Page
                        </Text>
                      </BlockStack>
                      <BlockStack gap="100">
                        <Text as="span" variant="headingMd" fontWeight="bold">
                          {data.stats.bundleTypes.fullPage}
                        </Text>
                        <Text as="span" variant="bodySm" tone="subdued">
                          Full Page
                        </Text>
                      </BlockStack>
                    </InlineStack>
                  </BlockStack>
                </>
              )}

              {/* Cancel Subscription */}
              {isGrowPlan && !showCancelConfirm && (
                <>
                  <Divider />
                  <Button
                    variant="plain"
                    tone="critical"
                    onClick={openCancelConfirm}
                    loading={isCancelling}
                  >
                    Cancel Subscription
                  </Button>
                </>
              )}

              {showCancelConfirm && (
                <>
                  <Divider />
                  <Banner tone="warning" title="Cancel Subscription?">
                    <BlockStack gap="300">
                      <Text as="p" variant="bodyMd">
                        You will be downgraded to the Free plan with a limit of {PLANS.free.bundleLimit} bundles.
                      </Text>
                      {data.subscription && data.subscription.currentBundleCount > PLANS.free.bundleLimit && (
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          Warning: You have {data.subscription.currentBundleCount} bundles. The excess {data.subscription.currentBundleCount - PLANS.free.bundleLimit} bundles will be archived (not deleted).
                        </Text>
                      )}
                      <InlineStack gap="200">
                        <Button
                          variant="primary"
                          tone="critical"
                          onClick={handleCancelSubscription}
                          loading={isCancelling}
                        >
                          Confirm Cancellation
                        </Button>
                        <Button onClick={closeCancelConfirm}>
                          Keep Subscription
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Banner>
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Upgrade CTA for Free Users */}
        {isFreePlan && (
          <Layout.Section>
            <UpgradeCTACard onUpgrade={handleViewPricing} />
          </Layout.Section>
        )}

        {/* Plan Features */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Your Plan Features
              </Text>
              <div className={billingStyles.featuresGrid}>
                {PLANS[currentPlan].features.map((feature, index) => (
                  <InlineStack key={index} gap="200" blockAlign="center">
                    <div className={billingStyles.checkIcon}>
                      <Icon source={CheckCircleIcon} tone="success" />
                    </div>
                    <Text as="span" variant="bodyMd">
                      {feature}
                    </Text>
                  </InlineStack>
                ))}
              </div>
              {isFreePlan && (
                <>
                  <Divider />
                  <Text as="p" variant="bodySm" tone="subdued">
                    Want more features?{" "}
                    <Button variant="plain" onClick={handleViewPricing}>
                      View all plans
                    </Button>
                  </Text>
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Help Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Need Help?
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Have questions about billing or need a custom plan? Our team is here to help.
              </Text>
              <Button
                onClick={() => {
                  if (window.$crisp) {
                    window.$crisp.push(["do", "chat:open"]);
                  }
                }}
              >
                Contact Support
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// Type declaration for Crisp chat
declare global {
  interface Window {
    $crisp?: any[];
  }
}
