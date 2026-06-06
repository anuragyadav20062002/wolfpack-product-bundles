import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PLANS } from "../../constants/plans";

export interface UpgradeConfirmationModalProps {
  open: boolean;
  isLoading: boolean;
  currentBundleCount: number;
  bundleLimit: number;
  onConfirm: () => void;
  onClose: () => void;
}

export function UpgradeConfirmationModal({
  open,
  isLoading,
  currentBundleCount,
  bundleLimit,
  onConfirm,
  onClose,
}: UpgradeConfirmationModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<any>(null);
  const benefits = [
    t("billing.upgradeModal.benefits.noRevenueCap"),
    t("billing.upgradeModal.benefits.advancedDiscounts"),
    t("billing.upgradeModal.benefits.prioritySupport"),
  ];

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    if (open) {
      el.show?.();
    } else {
      el.hide?.();
    }
  }, [open]);

  return (
    <s-modal
      ref={modalRef}
      id="upgrade-confirmation-modal"
      heading={t("billing.upgradeModal.heading")}
      onHide={onClose}
    >
      <s-button
        slot="primary-action"
        variant="primary"
        loading={isLoading || undefined}
        onClick={onConfirm}
      >
        {t("billing.upgradeModal.confirm", { price: PLANS.grow.price })}
      </s-button>
      <s-button slot="secondary-actions" onClick={onClose}>
        {t("billing.actions.cancel")}
      </s-button>

      <s-stack direction="block" gap="base">
        <s-banner tone="info">
          {t("billing.upgradeModal.redirect")}
        </s-banner>

        <s-stack direction="block" gap="small">
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {t("billing.upgradeModal.benefitsHeading")}
          </h3>
          <s-stack direction="block" gap="small-100">
            <s-stack direction="inline" alignItems="center" gap="small-100">
              <div style={{ color: "#008060" }}>
                <s-icon type="check" />
              </div>
              <span style={{ fontSize: 14 }}>
                {t("billing.upgradeModal.bundleLimit", { current: currentBundleCount, limit: bundleLimit })}
              </span>
            </s-stack>
            {benefits.map((benefit, index) => (
              <s-stack key={index} direction="inline" alignItems="center" gap="small-100">
                <div style={{ color: "#008060" }}>
                  <s-icon type="check" />
                </div>
                <span style={{ fontSize: 14 }}>{benefit}</span>
              </s-stack>
            ))}
          </s-stack>
        </s-stack>

        <s-divider />

        <s-stack direction="inline" justifyContent="space-between">
          <s-text tone="neutral" color="subdued">{t("billing.upgradeModal.billedMonthly")}</s-text>
          <strong style={{ fontSize: 16 }}>{t("billing.pricePerMonth", { price: PLANS.grow.price })}</strong>
        </s-stack>
      </s-stack>
    </s-modal>
  );
}
