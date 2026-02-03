/**
 * Feature Gate Component
 *
 * Wraps features that are only available on the Grow plan.
 * Shows an upgrade prompt if the user is on the Free plan.
 *
 * Usage:
 * ```tsx
 * <FeatureGate
 *   feature="design_control_panel"
 *   plan={currentPlan}
 *   fallback={<UpgradePrompt feature="Design Control Panel" />}
 * >
 *   <DesignControlPanel />
 * </FeatureGate>
 * ```
 */

import { ReactNode } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Icon,
  Banner,
} from "@shopify/polaris";
import { LockIcon, StarFilledIcon } from "@shopify/polaris-icons";
import { useNavigate } from "@remix-run/react";
import { GROW_ONLY_FEATURES, type GrowOnlyFeature } from "../constants/plans";

interface FeatureGateProps {
  /**
   * The feature identifier to check
   */
  feature: GrowOnlyFeature;
  /**
   * Current plan of the user
   */
  plan: "free" | "grow";
  /**
   * Children to render if feature is available
   */
  children: ReactNode;
  /**
   * Optional custom fallback component
   * If not provided, renders default upgrade prompt
   */
  fallback?: ReactNode;
  /**
   * Display name of the feature for the upgrade prompt
   */
  featureDisplayName?: string;
  /**
   * Style of the gate display
   */
  variant?: "card" | "inline" | "banner";
}

export function FeatureGate({
  feature,
  plan,
  children,
  fallback,
  featureDisplayName,
  variant = "card",
}: FeatureGateProps) {
  // Check if feature is available
  const isAvailable = plan === "grow" || !GROW_ONLY_FEATURES.includes(feature);

  if (isAvailable) {
    return <>{children}</>;
  }

  // Feature is gated - show upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt based on variant
  const displayName = featureDisplayName || formatFeatureName(feature);

  if (variant === "inline") {
    return <InlineUpgradePrompt featureName={displayName} />;
  }

  if (variant === "banner") {
    return <BannerUpgradePrompt featureName={displayName} />;
  }

  return <CardUpgradePrompt featureName={displayName} />;
}

/**
 * Format feature identifier to display name
 */
function formatFeatureName(feature: string): string {
  return feature
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Card-style upgrade prompt
 */
function CardUpgradePrompt({ featureName }: { featureName: string }) {
  const navigate = useNavigate();

  return (
    <Card>
      <div style={{
        padding: "24px",
        textAlign: "center",
        backgroundColor: "#f6f6f7",
        borderRadius: "8px",
        margin: "-16px",
      }}>
        <BlockStack gap="400" align="center">
          <div style={{
            backgroundColor: "#ffc96b",
            borderRadius: "50%",
            padding: "12px",
            display: "inline-flex",
          }}>
            <Icon source={LockIcon} />
          </div>

          <BlockStack gap="200" align="center">
            <Text as="h3" variant="headingMd">
              {featureName}
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              This feature is available on the Grow plan.
            </Text>
          </BlockStack>

          <InlineStack gap="200" blockAlign="center">
            <Icon source={StarFilledIcon} tone="warning" />
            <Text as="span" variant="bodyMd" fontWeight="semibold">
              Upgrade to unlock
            </Text>
          </InlineStack>

          <Button
            variant="primary"
            onClick={() => navigate("/app/pricing")}
          >
            Upgrade to Grow - $9.99/month
          </Button>
        </BlockStack>
      </div>
    </Card>
  );
}

/**
 * Inline-style upgrade prompt (for smaller areas)
 */
function InlineUpgradePrompt({ featureName }: { featureName: string }) {
  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      backgroundColor: "#f6f6f7",
      borderRadius: "8px",
      border: "1px dashed #c9cccf",
    }}>
      <Icon source={LockIcon} tone="subdued" />
      <BlockStack gap="100">
        <Text as="span" variant="bodySm" fontWeight="semibold">
          {featureName} - Grow Plan Feature
        </Text>
        <Button variant="plain" onClick={() => navigate("/app/pricing")}>
          Upgrade to unlock
        </Button>
      </BlockStack>
    </div>
  );
}

/**
 * Banner-style upgrade prompt
 */
function BannerUpgradePrompt({ featureName }: { featureName: string }) {
  const navigate = useNavigate();

  return (
    <Banner tone="info">
      <InlineStack gap="200" align="space-between" blockAlign="center">
        <InlineStack gap="200" blockAlign="center">
          <Icon source={LockIcon} />
          <Text as="span" variant="bodyMd">
            <strong>{featureName}</strong> is a Grow plan feature.
          </Text>
        </InlineStack>
        <Button onClick={() => navigate("/app/pricing")}>
          Upgrade
        </Button>
      </InlineStack>
    </Banner>
  );
}

/**
 * Hook to check if a feature is available
 */
export function useFeatureGate(plan: "free" | "grow") {
  return {
    isAvailable: (feature: GrowOnlyFeature) => {
      return plan === "grow" || !GROW_ONLY_FEATURES.includes(feature);
    },
    isGrowPlan: plan === "grow",
    isFreePlan: plan === "free",
  };
}

/**
 * Simple check function for use in loaders/actions
 */
export function checkFeatureAccess(
  plan: "free" | "grow",
  feature: GrowOnlyFeature
): boolean {
  return plan === "grow" || !GROW_ONLY_FEATURES.includes(feature);
}
