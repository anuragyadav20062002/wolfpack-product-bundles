/**
 * Upgrade Success Banner Component
 *
 * Displays a celebration banner when user successfully upgrades to Grow plan.
 */

import {
  Text,
  Button,
  BlockStack,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import { CheckCircleIcon } from "@shopify/polaris-icons";

export interface UpgradeSuccessBannerProps {
  showCelebration: boolean;
  onDismiss: () => void;
}

export function UpgradeSuccessBanner({
  showCelebration,
  onDismiss,
}: UpgradeSuccessBannerProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #008060 0%, #00a47c 100%)',
      borderRadius: '12px',
      padding: '24px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Confetti effect (CSS-based) */}
      {showCelebration && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 2px, transparent 2px),
            radial-gradient(circle at 40% 70%, rgba(255,255,255,0.15) 3px, transparent 3px),
            radial-gradient(circle at 60% 20%, rgba(255,255,255,0.1) 2px, transparent 2px),
            radial-gradient(circle at 80% 50%, rgba(255,255,255,0.12) 2px, transparent 2px)
          `,
        }} />
      )}

      <BlockStack gap="300">
        <InlineStack gap="300" blockAlign="center">
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            padding: '8px',
            display: 'flex',
          }}>
            <Icon source={CheckCircleIcon} tone="inherit" />
          </div>
          <BlockStack gap="100">
            <Text as="h2" variant="headingLg" fontWeight="bold">
              Welcome to the Grow Plan! 🎉
            </Text>
            <Text as="p" variant="bodyMd">
              Your subscription has been activated. You now have access to all premium features.
            </Text>
          </BlockStack>
        </InlineStack>

        <InlineStack gap="400" wrap={false}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '12px 16px',
            flex: 1,
          }}>
            <BlockStack gap="100">
              <Text as="span" variant="bodySm">Bundle Limit</Text>
              <Text as="span" variant="headingMd" fontWeight="bold">20 bundles</Text>
            </BlockStack>
          </div>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '12px 16px',
            flex: 1,
          }}>
            <BlockStack gap="100">
              <Text as="span" variant="bodySm">Design Control</Text>
              <Text as="span" variant="headingMd" fontWeight="bold">Full Access</Text>
            </BlockStack>
          </div>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '12px 16px',
            flex: 1,
          }}>
            <BlockStack gap="100">
              <Text as="span" variant="bodySm">Support</Text>
              <Text as="span" variant="headingMd" fontWeight="bold">Priority</Text>
            </BlockStack>
          </div>
        </InlineStack>

        <Button onClick={onDismiss} variant="monochromePlain">
          Dismiss
        </Button>
      </BlockStack>
    </div>
  );
}
