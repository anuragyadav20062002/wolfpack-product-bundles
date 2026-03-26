import { useRef, useEffect, useState, useCallback, forwardRef } from "react";
import { Spinner } from "@shopify/polaris";

// ─── Shared constants ────────────────────────────────────────────────────────

// The iframe is rendered at full desktop resolution and CSS-scaled down to fit
// the preview panel. This gives a pixel-accurate representation of the widget
// without clipping or scrollbars at any panel width.
const DESKTOP_WIDTH = 1440;
const DESKTOP_HEIGHT = 900;

interface AppPreviewIframeProps {
  /** URL of the app-served preview page (e.g. /api/preview/pdp?shop=...) */
  url: string;
  /** Viewport width to simulate. Defaults to DESKTOP_WIDTH (1440). Use 375 for mobile. */
  viewportWidth?: number;
}

/**
 * AppPreviewIframe — renders the app-served bundle widget preview in a
 * CSS-scaled iframe.
 *
 * The iframe is interactive (no pointer-events block) so merchants can open
 * the PDP modal, scroll the product grid, etc. CSS updates are pushed into
 * the iframe by the parent via postMessage; no reload required.
 *
 * The ref is forwarded so the parent (PreviewPanel) can call
 * iframeRef.current.contentWindow.postMessage(...) to push CSS updates.
 */
export const AppPreviewIframe = forwardRef<HTMLIFrameElement, AppPreviewIframeProps>(
  function AppPreviewIframe({ url, viewportWidth = DESKTOP_WIDTH }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    // Measure the container width and compute the CSS scale factor.
    // ResizeObserver ensures the scale stays correct if the panel resizes.
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const observer = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? 0;
        if (width > 0) setScale(width / viewportWidth);
      });

      observer.observe(container);
      return () => observer.disconnect();
    }, [viewportWidth]);

    // Reset loading state when the URL changes.
    useEffect(() => {
      setIsLoading(true);
      setLoadError(false);
    }, [url]);

    const handleLoad = useCallback(() => {
      setIsLoading(false);
    }, []);

    const handleError = useCallback(() => {
      setIsLoading(false);
      setLoadError(true);
    }, []);

    // Container height matches the scaled-down iframe so it doesn't overflow.
    const containerHeight = scale > 0 ? Math.round(DESKTOP_HEIGHT * scale) : 0;
    // Reset scale when viewportWidth changes so there's no flash of wrong size
    useEffect(() => { setScale(0); }, [viewportWidth]);

    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: containerHeight > 0 ? `${containerHeight}px` : "auto",
          position: "relative",
          overflow: "hidden",
          background: "#f4f4f4",
          borderRadius: "8px",
        }}
      >
        {/* Loading spinner — shown until the iframe fires onLoad */}
        {(isLoading || scale === 0) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              background: "#f4f4f4",
              zIndex: 1,
              minHeight: "200px",
            }}
          >
            <Spinner accessibilityLabel="Loading preview" />
            <span style={{ fontSize: "13px", color: "#6d7175" }}>
              Loading preview…
            </span>
          </div>
        )}

        {/* Error fallback */}
        {loadError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "#f4f4f4",
              zIndex: 1,
              padding: "24px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#303030" }}>
              Preview unavailable
            </span>
            <span style={{ fontSize: "13px", color: "#6d7175", maxWidth: "300px" }}>
              Could not load the widget preview. Reload the page to try again.
            </span>
          </div>
        )}

        {/* The iframe — rendered at the target viewport width, then scaled down */}
        {scale > 0 && (
          <iframe
            ref={ref}
            key={url}
            src={url}
            title="Bundle widget preview"
            sandbox="allow-scripts allow-same-origin"
            style={{
              width: `${viewportWidth}px`,
              height: `${DESKTOP_HEIGHT}px`,
              border: "none",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              display: "block",
            }}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    );
  }
);

// Keep the old name as an alias for backwards compatibility within this file
export { AppPreviewIframe as StorefrontIframePreview };

// ─── DualAppPreviewIframe ─────────────────────────────────────────────────────
//
// Renders two iframes (urlA and urlB) in a shared scaled container.
// Both are mounted and loaded on mount so switching between them requires no
// reload. The active iframe is shown at full opacity; the inactive one is hidden
// with opacity: 0 and pointer-events: none. Switching is a 150 ms CSS fade.

interface DualAppPreviewIframeProps {
  urlA: string;
  urlB: string;
  /** Which iframe is currently visible */
  activeKey: "a" | "b";
  refA: React.RefObject<HTMLIFrameElement>;
  refB: React.RefObject<HTMLIFrameElement>;
  /** Viewport width to simulate. Defaults to DESKTOP_WIDTH (1440). Use 375 for mobile. */
  viewportWidth?: number;
}

export function DualAppPreviewIframe({
  urlA,
  urlB,
  activeKey,
  refA,
  refB,
  viewportWidth = DESKTOP_WIDTH,
}: DualAppPreviewIframeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [loadedA, setLoadedA] = useState(false);
  const [loadedB, setLoadedB] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0) setScale(width / viewportWidth);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [viewportWidth]);

  const containerHeight = scale > 0 ? Math.round(DESKTOP_HEIGHT * scale) : 0;
  const activeLoaded = activeKey === "a" ? loadedA : loadedB;

  const iframeStyle = (isActive: boolean): React.CSSProperties => ({
    position: "absolute",
    top: 0,
    left: 0,
    width: `${viewportWidth}px`,
    height: `${DESKTOP_HEIGHT}px`,
    border: "none",
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    display: "block",
    opacity: isActive ? 1 : 0,
    pointerEvents: isActive ? "auto" : "none",
    transition: "opacity 150ms ease",
    zIndex: isActive ? 2 : 1,
  });

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: containerHeight > 0 ? `${containerHeight}px` : "200px",
        position: "relative",
        overflow: "hidden",
        background: "#f4f4f4",
        borderRadius: "8px",
      }}
    >
      {/* Loading spinner — shown until the active iframe has fired onLoad */}
      {(!activeLoaded || scale === 0) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            background: "#f4f4f4",
            zIndex: 10,
            minHeight: "200px",
          }}
        >
          <Spinner accessibilityLabel="Loading preview" />
          <span style={{ fontSize: "13px", color: "#6d7175" }}>
            Loading preview…
          </span>
        </div>
      )}

      {scale > 0 && (
        <>
          <iframe
            ref={refA}
            src={urlA}
            title="Bundle widget preview – sidebar"
            sandbox="allow-scripts allow-same-origin"
            style={iframeStyle(activeKey === "a")}
            onLoad={() => setLoadedA(true)}
          />
          <iframe
            ref={refB}
            src={urlB}
            title="Bundle widget preview – floating footer"
            sandbox="allow-scripts allow-same-origin"
            style={iframeStyle(activeKey === "b")}
            onLoad={() => setLoadedB(true)}
          />
        </>
      )}
    </div>
  );
}
