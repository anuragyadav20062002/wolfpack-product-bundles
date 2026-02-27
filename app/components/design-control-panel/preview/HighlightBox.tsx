/**
 * HighlightBox
 *
 * Renders a dashed-border highlight around its child without the clipping
 * problems of `outline + outlineOffset`.
 *
 * `outline` is clipped by `overflow: hidden` ancestors; this component uses
 * an absolutely-positioned overlay div instead, which is not affected by
 * parent overflow.
 *
 * Usage:
 *   <HighlightBox active={activeSubSection === "productCard"}>
 *     <div>content to highlight</div>
 *   </HighlightBox>
 */

interface HighlightBoxProps {
  active: boolean;
  children: React.ReactNode;
}

export function HighlightBox({ active, children }: HighlightBoxProps) {
  if (!active) {
    return <>{children}</>;
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {children}
      {/* Overlay draws the dashed border — pointerEvents:none so it doesn't block interaction */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-4px",
          border: "2px dashed #5C6AC4",
          borderRadius: "4px",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />
    </div>
  );
}
