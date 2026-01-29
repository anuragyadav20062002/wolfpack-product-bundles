/**
 * Subscription Error Banner Component
 *
 * Displays error messages for subscription issues.
 */

import {
  Banner,
  Text,
  Button,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";

export interface SubscriptionErrorBannerProps {
  errorCode: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}

/**
 * Get human-readable error message from error code
 */
function getErrorMessage(errorCode: string | null): string {
  switch (errorCode) {
    case "missing_charge_id":
      return "Subscription confirmation failed: Missing charge ID.";
    case "confirmation_failed":
      return "Failed to confirm subscription with Shopify.";
    default:
      return "An unexpected error occurred during subscription setup.";
  }
}

export function SubscriptionErrorBanner({
  errorCode,
  onRetry,
  onDismiss,
}: SubscriptionErrorBannerProps) {
  return (
    <Banner
      tone="critical"
      onDismiss={onDismiss}
      title="Subscription Issue"
    >
      <BlockStack gap="200">
        <Text as="p" variant="bodyMd">
          {getErrorMessage(errorCode)}
        </Text>
        <InlineStack gap="200">
          <Button onClick={onRetry} variant="plain">
            Try Again
          </Button>
          <Button
            onClick={() => {
              if (typeof window !== "undefined" && window.$crisp) {
                window.$crisp.push(["do", "chat:open"]);
              }
            }}
            variant="plain"
          >
            Contact Support
          </Button>
        </InlineStack>
      </BlockStack>
    </Banner>
  );
}
