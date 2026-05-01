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

  if (plan !== "free") return null;

  if (!canCreateBundle) {
    return (
      <s-banner tone="critical">
        <s-button slot="primaryAction" variant="primary" onClick={handleUpgrade}>
          Upgrade Now
        </s-button>
        <strong>Bundle Limit Reached</strong> — You&apos;ve used all {bundleLimit} bundles on the Free
        plan. Upgrade to Grow for up to 20 bundles.
      </s-banner>
    );
  }

  const usagePercentage = (currentBundleCount / bundleLimit) * 100;

  if (usagePercentage >= 80) {
    return (
      <s-banner tone="warning">
        <s-button slot="primaryAction" variant="primary" onClick={handleUpgrade}>
          View Plans
        </s-button>
        <strong>Approaching Bundle Limit</strong> — You&apos;re using {currentBundleCount} of{" "}
        {bundleLimit} bundles. Upgrade to Grow for up to 20 bundles.
      </s-banner>
    );
  }

  if (usagePercentage >= 50) {
    return (
      <s-banner tone="info">
        <s-button slot="primaryAction" onClick={handleUpgrade}>
          View Plans
        </s-button>
        You&apos;re using {currentBundleCount} of {bundleLimit} bundles on the Free plan. Need more?
        Upgrade to Grow for 20 bundles.
      </s-banner>
    );
  }

  return null;
}
