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
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { BillingService } from "../services/billing.server";
import { PLANS } from "../constants/plans";
import { AppLogger } from "../lib/logger";
import { useCallback, useState, useEffect } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  try {
    // Get subscription info
    const subscriptionInfo = await BillingService.getSubscriptionInfo(shopDomain);

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
      plans: PLANS,
      appUrl: process.env.SHOPIFY_APP_URL || "",
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
        plans: PLANS,
        appUrl: process.env.SHOPIFY_APP_URL || "",
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
      const returnUrl = `${appUrl}/app/billing?upgraded=true`;

      const result = await BillingService.createSubscription(admin, {
        shopDomain,
        plan: "grow",
        returnUrl,
        test: process.env.NODE_ENV !== "production", // Use test charges in development
      });

      if (!result.success) {
        return json(
          { error: result.error },
          { status: 400 }
        );
      }

      // Return confirmation URL for redirect
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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
    setShowCancelConfirm(false);
  }, [fetcher]);

  // Handle redirect to Shopify billing confirmation using window.open (App Bridge v4)
  useEffect(() => {
    if (fetcher.data && "confirmationUrl" in fetcher.data && fetcher.data.confirmationUrl) {
      window.open(fetcher.data.confirmationUrl, '_top');
    }
  }, [fetcher.data]);

  const currentPlan = data.subscription?.plan || "free";
  const isFreePlan = currentPlan === "free";
  const isGrowPlan = currentPlan === "grow";

  return (
    <Page
      title="Subscription & Billing"
      subtitle="Manage your subscription plan and billing settings"
    >
      <Layout>
        {/* Current Plan Status */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Current Plan
                  </Text>
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="p" variant="headingLg">
                      {PLANS[currentPlan].name}
                    </Text>
                    <Badge tone={isFreePlan ? "info" : "success"}>
                      {data.subscription?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </InlineStack>
                </BlockStack>
                {isGrowPlan && (
                  <Text as="p" variant="headingLg" tone="subdued">
                    ${PLANS.grow.price}/month
                  </Text>
                )}
              </InlineStack>

              <Divider />

              {/* Bundle Usage */}
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Bundle Usage
                </Text>
                <InlineStack gap="200" blockAlign="center">
                  <Text as="p" variant="bodyLg">
                    {data.subscription?.currentBundleCount || 0} / {data.subscription?.bundleLimit || 0} bundles
                  </Text>
                  {!data.subscription?.canCreateBundle && (
                    <Badge tone="warning">Limit Reached</Badge>
                  )}
                </InlineStack>
              </BlockStack>

              {isGrowPlan && !showCancelConfirm && (
                <>
                  <Divider />
                  <Button
                    variant="plain"
                    tone="critical"
                    onClick={() => setShowCancelConfirm(true)}
                    loading={isCancelling}
                  >
                    Cancel Subscription
                  </Button>
                </>
              )}

              {showCancelConfirm && (
                <>
                  <Banner tone="warning">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">
                        Are you sure you want to cancel your subscription? You will be downgraded to the Free plan.
                      </Text>
                      {data.subscription && data.subscription.currentBundleCount > PLANS.free.bundleLimit && (
                        <Text as="p" variant="bodyMd" tone="critical">
                          Warning: You have {data.subscription.currentBundleCount} bundles, but the Free plan only allows {PLANS.free.bundleLimit}. Excess bundles will be archived.
                        </Text>
                      )}
                    </BlockStack>
                  </Banner>
                  <InlineStack gap="200">
                    <Button
                      variant="primary"
                      tone="critical"
                      onClick={handleCancelSubscription}
                      loading={isCancelling}
                    >
                      Confirm Cancellation
                    </Button>
                    <Button onClick={() => setShowCancelConfirm(false)}>
                      Keep Subscription
                    </Button>
                  </InlineStack>
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Quick Actions */}
        {isFreePlan && (
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  Want to create more bundles?
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Upgrade to the Grow plan for up to 20 bundles, advanced features, and priority support.
                </Text>
                <Button
                  variant="primary"
                  onClick={handleViewPricing}
                >
                  View Pricing Plans
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Help Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Need Help?
              </Text>
              <Text as="p" variant="bodyMd">
                Have questions about billing or need to upgrade to a custom plan? Contact our support team for assistance.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
