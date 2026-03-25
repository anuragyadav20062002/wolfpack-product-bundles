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

function buildCssVarString(settings: DesignSettings): string {
  const record = settingsToCSSVarRecord(settings);
  return Object.entries(record)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

function pushCss(
  iframeRef: React.RefObject<HTMLIFrameElement>,
  readyRef: React.MutableRefObject<boolean>,
  pendingRef: React.MutableRefObject<string | null>,
  cssVars: string
) {
  if (readyRef.current) {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "DCP_CSS_UPDATE", vars: cssVars },
      "*"
    );
  } else {
    pendingRef.current = cssVars;
  }
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
 * CSS variables are pushed into all active iframes via postMessage on every
 * settings change — no save or reload required.
 */
export function PreviewPanel({ settings, bundleType, previewUrl }: PreviewPanelProps) {
  const isFpb = bundleType === BundleType.FULL_PAGE;

  // ── FPB: dual-iframe refs + ready tracking ─────────────────────────────────
  const sidebarRef = useRef<HTMLIFrameElement>(null);
  const floatingRef = useRef<HTMLIFrameElement>(null);
  const readySidebar = useRef(false);
  const readyFloating = useRef(false);
  const pendingSidebar = useRef<string | null>(null);
  const pendingFloating = useRef<string | null>(null);

  // ── PDP: single-iframe refs ────────────────────────────────────────────────
  const singleRef = useRef<HTMLIFrameElement>(null);
  const readySingle = useRef(false);
  const pendingSingle = useRef<string | null>(null);

  // Footer layout toggle — FPB only
  const [fpbFooterLayout, setFpbFooterLayout] = useState<FpbFooterLayout>("sidebar");

  // Build FPB URLs (both always constructed when previewUrl is set)
  const sep = previewUrl?.includes("?") ? "&" : "?";
  const sidebarUrl = previewUrl ? `${previewUrl}${sep}footerLayout=sidebar` : null;
  const floatingUrl = previewUrl ? `${previewUrl}${sep}footerLayout=floating` : null;

  // ── Listen for DCP_PREVIEW_READY — identify iframe by e.source ─────────────
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if ((e.data as { type?: string } | null)?.type !== "DCP_PREVIEW_READY") return;
      const src = e.source;

      if (isFpb) {
        if (src === sidebarRef.current?.contentWindow) {
          readySidebar.current = true;
          if (pendingSidebar.current !== null) {
            sidebarRef.current?.contentWindow?.postMessage(
              { type: "DCP_CSS_UPDATE", vars: pendingSidebar.current },
              "*"
            );
            pendingSidebar.current = null;
          }
        } else if (src === floatingRef.current?.contentWindow) {
          readyFloating.current = true;
          if (pendingFloating.current !== null) {
            floatingRef.current?.contentWindow?.postMessage(
              { type: "DCP_CSS_UPDATE", vars: pendingFloating.current },
              "*"
            );
            pendingFloating.current = null;
          }
        }
      } else {
        if (src === singleRef.current?.contentWindow) {
          readySingle.current = true;
          if (pendingSingle.current !== null) {
            singleRef.current?.contentWindow?.postMessage(
              { type: "DCP_CSS_UPDATE", vars: pendingSingle.current },
              "*"
            );
            pendingSingle.current = null;
          }
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFpb]);

  // Reset single-iframe ready state when its URL changes
  useEffect(() => {
    readySingle.current = false;
  }, [previewUrl]);

  // ── Push CSS var updates to all iframes on every settings change ───────────
  useEffect(() => {
    const cssVars = buildCssVarString(settings);
    if (isFpb) {
      pushCss(sidebarRef, readySidebar, pendingSidebar, cssVars);
      pushCss(floatingRef, readyFloating, pendingFloating, cssVars);
    } else {
      pushCss(singleRef, readySingle, pendingSingle, cssVars);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Footer layout toggle — FPB only */}
      {isFpb && (
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

      {/* Preview iframe(s) */}
      {isFpb && sidebarUrl && floatingUrl ? (
        <DualAppPreviewIframe
          urlA={sidebarUrl}
          urlB={floatingUrl}
          activeKey={fpbFooterLayout === "sidebar" ? "a" : "b"}
          refA={sidebarRef}
          refB={floatingRef}
        />
      ) : (
        <AppPreviewIframe ref={singleRef} url={previewUrl} />
      )}
    </div>
  );
}
