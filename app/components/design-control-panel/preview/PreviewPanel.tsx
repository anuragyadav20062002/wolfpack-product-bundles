import { useRef, useEffect, useState } from "react";
import type { DesignSettings } from "../../../types/state.types";
import { BundleType } from "../../../constants/bundle";
import { settingsToCSSVarRecord } from "../../../lib/preview-css-vars";
import { AppPreviewIframe } from "./StorefrontIframePreview";

interface PreviewPanelProps {
  settings: DesignSettings;
  bundleType: BundleType;
  /**
   * URL of the app-served preview page.
   * When null/undefined, no preview is rendered.
   */
  previewUrl?: string | null;
  // Kept for API compatibility — no longer used internally.
  activeSubSection?: string;
  isDirty?: boolean;
  saveCount?: number;
}

type FpbFooterLayout = "sidebar" | "floating";

const TOGGLE_BTN_BASE: React.CSSProperties = {
  padding: "6px 16px",
  border: "1.5px solid #ddd",
  borderRadius: "6px",
  background: "#fff",
  color: "#444",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: "1.4",
  transition: "background 0.12s, color 0.12s, border-color 0.12s",
};

const TOGGLE_BTN_ACTIVE: React.CSSProperties = {
  ...TOGGLE_BTN_BASE,
  background: "#1a1a1a",
  color: "#fff",
  borderColor: "#1a1a1a",
};

/**
 * PreviewPanel — always-on app-served iframe preview.
 *
 * Shows an interactive bundle widget preview (PDP modal open / FPB full layout)
 * that updates in real-time as the merchant changes settings. CSS variables are
 * pushed into the iframe via postMessage on every settings change — no save or
 * reload required.
 *
 * For FPB, a footer layout toggle (Sidebar | Floating Footer) lets the merchant
 * preview both layout options without switching away from the DCP.
 */
export function PreviewPanel({ settings, bundleType, previewUrl }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Track whether the iframe has signalled readiness
  const iframeReadyRef = useRef(false);
  // Buffer the last CSS payload so we can replay it on ready
  const pendingCssRef = useRef<string | null>(null);

  // Footer layout toggle — only relevant for FPB
  const [fpbFooterLayout, setFpbFooterLayout] = useState<FpbFooterLayout>("sidebar");

  // Compute the effective iframe URL (append footerLayout for FPB)
  const effectiveUrl = (() => {
    if (!previewUrl) return null;
    if (bundleType !== BundleType.FULL_PAGE) return previewUrl;
    const sep = previewUrl.includes("?") ? "&" : "?";
    return `${previewUrl}${sep}footerLayout=${fpbFooterLayout}`;
  })();

  // Build the CSS variable string from current settings
  const buildCssVarString = () => {
    const record = settingsToCSSVarRecord(settings);
    return Object.entries(record)
      .map(([k, v]) => `${k}:${v}`)
      .join(";");
  };

  // Listen for DCP_PREVIEW_READY from the iframe, then flush pending CSS
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if ((e.data as { type?: string } | null)?.type === "DCP_PREVIEW_READY") {
        iframeReadyRef.current = true;
        if (pendingCssRef.current !== null) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "DCP_CSS_UPDATE", vars: pendingCssRef.current },
            "*"
          );
          pendingCssRef.current = null;
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Reset ready state when the URL changes (iframe reloads)
  useEffect(() => {
    iframeReadyRef.current = false;
  }, [effectiveUrl]);

  // Push CSS variable updates to the iframe on every settings change
  useEffect(() => {
    const cssVars = buildCssVarString();
    if (iframeReadyRef.current) {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "DCP_CSS_UPDATE", vars: cssVars },
        "*"
      );
    } else {
      // Buffer for when iframe becomes ready
      pendingCssRef.current = cssVars;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  if (!effectiveUrl) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "300px",
          color: "#6d7175",
          fontSize: "13px",
          background: "#f4f4f4",
          borderRadius: "8px",
        }}
      >
        Preview not available
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Footer layout toggle — FPB only */}
      {bundleType === BundleType.FULL_PAGE && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Footer layout:
          </span>
          <button
            style={fpbFooterLayout === "sidebar" ? TOGGLE_BTN_ACTIVE : TOGGLE_BTN_BASE}
            onClick={() => setFpbFooterLayout("sidebar")}
          >
            Sidebar
          </button>
          <button
            style={fpbFooterLayout === "floating" ? TOGGLE_BTN_ACTIVE : TOGGLE_BTN_BASE}
            onClick={() => setFpbFooterLayout("floating")}
          >
            Floating Footer
          </button>
        </div>
      )}

      <AppPreviewIframe ref={iframeRef} url={effectiveUrl} />
    </div>
  );
}
