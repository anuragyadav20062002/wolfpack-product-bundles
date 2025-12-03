import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  List,
  Box,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { BillingService } from "../services/billing.server";
import { PLANS } from "../constants/plans";
import { AppLogger } from "../lib/logger";
import { useCallback, useEffect } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  try {
    // Get subscription info to show current plan
    const subscriptionInfo = await BillingService.getSubscriptionInfo(shopDomain);

    if (!subscriptionInfo) {
      throw new Error("Could not retrieve subscription information");
    }

    return json({
      currentPlan: subscriptionInfo.plan,
      plans: PLANS,
    });
  } catch (error) {
    AppLogger.error("Error loading pricing page", {
      component: "app.pricing",
      operation: "loader"
    }, error);

    return json(
      {
        error: "Failed to load pricing information",
        currentPlan: "free",
        plans: PLANS,
      },
      { status: 500 }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const formData = await request.formData();
  const plan = formData.get("plan");

  if (plan === "grow") {
    try {
      const appUrl = process.env.SHOPIFY_APP_URL || "";
      const returnUrl = `${appUrl}/app/billing/callback`;

      const result = await BillingService.createSubscription(admin, {
        shopDomain,
        plan: "grow",
        returnUrl,
        test: process.env.NODE_ENV !== "production",
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
      AppLogger.error("Error creating subscription from pricing page", {
        component: "app.pricing",
        operation: "action-upgrade"
      }, error);

      return json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }
  }

  return json({ error: "Invalid plan" }, { status: 400 });
}

export default function PricingPage() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const handleSelectPlan = useCallback((planId: string) => {
    if (planId === "grow") {
      fetcher.submit(
        { plan: planId },
        { method: "post" }
      );
    }
  }, [fetcher]);

  // Handle redirect to Shopify billing confirmation using window.open (App Bridge v4)
  useEffect(() => {
    if (fetcher.data && "confirmationUrl" in fetcher.data && fetcher.data.confirmationUrl) {
      window.open(fetcher.data.confirmationUrl, '_top');
    }
  }, [fetcher.data]);

  const isFreePlan = data.currentPlan === "free";
  const isGrowPlan = data.currentPlan === "grow";
  const isUpgrading = fetcher.state === "submitting";

  return (
    <Page
      title="Pricing"
      subtitle="Choose the plan that's right for your business"
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="600">
            {/* Plan Comparison */}
            <InlineStack gap="400" align="center">
              {/* Free Plan Card */}
              <Box width="50%">
                <Card>
                  <BlockStack gap="500">
                    <BlockStack gap="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h3" variant="headingLg">
                          {PLANS.free.name}
                        </Text>
                        {isFreePlan && <Badge tone="success">Current Plan</Badge>}
                      </InlineStack>
                      <InlineStack gap="100" blockAlign="baseline">
                        <Text as="p" variant="heading2xl" fontWeight="bold">
                          Free
                        </Text>
                      </InlineStack>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Perfect for getting started
                      </Text>
                    </BlockStack>

                    <Divider />

                    <BlockStack gap="300">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Features:
                      </Text>
                      <List type="bullet">
                        {PLANS.free.features.map((feature, index) => (
                          <List.Item key={index}>
                            <Text as="span" variant="bodyMd">
                              {feature}
                            </Text>
                          </List.Item>
                        ))}
                      </List>
                    </BlockStack>

                    <Button
                      fullWidth
                      variant={isFreePlan ? "secondary" : "primary"}
                      disabled={isFreePlan}
                      onClick={() => handleSelectPlan("free")}
                    >
                      {isFreePlan ? "Current Plan" : "Select Plan"}
                    </Button>
                  </BlockStack>
                </Card>
              </Box>

              {/* Grow Plan Card */}
              <Box width="50%">
                <Card>
                  <BlockStack gap="500">
                    <BlockStack gap="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h3" variant="headingLg">
                          {PLANS.grow.name}
                        </Text>
                        {isGrowPlan && <Badge tone="success">Current Plan</Badge>}
                      </InlineStack>
                      <InlineStack gap="100" blockAlign="baseline">
                        <Text as="p" variant="heading2xl" fontWeight="bold">
                          ${PLANS.grow.price}
                        </Text>
                        <Text as="span" variant="bodyLg" tone="subdued">
                          / month
                        </Text>
                      </InlineStack>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        For growing businesses
                      </Text>
                    </BlockStack>

                    <Divider />

                    <BlockStack gap="300">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Features:
                      </Text>
                      <List type="bullet">
                        {PLANS.grow.features.map((feature, index) => (
                          <List.Item key={index}>
                            <Text as="span" variant="bodyMd">
                              {feature}
                            </Text>
                          </List.Item>
                        ))}
                      </List>
                    </BlockStack>

                    <Button
                      fullWidth
                      variant="primary"
                      disabled={isGrowPlan}
                      loading={isUpgrading}
                      onClick={() => handleSelectPlan("grow")}
                    >
                      {isGrowPlan ? "Current Plan" : "Upgrade to Grow"}
                    </Button>
                  </BlockStack>
                </Card>
              </Box>
            </InlineStack>

            {/* FAQ or Additional Info */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Frequently Asked Questions
                </Text>
                <BlockStack gap="300">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Can I change plans at any time?
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Yes! You can upgrade or downgrade your plan at any time from the Billing page.
                    </Text>
                  </BlockStack>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      What happens if I downgrade?
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      If you have more bundles than your new plan allows, excess bundles will be automatically archived. You can reactivate them by upgrading again.
                    </Text>
                  </BlockStack>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Do you offer refunds?
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Subscriptions are billed through Shopify. Please contact support for refund inquiries.
                    </Text>
                  </BlockStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
