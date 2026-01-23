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
import { authenticate } from "../shopify.server";
import { BillingService } from "../services/billing.server";
import { BundleAnalyticsService } from "../services/bundle-analytics.server";
import { PLANS } from "../constants/plans";
import { AppLogger } from "../lib/logger";
import { useCallback, useEffect, useState } from "react";
import { useBillingState } from "../hooks/useBillingState";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
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
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "upgrade") {
    try {
      const appUrl = process.env.SHOPIFY_APP_URL || "";
      const returnUrl = `${appUrl}/app/billing/callback`;

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

  const isUpgrading = fetcher.state === "submitting" && fetcher.formData?.get("intent") === "upgrade";
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

  // Calculate usage percentage
  const usagePercentage = data.subscription
    ? Math.round((data.subscription.currentBundleCount / data.subscription.bundleLimit) * 100)
    : 0;

  const progressBarTone = usagePercentage >= 90 ? "critical" : usagePercentage >= 70 ? "highlight" : "success";

  return (
    <Page
      title="Subscription & Billing"
      subtitle="Manage your subscription plan and billing settings"
    >
      <Layout>
        {/* Success Celebration Banner */}
        {showSuccessBanner && (
          <Layout.Section>
            <div style={{
              background: 'linear-gradient(135deg, #008060 0%, #00a47c 100%)',
              borderRadius: '12px',
              padding: '24px',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Confetti effect (CSS-based) */}
              {showCelebration && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  background: `
                    radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 2px, transparent 2px),
                    radial-gradient(circle at 40% 70%, rgba(255,255,255,0.15) 3px, transparent 3px),
                    radial-gradient(circle at 60% 20%, rgba(255,255,255,0.1) 2px, transparent 2px),
                    radial-gradient(circle at 80% 50%, rgba(255,255,255,0.12) 2px, transparent 2px)
                  `,
                }} />
              )}

              <BlockStack gap="300">
                <InlineStack gap="300" blockAlign="center">
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    padding: '8px',
                    display: 'flex',
                  }}>
                    <Icon source={CheckCircleIcon} tone="inherit" />
                  </div>
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingLg" fontWeight="bold">
                      Welcome to the Grow Plan! 🎉
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Your subscription has been activated. You now have access to all premium features.
                    </Text>
                  </BlockStack>
                </InlineStack>

                <InlineStack gap="400" wrap={false}>
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    flex: 1,
                  }}>
                    <BlockStack gap="100">
                      <Text as="span" variant="bodySm">Bundle Limit</Text>
                      <Text as="span" variant="headingMd" fontWeight="bold">20 bundles</Text>
                    </BlockStack>
                  </div>
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    flex: 1,
                  }}>
                    <BlockStack gap="100">
                      <Text as="span" variant="bodySm">Design Control</Text>
                      <Text as="span" variant="headingMd" fontWeight="bold">Full Access</Text>
                    </BlockStack>
                  </div>
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    flex: 1,
                  }}>
                    <BlockStack gap="100">
                      <Text as="span" variant="bodySm">Support</Text>
                      <Text as="span" variant="headingMd" fontWeight="bold">Priority</Text>
                    </BlockStack>
                  </div>
                </InlineStack>

                <Button onClick={dismissSuccessBanner} variant="monochromePlain">
                  Dismiss
                </Button>
              </BlockStack>
            </div>
          </Layout.Section>
        )}

        {/* Error Banner */}
        {showErrorBanner && data.callbackError && (
          <Layout.Section>
            <Banner
              tone="critical"
              onDismiss={dismissErrorBanner}
              title="Subscription Issue"
            >
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  {data.callbackError === "missing_charge_id"
                    ? "Subscription confirmation failed: Missing charge ID."
                    : data.callbackError === "confirmation_failed"
                    ? "Failed to confirm subscription with Shopify."
                    : "An unexpected error occurred during subscription setup."}
                </Text>
                <InlineStack gap="200">
                  <Button onClick={handleViewPricing} variant="plain">
                    Try Again
                  </Button>
                  <Button
                    onClick={() => {
                      if (window.$crisp) {
                        window.$crisp.push(["do", "chat:open"]);
                      }
                    }}
                    variant="plain"
                  >
                    Contact Support
                  </Button>
                </InlineStack>
              </BlockStack>
            </Banner>
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
                      <div style={{ color: '#ffc453' }}>
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
                    {data.subscription?.currentBundleCount || 0} / {data.subscription?.bundleLimit || 0} bundles
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
                          ⚠️ You have {data.subscription.currentBundleCount} bundles. The excess {data.subscription.currentBundleCount - PLANS.free.bundleLimit} bundles will be archived (not deleted).
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
            <Card>
              <div style={{
                background: 'linear-gradient(135deg, #f6f6f7 0%, #ebeced 100%)',
                borderRadius: '8px',
                padding: '20px',
                margin: '-16px',
              }}>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{
                      backgroundColor: '#ffc96b',
                      borderRadius: '50%',
                      padding: '8px',
                      display: 'flex',
                    }}>
                      <Icon source={StarFilledIcon} />
                    </div>
                    <Text as="h3" variant="headingMd">
                      Ready to grow your bundle business?
                    </Text>
                  </InlineStack>

                  <Text as="p" variant="bodyMd">
                    Upgrade to the Grow plan for double the bundles, full design customization, and priority support.
                  </Text>

                  <InlineStack gap="200">
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}>
                      <Text as="span" variant="bodySm" fontWeight="semibold">
                        20 bundles
                      </Text>
                    </div>
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}>
                      <Text as="span" variant="bodySm" fontWeight="semibold">
                        Design Control Panel
                      </Text>
                    </div>
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}>
                      <Text as="span" variant="bodySm" fontWeight="semibold">
                        Priority Support
                      </Text>
                    </div>
                  </InlineStack>

                  <InlineStack align="space-between" blockAlign="center">
                    <Button
                      variant="primary"
                      onClick={handleViewPricing}
                    >
                      Upgrade to Grow - $9.99/month
                    </Button>
                    <Text as="span" variant="bodySm" tone="subdued">
                      Cancel anytime
                    </Text>
                  </InlineStack>
                </BlockStack>
              </div>
            </Card>
          </Layout.Section>
        )}

        {/* Plan Features */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Your Plan Features
              </Text>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}>
                {PLANS[currentPlan].features.map((feature, index) => (
                  <InlineStack key={index} gap="200" blockAlign="center">
                    <div style={{ color: '#008060' }}>
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
