import { useRef, useEffect } from "react";
import type { DesignSettings } from "../../../types/state.types";
import type { BundleType } from "../../../constants/bundle";
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

/**
 * PreviewPanel — always-on app-served iframe preview.
 *
 * Shows an interactive bundle widget preview (PDP modal open / FPB full layout)
 * that updates in real-time as the merchant changes settings. CSS variables are
 * pushed into the iframe via postMessage on every settings change — no save or
 * reload required.
 *
 * The preview page is served from the same app origin so there are no
 * X-Frame-Options issues and postMessage works without cross-origin restrictions.
 */
export function PreviewPanel({ settings, previewUrl }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Track whether the iframe has signalled readiness
  const iframeReadyRef = useRef(false);
  // Buffer the last CSS payload so we can replay it on ready
  const pendingCssRef = useRef<string | null>(null);

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
  }, [previewUrl]);

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

  if (!previewUrl) {
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

  return <AppPreviewIframe ref={iframeRef} url={previewUrl} />;
}
