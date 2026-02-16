import { Text } from "@shopify/polaris";

interface GlobalColorsPreviewProps {
  globalPrimaryButtonColor: string;
  globalButtonTextColor: string;
  globalPrimaryTextColor: string;
  globalSecondaryTextColor: string;
  globalFooterBgColor: string;
  globalFooterTextColor: string;
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "8px",
          backgroundColor: color,
          border: "1px solid rgba(0, 0, 0, 0.15)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        }}
      />
      <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: 500, textAlign: "center", maxWidth: "64px" }}>
        {label}
      </span>
    </div>
  );
}

export function GlobalColorsPreview(props: GlobalColorsPreviewProps) {
  const {
    globalPrimaryButtonColor,
    globalButtonTextColor,
    globalPrimaryTextColor,
    globalSecondaryTextColor,
    globalFooterBgColor,
    globalFooterTextColor,
  } = props;

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <Text as="h3" variant="headingLg" fontWeight="semibold">
        Global Colors
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        These colors apply across the entire bundle widget
      </Text>

      <div style={{ marginTop: "32px", display: "inline-block" }}>
        {/* Mini Bundle Mockup */}
        <div
          style={{
            width: "380px",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          }}
        >
          {/* Header area */}
          <div style={{ padding: "20px 24px", backgroundColor: "#FAFAFA", borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ color: globalPrimaryTextColor, fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
              Bundle Title
            </div>
            <div style={{ color: globalSecondaryTextColor, fontSize: "13px" }}>
              Choose your products to build your bundle
            </div>
          </div>

          {/* Card area */}
          <div style={{ padding: "20px 24px" }}>
            <div
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div style={{ width: "48px", height: "48px", backgroundColor: "#F3F4F6", borderRadius: "6px", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: globalPrimaryTextColor, fontSize: "14px", fontWeight: 500 }}>Product Name</div>
                <div style={{ color: globalSecondaryTextColor, fontSize: "12px" }}>$14.99</div>
              </div>
              <button
                style={{
                  backgroundColor: globalPrimaryButtonColor,
                  color: globalButtonTextColor,
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "default",
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Footer area */}
          <div
            style={{
              padding: "16px 24px",
              backgroundColor: globalFooterBgColor,
              borderTop: "1px solid #E5E7EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: globalFooterTextColor, fontSize: "13px", fontWeight: 500 }}>Total: $14.99</span>
            <button
              style={{
                backgroundColor: globalPrimaryButtonColor,
                color: globalButtonTextColor,
                border: "none",
                borderRadius: "6px",
                padding: "8px 20px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "default",
              }}
            >
              Next
            </button>
          </div>
        </div>

        {/* Color Swatches */}
        <div style={{ marginTop: "28px", display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <ColorSwatch color={globalPrimaryButtonColor} label="Button" />
          <ColorSwatch color={globalButtonTextColor} label="Button Text" />
          <ColorSwatch color={globalPrimaryTextColor} label="Primary Text" />
          <ColorSwatch color={globalSecondaryTextColor} label="Secondary Text" />
          <ColorSwatch color={globalFooterBgColor} label="Footer BG" />
          <ColorSwatch color={globalFooterTextColor} label="Footer Text" />
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        <Text as="p" variant="bodySm" tone="subdued">
          Preview updates as you customize
        </Text>
      </div>
    </div>
  );
}
