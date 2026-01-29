/**
 * Pricing Page Route
 *
 * Displays pricing plans and handles plan selection/upgrade.
 * Uses shared billing components from app/components/billing.
 */

import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  BlockStack,
  useBreakpoints,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { BillingService } from "../services/billing.server";
import { PLANS } from "../constants/plans";
import { AppLogger } from "../lib/logger";
import { useCallback, useEffect, useState } from "react";

// Import shared billing components
import {
  SubscriptionQuotaCard,
  FreePlanCard,
  GrowPlanCard,
  FeatureComparisonTable,
  UpgradeConfirmationModal,
  ValuePropsSection,
  FAQSection,
} from "../components/billing";

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

  // Bundle quota data
  const currentBundleCount = data.subscription?.currentBundleCount || 0;
  const bundleLimit = data.subscription?.bundleLimit || PLANS.free.bundleLimit;
  const currentPlanConfig = data.plans[data.currentPlan as keyof typeof data.plans];

  return (
    <>
      {/* Upgrade Confirmation Modal */}
      <UpgradeConfirmationModal
        open={showUpgradeModal}
        isLoading={isUpgrading}
        currentBundleCount={currentBundleCount}
        bundleLimit={bundleLimit}
        onConfirm={handleConfirmUpgrade}
        onClose={() => setShowUpgradeModal(false)}
      />

      <Page
        title="Pricing"
        subtitle="Choose the plan that's right for your business"
      >
        <Layout>
          <Layout.Section>
            <BlockStack gap="600">
              {/* Subscription Quota Card */}
              <SubscriptionQuotaCard
                currentBundleCount={currentBundleCount}
                bundleLimit={bundleLimit}
                planName={currentPlanConfig.name}
                isFreePlan={isFreePlan}
                showUpgradePrompt={true}
              />

              {/* Value Proposition Section - Only show to Free users */}
              {isFreePlan && <ValuePropsSection />}

              {/* Plan Cards - Side by Side on Desktop */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: mdDown ? '1fr' : '1fr 1fr',
                gap: '1rem',
                alignItems: 'stretch'
              }}>
                <FreePlanCard isCurrentPlan={isFreePlan} />
                <GrowPlanCard
                  isCurrentPlan={isGrowPlan}
                  isUpgrading={isUpgrading}
                  onSelectPlan={() => handleSelectPlan("grow")}
                />
              </div>

              {/* Feature Comparison Table */}
              <FeatureComparisonTable />

              {/* FAQ Section */}
              <FAQSection />
            </BlockStack>
          </Layout.Section>
        </Layout>
      </Page>
    </>
  );
}
