import { BlockStack, Text, Divider, Button, ButtonGroup, RangeSlider } from "@shopify/polaris";
import { InlineColorInput } from "../common/InlineColorInput";
import { FilePicker } from "./FilePicker";
import type { SettingsComponentProps } from "./types";

export function WidgetStyleSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Widget Style
      </Text>
      <Divider />

      <RangeSlider
        label="Overlay opacity"
        value={(settings.bottomSheetOverlayOpacity ?? 0.5) * 100}
        min={0}
        max={80}
        step={5}
        output
        onChange={(val) => onUpdate("bottomSheetOverlayOpacity", (val as number) / 100)}
        suffix={`${Math.round((settings.bottomSheetOverlayOpacity ?? 0.5) * 100)}%`}
      />

      <RangeSlider
        label="Open animation duration (ms)"
        value={settings.bottomSheetAnimationDuration ?? 400}
        min={200}
        max={600}
        step={50}
        output
        onChange={(val) => onUpdate("bottomSheetAnimationDuration", val as number)}
        suffix={`${settings.bottomSheetAnimationDuration ?? 400}ms`}
      />

      <Divider />

      <Text as="p" variant="bodyMd" fontWeight="medium">
        Empty Slot Card Border Style
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Border style for empty product slots in the grid. Color is shared with Empty State → Card Border Color.
      </Text>
      <ButtonGroup variant="segmented">
        <Button
          pressed={(settings.emptySlotBorderStyle ?? "dashed") === "dashed"}
          onClick={() => onUpdate("emptySlotBorderStyle", "dashed")}
        >
          Dashed
        </Button>
        <Button
          pressed={settings.emptySlotBorderStyle === "solid"}
          onClick={() => onUpdate("emptySlotBorderStyle", "solid")}
        >
          Solid
        </Button>
      </ButtonGroup>

      {/* Free Gift Badge — image upload + position picker */}
      <Divider />

      <Text as="h3" variant="headingMd">
        Free Gift Badge
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Shown on locked gift-step slot cards. Leave blank to use the built-in "Free" label.
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((pos) => (
          <button
            key={pos}
            onClick={() => onUpdate("freeGiftBadgePosition", pos)}
            style={{
              padding: "7px 10px",
              fontSize: "12px",
              fontWeight: (settings.freeGiftBadgePosition ?? "top-left") === pos ? 600 : 400,
              borderRadius: "6px",
              border: (settings.freeGiftBadgePosition ?? "top-left") === pos ? "2px solid #111" : "1px solid #D1D5DB",
              background: (settings.freeGiftBadgePosition ?? "top-left") === pos ? "#F3F4F6" : "#fff",
              cursor: "pointer",
              textAlign: "center" as const,
              transition: "border 0.1s, background 0.1s",
            }}
          >
            {pos === "top-left" ? "↖ Top Left" : pos === "top-right" ? "↗ Top Right" : pos === "bottom-left" ? "↙ Bottom Left" : "↘ Bottom Right"}
          </button>
        ))}
      </div>
    </BlockStack>
  );
}
