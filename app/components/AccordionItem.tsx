import { useState, useCallback, type ReactNode } from "react";
import { Card, BlockStack, InlineStack, Text } from "@shopify/polaris";

interface AccordionItemProps {
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({
  title,
  subtitle,
  badge,
  badgeColor = "#e8f4fd",
  badgeTextColor = "#0066b2",
  children,
  defaultOpen = false,
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <Card padding="0">
      {/* ── Header (always visible) ─────────────────────────────────── */}
      <div
        onClick={toggle}
        style={{
          padding: "16px 20px",
          cursor: "pointer",
          userSelect: "none",
          borderRadius: isOpen ? "12px 12px 0 0" : "12px",
          transition: "background-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f6f6f7";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <InlineStack align="space-between" blockAlign="center" gap="400">
          <BlockStack gap="050">
            <InlineStack gap="200" blockAlign="center">
              <Text variant="bodyMd" fontWeight="semibold" as="p">
                {title}
              </Text>
              {badge && (
                <span
                  style={{
                    background: badgeColor,
                    color: badgeTextColor,
                    borderRadius: 20,
                    padding: "2px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {badge}
                </span>
              )}
            </InlineStack>
            <Text variant="bodySm" tone="subdued" as="p">
              {subtitle}
            </Text>
          </BlockStack>

          {/* Chevron */}
          <div
            style={{
              flexShrink: 0,
              transition: "transform 0.22s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              color: "#6d7175",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </InlineStack>
      </div>

      {/* ── Expandable content ──────────────────────────────────────── */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: isOpen ? "2000px" : "0",
          opacity: isOpen ? 1 : 0,
          transition: isOpen
            ? "max-height 0.35s ease, opacity 0.22s ease"
            : "max-height 0.25s ease, opacity 0.15s ease",
        }}
      >
        <div
          style={{
            borderTop: "1px solid #e1e3e5",
            padding: "20px",
          }}
        >
          {children}
        </div>
      </div>
    </Card>
  );
}
