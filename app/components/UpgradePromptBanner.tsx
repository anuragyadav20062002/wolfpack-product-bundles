/**
 * Upgrade Prompt Banner Component
 *
 * Displays a banner prompting free users to upgrade when:
 * 1. They are at their bundle limit (3/3)
 * 2. They are close to their limit (2/3 or more)
 *
 * Usage:
 * <UpgradePromptBanner
 *   plan="free"
 *   currentBundleCount={2}
 *   bundleLimit={3}
 *   canCreateBundle={true}
 * />
 */

import { Banner, Button, InlineStack, Text } from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";
import { useCallback } from "react";

export interface UpgradePromptBannerProps {
  plan: "free" | "grow";
  currentBundleCount: number;
  bundleLimit: number;
  canCreateBundle: boolean;
}

export function UpgradePromptBanner({
  plan,
  currentBundleCount,
  bundleLimit,
  canCreateBundle,
}: UpgradePromptBannerProps) {
  const navigate = useNavigate();

  const handleUpgrade = useCallback(() => {
    navigate("/app/billing");
  }, [navigate]);

  // Don't show banner for paid plans
  if (plan !== "free") {
    return null;
  }

  // Show critical banner when at limit
  if (!canCreateBundle) {
    return (
      <Banner
        tone="critical"
        onDismiss={undefined}
      >
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center" wrap={false}>
            <Text as="span" variant="bodyMd" fontWeight="semibold">
              Bundle Limit Reached
            </Text>
            <Text as="span" variant="bodyMd">
              You've used all {bundleLimit} bundles on the Free plan. Upgrade to Grow for up to 20 bundles.
            </Text>
          </InlineStack>
          <Button
            variant="primary"
            onClick={handleUpgrade}
          >
            Upgrade Now
          </Button>
        </InlineStack>
      </Banner>
    );
  }

  // Show warning when close to limit (80% or more)
  const usagePercentage = (currentBundleCount / bundleLimit) * 100;
  if (usagePercentage >= 80) {
    return (
      <Banner
        tone="warning"
        onDismiss={undefined}
      >
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center" wrap={false}>
            <Text as="span" variant="bodyMd" fontWeight="semibold">
              Approaching Bundle Limit
            </Text>
            <Text as="span" variant="bodyMd">
              You're using {currentBundleCount} of {bundleLimit} bundles. Upgrade to Grow for up to 20 bundles.
            </Text>
          </InlineStack>
          <Button
            variant="primary"
            onClick={handleUpgrade}
          >
            View Plans
          </Button>
        </InlineStack>
      </Banner>
    );
  }

  // Show info banner when at 50% or more
  if (usagePercentage >= 50) {
    return (
      <Banner
        tone="info"
        onDismiss={undefined}
      >
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center" wrap={false}>
            <Text as="span" variant="bodyMd">
              You're using {currentBundleCount} of {bundleLimit} bundles on the Free plan.
            </Text>
            <Text as="span" variant="bodyMd" tone="subdued">
              Need more? Upgrade to Grow for 20 bundles.
            </Text>
          </InlineStack>
          <Button
            onClick={handleUpgrade}
          >
            View Plans
          </Button>
        </InlineStack>
      </Banner>
    );
  }

  // Don't show banner if usage is low
  return null;
}
