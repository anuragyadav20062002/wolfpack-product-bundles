import { useNavigate } from "@remix-run/react";
import { useCallback } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import styles from "./UpgradePromptBanner.module.css";

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

  const renderPrompt = (
    tone: "info" | "warning" | "critical",
    actionLabel: string,
    message: ReactNode,
    actionVariant: "primary" | "secondary" = "secondary",
  ) => (
    <div className={`${styles.upgradePromptBanner} ${styles[tone]}`} role={tone === "critical" ? "alert" : "status"}>
      <span className={styles.upgradePromptIcon} aria-hidden="true">
        <s-icon type={tone === "info" ? "info" : "alert-triangle"} />
      </span>
      <span className={styles.upgradePromptMessage}>{message}</span>
      <span className={styles.upgradePromptAction}>
        <s-button variant={actionVariant} onClick={handleUpgrade}>
          {actionLabel}
        </s-button>
      </span>
    </div>
  );

  if (plan !== "free") return null;

  if (!canCreateBundle) {
    return renderPrompt(
      "critical",
      t("common.actions.upgradeNow"),
      <>
        <strong>{t("common.upgradePrompt.limitReachedTitle")}</strong> -{" "}
        {t("common.upgradePrompt.limitReachedBody", { limit: bundleLimit })}
      </>,
      "primary",
    );
  }

  const usagePercentage = (currentBundleCount / bundleLimit) * 100;

  if (usagePercentage >= 80) {
    return renderPrompt(
      "warning",
      t("common.actions.viewPlans"),
      <>
        <strong>{t("common.upgradePrompt.approachingTitle")}</strong> -{" "}
        {t("common.upgradePrompt.approachingBody", { current: currentBundleCount, limit: bundleLimit })}
      </>,
      "primary",
    );
  }

  if (usagePercentage >= 50) {
    return renderPrompt(
      "info",
      t("common.actions.viewPlans"),
      t("common.upgradePrompt.usageBody", { current: currentBundleCount, limit: bundleLimit }),
    );
  }

  return null;
}
