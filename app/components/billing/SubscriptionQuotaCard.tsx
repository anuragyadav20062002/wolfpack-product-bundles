/**
 * Subscription Quota Card Component
 *
 * Displays bundle usage quota with progress bar.
 * Used on both billing and pricing pages.
 */

import {
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  ProgressBar,
  Banner,
} from "@shopify/polaris";
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
            {remainingMessage}
          </Text>
        </BlockStack>
        <ProgressBar
          progress={percentage}
          tone={progressBarTone}
          size="small"
        />
        {showBanner && (
          <Banner tone={bannerTone}>
            <Text as="p" variant="bodyMd">
              {bannerMessage}
            </Text>
          </Banner>
        )}
      </BlockStack>
    </Card>
  );
}
