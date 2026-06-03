import { useTranslation, type TFunction } from "react-i18next";

export interface SubscriptionErrorBannerProps {
  errorCode: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}

function getErrorMessage(errorCode: string | null, t: TFunction): string {
  switch (errorCode) {
    case "missing_charge_id":
      return t("billing.error.missingChargeId");
    case "confirmation_failed":
      return t("billing.error.confirmationFailed");
    default:
      return t("billing.error.unexpected");
  }
}

export function SubscriptionErrorBanner({
  errorCode,
  onRetry,
  onDismiss,
}: SubscriptionErrorBannerProps) {
  const { t } = useTranslation();

  return (
    <s-banner tone="critical" heading={t("billing.error.heading")} dismissible onHide={onDismiss} suppressHydrationWarning>
      <s-button slot="primaryAction" onClick={onRetry}>
        {t("billing.actions.tryAgain")}
      </s-button>
      {getErrorMessage(errorCode, t)}
      <s-stack direction="inline" gap="small" style={{ marginTop: 8 }}>
        <s-button
          variant="tertiary"
          onClick={() => {
            if (typeof window !== "undefined" && window.$crisp) {
              window.$crisp.push(["do", "chat:open"]);
            }
          }}
        >
          {t("billing.actions.contactSupport")}
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
