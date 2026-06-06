import {
  calculateUsagePercentage,
  getProgressBarTone,
  getBadgeTone,
  getRemainingBundlesMessage,
  shouldShowUpgradePrompt,
  getUpgradePromptMessage,
  getUpgradePromptTone,
} from "../../utils/pricing";

export interface SubscriptionQuotaCardProps {
  currentBundleCount: number;
  bundleLimit: number;
  planName: string;
  isFreePlan: boolean;
  showUpgradePrompt?: boolean;
}

function CustomProgressBar({ progress, tone }: { progress: number; tone: string }) {
  const barColor =
    tone === "success" ? "#008060" : tone === "warning" ? "#ffc453" : "#d82c0d";
  return (
    <div style={{ height: 6, background: "#e3e3e3", borderRadius: 3, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, progress))}%`,
          background: barColor,
          borderRadius: 3,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

export function SubscriptionQuotaCard({
  currentBundleCount,
  bundleLimit,
  planName,
  isFreePlan,
  showUpgradePrompt = true,
}: SubscriptionQuotaCardProps) {
  const percentage = calculateUsagePercentage(currentBundleCount, bundleLimit);
  const badgeTone = getBadgeTone(percentage);
  const progressBarTone = getProgressBarTone(percentage);
  const remainingMessage = getRemainingBundlesMessage(currentBundleCount, bundleLimit, planName);

  const showBanner = showUpgradePrompt && shouldShowUpgradePrompt(percentage, isFreePlan);
  const bannerMessage = getUpgradePromptMessage(percentage);
  const bannerTone = getUpgradePromptTone(percentage);

  return (
    <s-section>
      <s-stack direction="block" gap="base">
        <s-stack direction="block" gap="small-100">
          <s-stack direction="inline" justifyContent="space-between" alignItems="center">
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Bundle Subscription Quota
            </h3>
            <s-badge tone={badgeTone}>
              {`${currentBundleCount} / ${bundleLimit} bundles used`}
            </s-badge>
          </s-stack>
          <p style={{ margin: 0, color: "#6d7175", fontSize: 14 }}>{remainingMessage}</p>
        </s-stack>
        <CustomProgressBar progress={percentage} tone={progressBarTone} />
        {showBanner && (
          <s-banner tone={bannerTone}>
            {bannerMessage}
          </s-banner>
        )}
      </s-stack>
    </s-section>
  );
}
