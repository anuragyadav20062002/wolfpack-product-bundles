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

      {/* Free Gift Badge — visible in all widget style modes */}
      <Divider />

      <Text as="h3" variant="headingMd">
        Free Gift Badge
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Shown on locked gift-step slot cards. Leave blank to use the built-in ribbon.
      </Text>
      <FilePicker
        value={settings.freeGiftBadgeUrl ?? ""}
        onChange={(url) => onUpdate("freeGiftBadgeUrl", url ?? "")}
        label="Free Gift Badge"
        hideCropEditor
      />
    </BlockStack>
  );
}
