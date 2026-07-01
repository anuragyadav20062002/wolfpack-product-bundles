import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { openSupportChat } from "../../lib/support-chat.client";

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
    <s-banner tone="critical" heading={t("billing.error.heading")}>
      <s-button slot="primary-action" onClick={onRetry}>
        {t("billing.actions.tryAgain")}
      </s-button>
      {getErrorMessage(errorCode, t)}
      <div style={{ marginTop: 8 }}>
        <s-stack direction="inline" gap="small">
          <s-button
            variant="tertiary"
            onClick={() => openSupportChat()}
          >
            {t("billing.actions.contactSupport")}
          </s-button>
          <s-button variant="tertiary" onClick={onDismiss}>
            {t("common.actions.dismiss")}
          </s-button>
        </s-stack>
      </div>
    </s-banner>
  );
}
