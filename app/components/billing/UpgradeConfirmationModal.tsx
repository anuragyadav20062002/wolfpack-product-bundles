import { useRef, useEffect } from "react";
import { PLANS } from "../../constants/plans";
import { GROW_PLAN_BENEFITS } from "../../constants/pricing-data";

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
  const modalRef = useRef<any>(null);

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
      heading={`Upgrade to Grow Plan`}
      onHide={onClose}
    >
      <s-button
        slot="primaryAction"
        variant="primary"
        loading={isLoading || undefined}
        onClick={onConfirm}
      >
        {`Confirm Upgrade - $${PLANS.grow.price}/month`}
      </s-button>
      <s-button slot="secondaryActions" onClick={onClose}>
        Cancel
      </s-button>

      <s-stack direction="block" gap="base">
        <s-banner tone="info">
          You&apos;ll be redirected to Shopify to complete your subscription.
        </s-banner>

        <s-stack direction="block" gap="small">
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            What you&apos;ll get with Grow:
          </h3>
          <s-stack direction="block" gap="small-100">
            <s-stack direction="inline" alignItems="center" gap="small-100">
              <div style={{ color: "#008060" }}>
                <s-icon name="check-minor" />
              </div>
              <span style={{ fontSize: 14 }}>
                Up to 20 bundles (currently {currentBundleCount}/{bundleLimit})
              </span>
            </s-stack>
            {GROW_PLAN_BENEFITS.slice(1).map((benefit, index) => (
              <s-stack key={index} direction="inline" alignItems="center" gap="small-100">
                <div style={{ color: "#008060" }}>
                  <s-icon name="check-minor" />
                </div>
                <span style={{ fontSize: 14 }}>{benefit}</span>
              </s-stack>
            ))}
          </s-stack>
        </s-stack>

        <s-divider />

        <s-stack direction="inline" justifyContent="space-between">
          <s-text tone="neutral" color="subdued">Billed monthly through Shopify</s-text>
          <strong style={{ fontSize: 16 }}>${PLANS.grow.price}/month</strong>
        </s-stack>
      </s-stack>
    </s-modal>
  );
}
