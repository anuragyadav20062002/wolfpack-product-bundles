/**
 * Pricing Page Route
 *
 * Displays pricing plans and handles plan selection/upgrade.
 * Uses shared billing components from app/components/billing.
 */

import { defer, json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Await, useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { getCachedSubscriptionInfo, getSubscriptionInfoFromCache } from "../../services/subscription-cache.server";
import { BillingService } from "../../services/billing.server";
import { PLANS } from "../../constants/plans";
import { AppLogger } from "../../lib/logger";
import { Suspense, useCallback, useEffect, useState } from "react";
import pricingStyles from "../../styles/routes/app-pricing.module.css";

// Import shared billing components
import {
  SubscriptionQuotaCard,
  FreePlanCard,
  GrowPlanCard,
  FeatureComparisonTable,
  UpgradeConfirmationModal,
  ValuePropsSection,
  FAQSection,
} from "../../components/billing";
import { navigateBackOrFallback } from "../../lib/navigation";

type PricingSubscriptionData = {
  error?: "Failed to load pricing information";
  currentPlan: keyof typeof PLANS;
  currentBundleCount: number;
  bundleLimit: number;
  canCreateBundle: boolean;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await requireAdminSession(request);
  const shopDomain = session.shop;

  const subscription = (async () => {
    // Reuse cached subscription info from dashboard/bootstrap whenever available.
    try {
      const cachedSubscriptionInfo = getCachedSubscriptionInfo(shopDomain);
      const subscriptionInfo = cachedSubscriptionInfo !== undefined
        ? cachedSubscriptionInfo
        : await getSubscriptionInfoFromCache(shopDomain);

      if (!subscriptionInfo) {
        throw new Error("Could not retrieve subscription information");
      }

      return {
        currentPlan: subscriptionInfo.plan,
        currentBundleCount: subscriptionInfo.currentBundleCount,
        bundleLimit: subscriptionInfo.bundleLimit,
        canCreateBundle: subscriptionInfo.canCreateBundle,
      } satisfies PricingSubscriptionData;
    } catch (error) {
      AppLogger.error("Error loading pricing page", {
        component: "app.pricing",
        operation: "loader"
      }, error);

      return {
        error: "Failed to load pricing information" as const,
        currentPlan: "free",
        currentBundleCount: 0,
        bundleLimit: PLANS.free.bundleLimit,
        canCreateBundle: true,
      } satisfies PricingSubscriptionData;
    }
  })();

  return defer({
    plans: PLANS,
    subscription,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await requireAdminSession(request);
  const shopDomain = session.shop;

  const formData = await request.formData();
  const plan = formData.get("plan");

  if (plan === "grow") {
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

function PricingBody({
  data,
  plans,
}: {
  data: PricingSubscriptionData;
  plans: typeof PLANS;
}) {
  const fetcher = useFetcher<typeof action>();

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
  const currentBundleCount = data.currentBundleCount;
  const bundleLimit = data.bundleLimit;
  const currentPlanConfig = plans[data.currentPlan as keyof typeof plans];

  return (
    <>
      {showUpgradeModal && (
        <UpgradeConfirmationModal
          open={showUpgradeModal}
          isLoading={isUpgrading}
          currentBundleCount={currentBundleCount}
          bundleLimit={bundleLimit}
          onConfirm={handleConfirmUpgrade}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 4px 88px" }}>
        <s-stack direction="block" gap="large">
          <SubscriptionQuotaCard
            currentBundleCount={currentBundleCount}
            bundleLimit={bundleLimit}
            planName={currentPlanConfig.name}
            isFreePlan={isFreePlan}
            showUpgradePrompt={true}
          />

          {isFreePlan && <ValuePropsSection />}

          <div className={pricingStyles.planCardsGrid}>
            <FreePlanCard isCurrentPlan={isFreePlan} />
            <GrowPlanCard
              isCurrentPlan={isGrowPlan}
              isUpgrading={isUpgrading}
              onSelectPlan={() => handleSelectPlan("grow")}
            />
          </div>

          <FeatureComparisonTable />

          <FAQSection />
        </s-stack>
      </div>
    </>
  );
}

function PricingSkeleton() {
  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 4px 88px" }}>
      <s-stack direction="block" gap="large">
        <s-section>
          <s-stack direction="block" gap="base">
            <div style={{ height: 18, width: 220, background: "#f1f2f3", borderRadius: 4 }} />
            <div style={{ height: 6, width: "100%", background: "#e3e3e3", borderRadius: 3 }} />
          </s-stack>
        </s-section>
        <div className={pricingStyles.planCardsGrid}>
          <s-section><div style={{ minHeight: 280, background: "#f6f6f7", borderRadius: 8 }} /></s-section>
          <s-section><div style={{ minHeight: 280, background: "#f6f6f7", borderRadius: 8 }} /></s-section>
        </div>
      </s-stack>
    </div>
  );
}

export default function PricingPage() {
  const { plans, subscription } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <>
      <ui-title-bar title="Pricing">
        <button
          variant="breadcrumb"
          onClick={() =>
            navigateBackOrFallback(navigate, "/app/dashboard", { replaceFallback: true })
          }
        >
          Dashboard
        </button>
      </ui-title-bar>
      <Suspense fallback={<PricingSkeleton />}>
        <Await resolve={subscription}>
          {(data) => <PricingBody data={data} plans={plans} />}
        </Await>
      </Suspense>
    </>
  );
}
