import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button, Text } from "@shopify/polaris";

/** Stored crop format — all values are percentages of the rendered image container */
export interface CropData {
  x: number;      // left edge % of container width
  y: number;      // top edge % of container height
  width: number;  // crop box width % of container width
}

interface CropBox {
  x: number;      // pixels
  y: number;      // pixels
  width: number;  // pixels
}

interface ImageCropEditorProps {
  imageUrl: string;
  cropValue: string | null;  // existing JSON CropData or null
  onConfirm: (crop: string) => void;
  onClose: () => void;
}

const CROP_ASPECT = 3 / 16; // height = width * CROP_ASPECT

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function ImageCropEditor({ imageUrl, cropValue, onConfirm, onClose }: ImageCropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Capture Escape at capture phase to prevent parent modals from closing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [onClose]);

  // Initialise crop box once the image has rendered and we know the container size
  const initCropBox = useCallback(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;

    if (cropValue) {
      try {
        const existing = JSON.parse(cropValue) as CropData;
        const boxW = (existing.width / 100) * cw;
        const boxH = boxW * CROP_ASPECT;
        setCropBox({
          x: clamp((existing.x / 100) * cw, 0, cw - boxW),
          y: clamp((existing.y / 100) * ch, 0, ch - boxH),
          width: boxW,
        });
        return;
      } catch {
        // fall through to default
      }
    }

    // Default: 80% width, centered
    const boxW = cw * 0.8;
    const boxH = boxW * CROP_ASPECT;
    setCropBox({
      x: (cw - boxW) / 2,
      y: (ch - boxH) / 2,
      width: boxW,
    });
  }, [cropValue]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    // Use rAF to ensure layout has settled before reading dimensions
    requestAnimationFrame(() => initCropBox());
  }, [initCropBox]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!cropBox) return;
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - cropBox.x,
      y: e.clientY - cropBox.y,
    };
  }, [cropBox]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !cropBox || !containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const boxH = cropBox.width * CROP_ASPECT;

    const newX = clamp(e.clientX - dragOffsetRef.current.x, 0, cw - cropBox.width);
    const newY = clamp(e.clientY - dragOffsetRef.current.y, 0, ch - boxH);

    setCropBox((prev) => prev ? { ...prev, x: newX, y: newY } : prev);
  }, [cropBox]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!cropBox) return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: touch.clientX - cropBox.x,
      y: touch.clientY - cropBox.y,
    };
  }, [cropBox]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || !cropBox || !containerRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const boxH = cropBox.width * CROP_ASPECT;

    const newX = clamp(touch.clientX - dragOffsetRef.current.x, 0, cw - cropBox.width);
    const newY = clamp(touch.clientY - dragOffsetRef.current.y, 0, ch - boxH);

    setCropBox((prev) => prev ? { ...prev, x: newX, y: newY } : prev);
  }, [cropBox]);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleConfirm = useCallback(() => {
    if (!cropBox || !containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;

    const crop: CropData = {
      x: clamp((cropBox.x / cw) * 100, 0, 100),
      y: clamp((cropBox.y / ch) * 100, 0, 100),
      width: clamp((cropBox.width / cw) * 100, 1, 100),
    };
    onConfirm(JSON.stringify(crop));
  }, [cropBox, onConfirm]);

  const boxH = cropBox ? cropBox.width * CROP_ASPECT : 0;

  const content = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 199999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      />

      {/* Dialog */}
      <div
        style={{
          position: "relative",
          width: "min(90vw, 720px)",
          maxHeight: "90vh",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #e1e3e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Text as="span" variant="headingMd">Adjust image position</Text>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              fontSize: "18px",
              lineHeight: 1,
              color: "#6d7175",
              borderRadius: "4px",
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 12px" }}>
          {/* Image container with overlay and crop box */}
          <div
            ref={containerRef}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "6px",
              userSelect: "none",
              cursor: isDraggingRef.current ? "grabbing" : "default",
              maxHeight: "60vh",
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={imageUrl}
              alt="Image to crop"
              style={{ display: "block", width: "100%", height: "auto" }}
              onLoad={handleImageLoad}
              draggable={false}
            />

            {imageLoaded && cropBox && (
              <>
                {/* Dark overlays: top, left, right, bottom */}
                {/* Top */}
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0,
                  height: cropBox.y,
                  background: "rgba(0,0,0,0.52)",
                  pointerEvents: "none",
                }} />
                {/* Bottom */}
                <div style={{
                  position: "absolute",
                  top: cropBox.y + boxH, left: 0, right: 0, bottom: 0,
                  background: "rgba(0,0,0,0.52)",
                  pointerEvents: "none",
                }} />
                {/* Left */}
                <div style={{
                  position: "absolute",
                  top: cropBox.y,
                  left: 0,
                  width: cropBox.x,
                  height: boxH,
                  background: "rgba(0,0,0,0.52)",
                  pointerEvents: "none",
                }} />
                {/* Right */}
                <div style={{
                  position: "absolute",
                  top: cropBox.y,
                  left: cropBox.x + cropBox.width,
                  right: 0,
                  height: boxH,
                  background: "rgba(0,0,0,0.52)",
                  pointerEvents: "none",
                }} />

                {/* Crop box — draggable */}
                <div
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  style={{
                    position: "absolute",
                    left: cropBox.x,
                    top: cropBox.y,
                    width: cropBox.width,
                    height: boxH,
                    border: "2px solid rgba(255,255,255,0.9)",
                    boxSizing: "border-box",
                    cursor: "grab",
                    borderRadius: "2px",
                  }}
                >
                  {/* Corner markers */}
                  {[
                    { top: -3, left: -3 },
                    { top: -3, right: -3 },
                    { bottom: -3, left: -3 },
                    { bottom: -3, right: -3 },
                  ].map((pos, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        width: 8,
                        height: 8,
                        background: "white",
                        borderRadius: "1px",
                        ...pos,
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Loading state */}
            {!imageLoaded && (
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f6f6f7",
              }}>
                <Text as="p" variant="bodySm" tone="subdued">Loading image…</Text>
              </div>
            )}
          </div>

          <div style={{ marginTop: "10px" }}>
            <Text as="p" variant="bodySm" tone="subdued">
              Drag the box to choose which part of the image is shown in the promo banner.
            </Text>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #e1e3e5",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!cropBox || !imageLoaded}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
