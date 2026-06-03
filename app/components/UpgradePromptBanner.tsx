import { useNavigate } from "@remix-run/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const handleUpgrade = useCallback(() => {
    navigate("/app/billing");
  }, [navigate]);

  if (plan !== "free") return null;

  if (!canCreateBundle) {
    return (
      <s-banner tone="critical">
        <s-button slot="primaryAction" variant="primary" onClick={handleUpgrade}>
          {t("common.actions.upgradeNow")}
        </s-button>
        <strong>{t("common.upgradePrompt.limitReachedTitle")}</strong> -{" "}
        {t("common.upgradePrompt.limitReachedBody", { limit: bundleLimit })}
      </s-banner>
    );
  }

  const usagePercentage = (currentBundleCount / bundleLimit) * 100;

  if (usagePercentage >= 80) {
    return (
      <s-banner tone="warning">
        <s-button slot="primaryAction" variant="primary" onClick={handleUpgrade}>
          {t("common.actions.viewPlans")}
        </s-button>
        <strong>{t("common.upgradePrompt.approachingTitle")}</strong> -{" "}
        {t("common.upgradePrompt.approachingBody", { current: currentBundleCount, limit: bundleLimit })}
      </s-banner>
    );
  }

  if (usagePercentage >= 50) {
    return (
      <s-banner tone="info">
        <s-button slot="primaryAction" onClick={handleUpgrade}>
          {t("common.actions.viewPlans")}
        </s-button>
        {t("common.upgradePrompt.usageBody", { current: currentBundleCount, limit: bundleLimit })}
      </s-banner>
    );
  }

  return null;
}
