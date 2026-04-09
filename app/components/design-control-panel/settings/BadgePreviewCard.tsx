import type { CSSProperties } from "react";
import { Text } from "@shopify/polaris";

interface BadgePreviewCardProps {
  /** The merchant-uploaded badge URL. Empty string = show default SVG label. */
  badgeUrl: string;
  /** One of: top-left | top-right | bottom-left | bottom-right */
  position: string;
  /** Text shown when no custom image is uploaded (e.g. "Free" or "Included") */
  defaultLabel: string;
  /** Background colour of the default text badge (matches widget CSS variable default) */
  defaultBadgeBg?: string;
  /** Text colour of the default text badge */
  defaultBadgeTextColor?: string;
  /** Optional heading above the card */
  heading?: string;
}

function getBadgePositionStyle(position: string): CSSProperties {
  const isTop = !position.startsWith("bottom");
  const isLeft = !position.endsWith("right");
  return {
    position: "absolute",
    ...(isTop ? { top: "6px" } : { bottom: "6px" }),
    ...(isLeft ? { left: "6px" } : { right: "6px" }),
  };
}

export function BadgePreviewCard({
  badgeUrl,
  position,
  defaultLabel,
  defaultBadgeBg = "#FFF3CD",
  defaultBadgeTextColor = "#333",
  heading,
}: BadgePreviewCardProps) {
  const badgePos = getBadgePositionStyle(position);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      {heading && (
        <Text as="p" variant="bodyXs" tone="subdued">
          {heading}
        </Text>
      )}
      <div
        style={{
          position: "relative",
          width: "110px",
          height: "150px",
          borderRadius: "8px",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          flexShrink: 0,
        }}
      >
        {/* Image placeholder */}
        <div
          style={{
            width: "100%",
            height: "90px",
            background: "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>

        {/* Product info skeleton */}
        <div style={{ padding: "8px 7px 0" }}>
          <div style={{ height: "6px", background: "#E5E7EB", borderRadius: "3px", marginBottom: "5px" }} />
          <div style={{ height: "5px", background: "#F3F4F6", borderRadius: "3px", width: "65%" }} />
        </div>

        {/* Badge */}
        {badgeUrl ? (
          <img
            src={badgeUrl}
            alt={defaultLabel}
            style={{
              ...badgePos,
              width: "32px",
              height: "32px",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
        ) : (
          <div
            style={{
              ...badgePos,
              background: defaultBadgeBg,
              color: defaultBadgeTextColor,
              fontSize: "9px",
              fontWeight: 700,
              padding: "2px 5px",
              borderRadius: "3px",
              lineHeight: 1.4,
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            {defaultLabel}
          </div>
        )}
      </div>
    </div>
  );
}
