import { BlockStack, Text, Divider, Button, ButtonGroup, RangeSlider } from "@shopify/polaris";
import { InlineColorInput } from "../common/InlineColorInput";
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

      <Text as="h3" variant="headingMd">
        Widget Container
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Background color of the widget container on the product page. Leave empty (or reset to defaults) to keep it transparent so it blends with your theme.
      </Text>
      <InlineColorInput
        id="bundleBgColorInput"
        label="Container Background Color"
        value={settings.bundleBgColor || "#FFFFFF"}
        onChange={(value) => onUpdate("bundleBgColor", value)}
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

      <Divider />

      <Text as="h3" variant="headingMd">
        Empty State Cards
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Appearance of empty selection slots shown in the bundle picker before products are chosen.
      </Text>

      <InlineColorInput
        id="emptyStateCardBgColorInput"
        label="Card Background Color"
        value={settings.emptyStateCardBgColor}
        onChange={(value) => onUpdate("emptyStateCardBgColor", value)}
      />

      <InlineColorInput
        id="emptyStateCardBorderColorInput"
        label="Card Border Color"
        value={settings.emptyStateCardBorderColor}
        onChange={(value) => onUpdate("emptyStateCardBorderColor", value)}
      />

      <InlineColorInput
        id="emptyStateTextColorInput"
        label="Text Color"
        value={settings.emptyStateTextColor}
        onChange={(value) => onUpdate("emptyStateTextColor", value)}
      />

      <BlockStack gap="200">
        <Text as="p" variant="bodyMd" fontWeight="medium">
          Card Border Style
        </Text>
        <ButtonGroup variant="segmented">
          <Button
            pressed={settings.emptyStateBorderStyle === "solid"}
            onClick={() => onUpdate("emptyStateBorderStyle", "solid")}
          >
            Solid
          </Button>
          <Button
            pressed={(settings.emptyStateBorderStyle ?? "dashed") === "dashed"}
            onClick={() => onUpdate("emptyStateBorderStyle", "dashed")}
          >
            Dashed
          </Button>
        </ButtonGroup>
      </BlockStack>

    </BlockStack>
  );
}
