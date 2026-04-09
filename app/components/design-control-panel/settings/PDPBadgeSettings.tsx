import { BlockStack, Text, Divider } from "@shopify/polaris";
import { FilePicker } from "./FilePicker";
import type { SettingsComponentProps } from "./types";

const POSITIONS = [
  { value: "top-left",     label: "↖ Top Left"     },
  { value: "top-right",    label: "↗ Top Right"    },
  { value: "bottom-left",  label: "↙ Bottom Left"  },
  { value: "bottom-right", label: "↘ Bottom Right" },
];

function BadgePositionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
      {POSITIONS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          style={{
            padding: "7px 10px",
            fontSize: "12px",
            fontWeight: value === p.value ? 600 : 400,
            borderRadius: "6px",
            border: value === p.value ? "2px solid #111" : "1px solid #D1D5DB",
            background: value === p.value ? "#F3F4F6" : "#fff",
            cursor: "pointer",
            textAlign: "center",
            transition: "border 0.1s, background 0.1s",
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function PDPBadgeSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Free Gift Badge
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Shown on locked gift-step slot cards. Leave the image blank to use the built-in "Free" label.
      </Text>
      <Divider />

      <Text as="p" variant="bodyMd" fontWeight="medium">
        Custom Badge Image
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        PNG, JPG, SVG or WebP — recommended size 80×80 px or smaller.
      </Text>
      <FilePicker
        value={settings.freeGiftBadgeUrl ?? ""}
        onChange={(url) => onUpdate("freeGiftBadgeUrl", url ?? "")}
        label="Free Gift Badge Image"
        hideCropEditor
      />

      <Text as="p" variant="bodyMd" fontWeight="medium">
        Badge Placement
      </Text>
      <BadgePositionPicker
        value={settings.freeGiftBadgePosition ?? "top-left"}
        onChange={(v) => onUpdate("freeGiftBadgePosition", v)}
      />
    </BlockStack>
  );
}
