export interface SubscriptionErrorBannerProps {
  errorCode: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}

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
    <s-banner tone="critical" heading="Subscription Issue" dismissible onHide={onDismiss}>
      <s-button slot="primaryAction" onClick={onRetry}>
        Try Again
      </s-button>
      {getErrorMessage(errorCode)}
      <s-stack direction="inline" gap="small" style={{ marginTop: 8 }}>
        <s-button
          variant="tertiary"
          onClick={() => {
            if (typeof window !== "undefined" && window.$crisp) {
              window.$crisp.push(["do", "chat:open"]);
            }
          }}
        >
          Contact Support
        </s-button>
      </s-stack>
    </s-banner>
  );
}

declare global {
  interface Window {
    $crisp?: any[];
  }
}
