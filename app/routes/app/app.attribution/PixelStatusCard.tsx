import { useFetcher } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useCallback, useEffect, useState } from "react";
import type { action } from "../app.attribution";
import {
  getUtmPixelStatusBannerModel,
  UTM_PIXEL_PRIVACY_MESSAGE,
} from "../../../lib/utm-pixel-status-banner";
import styles from "../../../styles/routes/app-attribution.module.css";

// ─── Pixel Status Card ────────────────────────────────────────

export function PixelStatusCard({ pixelActive }: { pixelActive: boolean }) {
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== "idle";

  const [active, setActive] = useState(pixelActive);

  useEffect(() => {
    if (!fetcher.data) return;
    const data = fetcher.data as { success: boolean; pixelActive?: boolean; message?: string; error?: string };
    if (data.success && data.pixelActive !== undefined) {
      setActive(data.pixelActive);
      shopify.toast.show(data.message ?? "Done", { isError: false });
    } else if (!data.success && data.error) {
      shopify.toast.show(data.error, { isError: true, duration: 6000 });
    }
  }, [fetcher.data, shopify.toast]);

  const handleToggle = useCallback(() => {
    fetcher.submit(
      { intent: active ? "disable" : "enable" },
      { method: "POST" }
    );
  }, [fetcher, active]);

  const model = getUtmPixelStatusBannerModel(active);

  return (
    <>
      <div className={styles.pixelStatusCard} data-status={model.statusDotTone}>
        <s-stack direction="inline" alignItems="center" justifyContent="space-between" gap="base">
          <s-stack direction="inline" alignItems="center" gap="small">
            <span className={styles.pixelStatusDot} aria-hidden="true" />
            <h2 className={styles.pixelStatusTitle}>UTM Pixel Tracking</h2>
            <s-badge tone={model.tone}>{model.statusLabel}</s-badge>
          </s-stack>

          {model.actionLabel ? (
            <s-button
              variant="secondary"
              commandFor="utm-pixel-tracking-disclosure"
              command="--show"
            >
              {model.actionLabel}
            </s-button>
          ) : null}
        </s-stack>
      </div>

      {!active ? (
        <s-modal
          id="utm-pixel-tracking-disclosure"
          heading="UTM Pixel Tracking"
        >
          <s-button
            slot="primary-action"
            variant="primary"
            loading={isSubmitting || undefined}
            disabled={isSubmitting || undefined}
            onClick={handleToggle}
          >
            Activate Tracking
          </s-button>
          <s-button
            slot="secondary-actions"
            commandFor="utm-pixel-tracking-disclosure"
            command="--hide"
          >
            Close
          </s-button>

          <s-stack direction="block" gap="base">
            <s-banner tone="info">
              {UTM_PIXEL_PRIVACY_MESSAGE}
            </s-banner>
            <s-stack direction="block" gap="small">
              <p className={styles.pixelDisclosureText}>
                Turn this on to connect ad clicks with bundle orders when shoppers visit through UTM-tagged links.
              </p>
              <p className={styles.pixelDisclosureText}>
                Shopify controls when the pixel can run, so tracking follows each shopper's consent choices.
              </p>
            </s-stack>
          </s-stack>
        </s-modal>
      ) : null}
    </>
  );
}
