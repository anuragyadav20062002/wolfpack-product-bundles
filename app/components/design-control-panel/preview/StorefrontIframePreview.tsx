import { useRef, useEffect, useState, useCallback } from "react";
import { Spinner } from "@shopify/polaris";

// The iframe is rendered at full desktop resolution and CSS-scaled down to fit
// the preview panel. This gives the merchant a pixel-accurate representation
// of their storefront without any network calls while they are editing.
const DESKTOP_WIDTH = 1440;
const DESKTOP_HEIGHT = 900;

interface StorefrontIframePreviewProps {
  /** Storefront URL to load (e.g. https://mystore.myshopify.com/products/my-product) */
  url: string;
  /**
   * Increments on every successful DCP save, forcing the iframe to reload
   * and reflect the latest persisted design settings.
   */
  saveCount: number;
}

export function StorefrontIframePreview({ url, saveCount }: StorefrontIframePreviewProps) {
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
      if (width > 0) setScale(width / DESKTOP_WIDTH);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Reset loading state whenever the URL or saveCount changes.
  useEffect(() => {
    setIsLoading(true);
    setLoadError(false);
  }, [url, saveCount]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setLoadError(true);
  }, []);

  // Container height matches the scaled-down iframe so it doesn't overflow.
  const containerHeight = scale > 0 ? Math.round(DESKTOP_HEIGHT * scale) : 0;

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
          <Spinner accessibilityLabel="Loading storefront preview" />
          <span style={{ fontSize: "13px", color: "#6d7175" }}>Loading live preview…</span>
        </div>
      )}

      {/* Error / blocked fallback */}
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
          <span style={{ fontSize: "24px" }}>🔒</span>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#303030" }}>
            Live preview unavailable
          </span>
          <span style={{ fontSize: "13px", color: "#6d7175", maxWidth: "300px" }}>
            Your store's security settings prevent embedding in a preview.
            Save your changes and open the storefront directly to verify the result.
          </span>
        </div>
      )}

      {/* The iframe — rendered at full desktop size, then scaled down */}
      {scale > 0 && (
        <iframe
          key={`${url}-${saveCount}`}
          src={url}
          title="Storefront live preview"
          sandbox="allow-scripts allow-same-origin"
          style={{
            width: `${DESKTOP_WIDTH}px`,
            height: `${DESKTOP_HEIGHT}px`,
            border: "none",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            // Read-only: block all pointer events so the merchant can't click
            // inside the iframe accidentally while working in the DCP.
            pointerEvents: "none",
            display: "block",
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}
