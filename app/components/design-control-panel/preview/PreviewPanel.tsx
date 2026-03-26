import { useRef, useEffect, useState } from "react";
import type { DesignSettings } from "../../../types/state.types";
import { BundleType } from "../../../constants/bundle";
import { settingsToCSSVarRecord } from "../../../lib/preview-css-vars";
import { AppPreviewIframe, DualAppPreviewIframe } from "./StorefrontIframePreview";

interface PreviewPanelProps {
  settings: DesignSettings;
  bundleType: BundleType;
  /**
   * URL of the app-served preview page.
   * When null/undefined, no preview is rendered.
   */
  previewUrl?: string | null;
  /** Active sub-section — used to toggle tier pills vs header tabs in FPB preview. */
  activeSubSection?: string;
  isDirty?: boolean;
  saveCount?: number;
}

type FpbFooterLayout = "sidebar" | "floating";
type ViewportMode = "desktop" | "mobile";
const DESKTOP_WIDTH = 1440;
const MOBILE_WIDTH = 375;

const TOGGLE_BTN_BASE: React.CSSProperties = {
  padding: "5px 12px",
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

const ICON_BTN_BASE: React.CSSProperties = {
  width: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1.5px solid #ddd",
  borderRadius: "6px",
  background: "#fff",
  color: "#666",
  cursor: "pointer",
  padding: 0,
  transition: "background 0.12s, color 0.12s, border-color 0.12s",
  flexShrink: 0,
};

const ICON_BTN_ACTIVE: React.CSSProperties = {
  ...ICON_BTN_BASE,
  background: "#1a1a1a",
  color: "#fff",
  borderColor: "#1a1a1a",
};

function buildCssVarString(settings: DesignSettings): string {
  const record = settingsToCSSVarRecord(settings);
  return Object.entries(record)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

/**
 * PreviewPanel — always-on app-served iframe preview.
 *
 * For FPB, both sidebar and floating-footer iframes are loaded simultaneously
 * on mount. The footer layout toggle switches between them via a 150 ms CSS
 * opacity crossfade — no iframe reload, no blank flash.
 *
 * For PDP, a single iframe is used (no layout variants needed).
 *
 * CSS variables are pushed into all active iframes via BroadcastChannel on every
 * settings change — no save or reload required.
 */
export function PreviewPanel({ settings, bundleType, previewUrl, activeSubSection }: PreviewPanelProps) {
  const isFpb = bundleType === BundleType.FULL_PAGE;
  const channelName = isFpb ? "dcp-css-updates-fpb" : "dcp-css-updates-pdp";

  // ── FPB: dual-iframe refs (used by DualAppPreviewIframe for onLoad tracking) ─
  const sidebarRef = useRef<HTMLIFrameElement>(null);
  const floatingRef = useRef<HTMLIFrameElement>(null);

  // ── PDP: single-iframe ref ─────────────────────────────────────────────────
  const singleRef = useRef<HTMLIFrameElement>(null);

  // ── BroadcastChannel — same-origin cross-frame CSS delivery ───────────────
  // Bypasses the App Bridge v4 modal-frame hierarchy issue where window.parent
  // inside preview iframes points to the modal frame, not the app-iframe.
  const channelRef = useRef<BroadcastChannel | null>(null);
  const latestCssVarsRef = useRef<string>("");

  useEffect(() => {
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.addEventListener("message", (e: MessageEvent) => {
      // Preview iframe just loaded — send it the current CSS vars immediately
      if ((e.data as { type?: string } | null)?.type === "DCP_PREVIEW_READY") {
        if (latestCssVarsRef.current) {
          channel.postMessage({ type: "DCP_CSS_UPDATE", vars: latestCssVarsRef.current });
        }
      }
    });

    return () => {
      channel.close();
      channelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);

  // ── Push CSS var updates on every settings change ──────────────────────────
  useEffect(() => {
    const cssVars = buildCssVarString(settings);
    latestCssVarsRef.current = cssVars;
    channelRef.current?.postMessage({ type: "DCP_CSS_UPDATE", vars: cssVars });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // ── Broadcast section changes so the preview can show/hide tier pills vs tabs
  useEffect(() => {
    if (activeSubSection !== undefined) {
      channelRef.current?.postMessage({ type: "DCP_SECTION_CHANGE", section: activeSubSection });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubSection]);

  // Footer layout toggle — FPB only
  const [fpbFooterLayout, setFpbFooterLayout] = useState<FpbFooterLayout>("sidebar");
  // Viewport toggle — both bundle types
  const [viewportMode, setViewportMode] = useState<ViewportMode>("desktop");
  const viewportWidth = viewportMode === "mobile" ? MOBILE_WIDTH : DESKTOP_WIDTH;

  // Build FPB URLs (both always constructed when previewUrl is set)
  const sep = previewUrl?.includes("?") ? "&" : "?";
  const sidebarUrl = previewUrl ? `${previewUrl}${sep}footerLayout=sidebar` : null;
  const floatingUrl = previewUrl ? `${previewUrl}${sep}footerLayout=floating` : null;

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

  const LABEL_STYLE: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 600,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Control bar: viewport icons (left) + layout toggle (right, FPB only) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>

        {/* Viewport icon buttons */}
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            style={viewportMode === "desktop" ? ICON_BTN_ACTIVE : ICON_BTN_BASE}
            onClick={() => setViewportMode("desktop")}
            title="Desktop"
          >
            {/* Monitor icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8"/>
              <path d="M12 17v4"/>
            </svg>
          </button>
          <button
            style={viewportMode === "mobile" ? ICON_BTN_ACTIVE : ICON_BTN_BASE}
            onClick={() => setViewportMode("mobile")}
            title="Mobile"
          >
            {/* Phone icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3"/>
            </svg>
          </button>
        </div>

        {/* Layout toggle — FPB only */}
        {isFpb && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={LABEL_STYLE}>Layout</span>
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
              Floating
            </button>
          </div>
        )}

      </div>

      {/* Preview iframe(s) */}
      {isFpb && sidebarUrl && floatingUrl ? (
        <DualAppPreviewIframe
          urlA={sidebarUrl}
          urlB={floatingUrl}
          activeKey={fpbFooterLayout === "sidebar" ? "a" : "b"}
          refA={sidebarRef}
          refB={floatingRef}
          viewportWidth={viewportWidth}
        />
      ) : (
        <AppPreviewIframe ref={singleRef} url={previewUrl} viewportWidth={viewportWidth} />
      )}
    </div>
  );
}
