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
  Divider,
  ProgressBar,
  useBreakpoints,
  Icon,
  Banner,
  Modal,
} from "@shopify/polaris";
import { CheckIcon, XIcon, StarFilledIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { BillingService } from "../services/billing.server";
import { PLANS } from "../constants/plans";
import { AppLogger } from "../lib/logger";
import { useCallback, useEffect, useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  try {
    // Get subscription info to show current plan and bundle quota
    const subscriptionInfo = await BillingService.getSubscriptionInfo(shopDomain);

    if (!subscriptionInfo) {
      throw new Error("Could not retrieve subscription information");
    }

    return json({
      currentPlan: subscriptionInfo.plan,
      plans: PLANS,
      subscription: {
        currentBundleCount: subscriptionInfo.currentBundleCount,
        bundleLimit: subscriptionInfo.bundleLimit,
        canCreateBundle: subscriptionInfo.canCreateBundle,
      },
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
        subscription: {
          currentBundleCount: 0,
          bundleLimit: PLANS.free.bundleLimit,
          canCreateBundle: true,
        },
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

// Feature comparison data with icons
const FEATURE_COMPARISON = [
  { feature: "Bundle limit", free: "10 bundles", grow: "20 bundles", highlight: true },
  { feature: "Product Page Bundles", free: true, grow: true },
  { feature: "Full Page Bundles", free: true, grow: true },
  { feature: "Basic discount rules", free: true, grow: true },
  { feature: "Advanced discount rules", free: false, grow: true, highlight: true },
  { feature: "Design Control Panel", free: false, grow: true, highlight: true },
  { feature: "Bundle analytics", free: false, grow: "Coming soon", highlight: true },
  { feature: "Priority support", free: false, grow: true, highlight: true },
  { feature: "Early access to features", free: false, grow: true },
  { feature: "Community access", free: true, grow: true },
];

// Value proposition items
const VALUE_PROPS = [
  {
    title: "Double your bundle capacity",
    description: "Create up to 20 bundles to maximize your product offerings",
    icon: "📦",
  },
  {
    title: "Full design control",
    description: "Customize colors, fonts, and layouts to match your brand perfectly",
    icon: "🎨",
  },
  {
    title: "Priority support",
    description: "Get help faster with dedicated support for Grow plan members",
    icon: "⚡",
  },
];

export default function PricingPage() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { mdDown } = useBreakpoints();

  // Upgrade confirmation modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleSelectPlan = useCallback((planId: string) => {
    if (planId === "grow") {
      setShowUpgradeModal(true);
    }
  }, []);

  const handleConfirmUpgrade = useCallback(() => {
    setShowUpgradeModal(false);
    fetcher.submit(
      { plan: "grow" },
      { method: "post" }
    );
  }, [fetcher]);

  // Handle redirect to Shopify billing confirmation
  useEffect(() => {
    if (fetcher.data && "confirmationUrl" in fetcher.data && fetcher.data.confirmationUrl) {
      open(fetcher.data.confirmationUrl, '_top');
    }
  }, [fetcher.data]);

  const isFreePlan = data.currentPlan === "free";
  const isGrowPlan = data.currentPlan === "grow";
  const isUpgrading = fetcher.state === "submitting";

  // Calculate progress percentage for quota
  const currentBundleCount = data.subscription?.currentBundleCount || 0;
  const bundleLimit = data.subscription?.bundleLimit || PLANS.free.bundleLimit;
  const quotaPercentage = (currentBundleCount / bundleLimit) * 100;

  // Badge and progress bar tones
  const badgeTone = quotaPercentage >= 90 ? "critical" : quotaPercentage >= 70 ? "attention" : "success";
  const progressBarTone = quotaPercentage >= 90 ? "critical" : quotaPercentage >= 70 ? "highlight" : "success";

  const currentPlanConfig = data.plans[data.currentPlan as keyof typeof data.plans];

  // Render feature value (checkmark, x, or text)
  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return (
        <div style={{ color: '#008060' }}>
          <Icon source={CheckIcon} tone="success" />
        </div>
      );
    }
    if (value === false) {
      return (
        <div style={{ color: '#8c9196' }}>
          <Icon source={XIcon} tone="subdued" />
        </div>
      );
    }
    return (
      <Text as="span" variant="bodyMd" fontWeight="medium">
        {value}
      </Text>
    );
  };

  return (
    <>
      {/* Upgrade Confirmation Modal */}
      <Modal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade to Grow Plan"
        primaryAction={{
          content: "Confirm Upgrade - $9.99/month",
          onAction: handleConfirmUpgrade,
          loading: isUpgrading,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowUpgradeModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Banner tone="info">
              <Text as="p" variant="bodyMd">
                You'll be redirected to Shopify to complete your subscription.
              </Text>
            </Banner>

            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                What you'll get with Grow:
              </Text>
              <BlockStack gap="200">
                <InlineStack gap="200" blockAlign="center">
                  <div style={{ color: '#008060' }}>
                    <Icon source={CheckIcon} tone="success" />
                  </div>
                  <Text as="span" variant="bodyMd">Up to 20 bundles (currently {currentBundleCount}/{bundleLimit})</Text>
                </InlineStack>
                <InlineStack gap="200" blockAlign="center">
                  <div style={{ color: '#008060' }}>
                    <Icon source={CheckIcon} tone="success" />
                  </div>
                  <Text as="span" variant="bodyMd">Design Control Panel for full customization</Text>
                </InlineStack>
                <InlineStack gap="200" blockAlign="center">
                  <div style={{ color: '#008060' }}>
                    <Icon source={CheckIcon} tone="success" />
                  </div>
                  <Text as="span" variant="bodyMd">Advanced discount rules</Text>
                </InlineStack>
                <InlineStack gap="200" blockAlign="center">
                  <div style={{ color: '#008060' }}>
                    <Icon source={CheckIcon} tone="success" />
                  </div>
                  <Text as="span" variant="bodyMd">Priority support</Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>

            <Divider />

            <InlineStack align="space-between">
              <Text as="span" variant="bodyMd" tone="subdued">
                Billed monthly through Shopify
              </Text>
              <Text as="span" variant="headingMd" fontWeight="bold">
                $9.99/month
              </Text>
            </InlineStack>
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Page
        title="Pricing"
        subtitle="Choose the plan that's right for your business"
      >
        <Layout>
          <Layout.Section>
            <BlockStack gap="600">
              {/* Subscription Quota Card */}
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingMd">
                        Bundle Subscription Quota
                      </Text>
                      <Badge tone={badgeTone}>
                        {`${currentBundleCount} / ${bundleLimit} bundles used`}
                      </Badge>
                    </InlineStack>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {bundleLimit - currentBundleCount > 0
                        ? `You have ${bundleLimit - currentBundleCount} bundle${bundleLimit - currentBundleCount !== 1 ? 's' : ''} remaining on your ${currentPlanConfig.name}.`
                        : `You've reached your bundle limit. Upgrade to create more bundles.`
                      }
                    </Text>
                  </BlockStack>
                  <ProgressBar
                    progress={quotaPercentage}
                    tone={progressBarTone}
                    size="small"
                  />
                  {isFreePlan && quotaPercentage >= 50 && (
                    <Banner tone={quotaPercentage >= 80 ? "warning" : "info"}>
                      <Text as="p" variant="bodyMd">
                        {quotaPercentage >= 80
                          ? "You're running low on bundles! Upgrade to Grow for 20 bundles."
                          : "Need more bundles? Upgrade to Grow for double the capacity."
                        }
                      </Text>
                    </Banner>
                  )}
                </BlockStack>
              </Card>

              {/* Value Proposition Section - Only show to Free users */}
              {isFreePlan && (
                <Card>
                  <BlockStack gap="400">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ color: '#ffc453' }}>
                        <Icon source={StarFilledIcon} />
                      </div>
                      <Text as="h3" variant="headingMd">
                        Why Upgrade to Grow?
                      </Text>
                    </InlineStack>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: mdDown ? '1fr' : 'repeat(3, 1fr)',
                      gap: '1rem'
                    }}>
                      {VALUE_PROPS.map((prop, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '1rem',
                            backgroundColor: '#f6f6f7',
                            borderRadius: '8px',
                            textAlign: 'center',
                          }}
                        >
                          <BlockStack gap="200" align="center">
                            <Text as="span" variant="heading2xl">{prop.icon}</Text>
                            <Text as="h4" variant="headingSm">{prop.title}</Text>
                            <Text as="p" variant="bodySm" tone="subdued">{prop.description}</Text>
                          </BlockStack>
                        </div>
                      ))}
                    </div>
                  </BlockStack>
                </Card>
              )}

              {/* Plan Cards - Side by Side on Desktop */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: mdDown ? '1fr' : '1fr 1fr',
                gap: '1rem',
                alignItems: 'stretch'
              }}>
                {/* Free Plan Card */}
                <Card>
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                          Perfect for getting started with bundles
                        </Text>
                      </BlockStack>

                      <Divider />

                      <BlockStack gap="300">
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          Includes:
                        </Text>
                        <BlockStack gap="200">
                          {PLANS.free.features.map((feature, index) => (
                            <InlineStack key={index} gap="200" blockAlign="center">
                              <div style={{ color: '#008060' }}>
                                <Icon source={CheckIcon} tone="success" />
                              </div>
                              <Text as="span" variant="bodyMd">
                                {feature}
                              </Text>
                            </InlineStack>
                          ))}
                        </BlockStack>
                      </BlockStack>
                    </BlockStack>

                    <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
                      <Button
                        fullWidth
                        variant={isFreePlan ? "secondary" : "primary"}
                        disabled={true}
                      >
                        {isFreePlan ? "Current Plan" : "Free Plan"}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Grow Plan Card - Highlighted */}
                <div style={{ position: 'relative' }}>
                  {/* Most Popular Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    backgroundColor: '#ffc96b',
                    color: '#3d3d3d',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}>
                    <span style={{ fontSize: '14px' }}>⭐</span>
                    <span>Most Popular</span>
                  </div>

                  <Card>
                    <div style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: isGrowPlan ? 'none' : '2px solid #005bd3',
                      borderRadius: '12px',
                      margin: '-16px',
                      padding: '16px',
                    }}>
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
                            For growing businesses ready to scale
                          </Text>
                        </BlockStack>

                        <Divider />

                        <BlockStack gap="300">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            Everything in Free, plus:
                          </Text>
                          <BlockStack gap="200">
                            {PLANS.grow.features.map((feature, index) => (
                              <InlineStack key={index} gap="200" blockAlign="center">
                                <div style={{ color: '#008060' }}>
                                  <Icon source={CheckIcon} tone="success" />
                                </div>
                                <Text as="span" variant="bodyMd" fontWeight={index < 4 ? "semibold" : "regular"}>
                                  {feature}
                                </Text>
                              </InlineStack>
                            ))}
                          </BlockStack>
                        </BlockStack>
                      </BlockStack>

                      <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
                        <Button
                          fullWidth
                          variant="primary"
                          disabled={isGrowPlan}
                          loading={isUpgrading}
                          onClick={() => handleSelectPlan("grow")}
                        >
                          {isGrowPlan ? "Current Plan" : "Upgrade to Grow"}
                        </Button>
                        {!isGrowPlan && (
                          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                            <Text as="p" variant="bodySm" tone="subdued">
                              Cancel anytime. Billed through Shopify.
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Feature Comparison Table */}
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Feature Comparison
                  </Text>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e1e3e5' }}>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px 8px',
                            fontWeight: 600,
                            color: '#202223'
                          }}>
                            Feature
                          </th>
                          <th style={{
                            textAlign: 'center',
                            padding: '12px 8px',
                            fontWeight: 600,
                            color: '#202223',
                            width: '120px'
                          }}>
                            Free
                          </th>
                          <th style={{
                            textAlign: 'center',
                            padding: '12px 8px',
                            fontWeight: 600,
                            color: '#005bd3',
                            width: '120px',
                            backgroundColor: '#f0f5ff',
                            borderRadius: '8px 8px 0 0'
                          }}>
                            Grow
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {FEATURE_COMPARISON.map((row, index) => (
                          <tr
                            key={index}
                            style={{
                              borderBottom: '1px solid #e1e3e5',
                              backgroundColor: row.highlight ? '#fafbfb' : 'transparent'
                            }}
                          >
                            <td style={{
                              padding: '12px 8px',
                              color: '#202223',
                              fontWeight: row.highlight ? 500 : 400
                            }}>
                              {row.feature}
                            </td>
                            <td style={{
                              textAlign: 'center',
                              padding: '12px 8px'
                            }}>
                              {renderFeatureValue(row.free)}
                            </td>
                            <td style={{
                              textAlign: 'center',
                              padding: '12px 8px',
                              backgroundColor: '#f0f5ff'
                            }}>
                              {renderFeatureValue(row.grow)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </BlockStack>
              </Card>

              {/* FAQ Section */}
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Frequently Asked Questions
                  </Text>
                  <BlockStack gap="400">
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Can I change plans at any time?
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Yes! You can upgrade to Grow anytime. If you need to downgrade, you can cancel from the Billing page.
                      </Text>
                    </BlockStack>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        What happens to my bundles if I downgrade?
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        If you have more than 10 bundles when downgrading to Free, the excess bundles will be archived but not deleted. You can upgrade again to access them.
                      </Text>
                    </BlockStack>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        How does billing work?
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        All subscriptions are billed monthly through your Shopify account. The charge will appear on your Shopify invoice.
                      </Text>
                    </BlockStack>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Do you offer refunds?
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Subscriptions are billed through Shopify. Please contact our support team for any billing inquiries.
                      </Text>
                    </BlockStack>
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </Page>
    </>
  );
}
