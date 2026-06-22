import { useFetcher } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useCallback, useEffect, useState } from "react";
import type { action } from "../app.attribution";

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
  }, [fetcher.data]);

  const handleToggle = useCallback(() => {
    fetcher.submit(
      { intent: active ? "disable" : "enable" },
      { method: "POST" }
    );
  }, [fetcher, active]);

  return (
    <div
      style={{
        borderRadius: 12,
        border: active ? "1px solid #a8e6c1" : "1px solid #e1e3e5",
        background: active
          ? "linear-gradient(135deg, #f0faf4 0%, #ffffff 100%)"
          : "#ffffff",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          height: 4,
          background: active
            ? "linear-gradient(90deg, #00a47c, #34d399)"
            : "linear-gradient(90deg, #b0b8c1, #d1d5db)",
        }}
      />

      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "nowrap" }}>
          <s-stack direction="block" gap="small-100">
            <s-stack direction="inline" alignItems="center" gap="small">
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: active ? "#00a47c" : "#b0b8c1",
                  boxShadow: active ? "0 0 0 3px rgba(0,164,124,0.18)" : "none",
                  flexShrink: 0,
                }}
              />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>UTM Pixel Tracking</h2>
              <s-badge tone={active ? "success" : "neutral"}>{active ? "Active" : "Not active"}</s-badge>
            </s-stack>
            {active ? (
              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                UTM parameters are being captured and attributed to orders at checkout. Your ad spend is being tracked.
              </p>
            ) : (
              <s-stack direction="block" gap="small">
                <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                  Enable tracking to start attributing orders to your ad campaigns. Three steps:
                </p>
                <s-stack direction="block" gap="small-400">
                  <p style={{ margin: 0, fontSize: 13 }}>
                    <strong>1. Enable pixel</strong> — click the button to install the tracking pixel on your store.
                  </p>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    <strong>2. Tag your ad links</strong> — add UTM parameters to any ad URLs, e.g.{" "}
                    <code style={{ background: "rgba(0,0,0,0.06)", padding: "1px 5px", borderRadius: 3, fontSize: 12 }}>
                      ?utm_source=facebook&amp;utm_campaign=bundles
                    </code>
                  </p>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    <strong>3. Watch orders appear</strong> — attributed orders will show up here within minutes of a purchase.
                  </p>
                </s-stack>
              </s-stack>
            )}
          </s-stack>

          <div style={{ flexShrink: 0 }}>
            <s-button
              onClick={handleToggle}
              loading={isSubmitting || undefined}
              disabled={isSubmitting || undefined}
              variant={active ? "secondary" : "primary"}
            >
              {active ? "Disable tracking" : "Enable tracking"}
            </s-button>
          </div>
        </div>
      </div>
    </div>
  );
}
