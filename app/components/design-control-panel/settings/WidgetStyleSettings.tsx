import { BlockStack, Text, Divider, Button, ButtonGroup, RangeSlider, TextField } from "@shopify/polaris";
import { InlineColorInput } from "../common/InlineColorInput";
import type { SettingsComponentProps } from "./types";

/**
 * Widget Style Settings
 *
 * Controls whether the product-page bundle widget uses the classic
 * vertical-accordion layout or the new bottom-sheet modal UX.
 * All bottom-sheet sub-controls are shown only when bottom-sheet is selected.
 */
export function WidgetStyleSettings({ settings, onUpdate }: SettingsComponentProps) {
  const widgetStyle = settings.widgetStyle ?? "classic";
  const isBottomSheet = widgetStyle === "bottom-sheet";

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Widget Style
      </Text>
      <Divider />

      {/* Style toggle */}
      <BlockStack gap="200">
        <Text as="p" variant="bodyMd" fontWeight="medium">
          Layout Mode
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          &ldquo;Bottom Sheet&rdquo; opens a slide-up panel when a shopper clicks a step — matches the Skai Lama / Beco BYOB UX pattern.
        </Text>
        <ButtonGroup variant="segmented">
          <Button
            pressed={widgetStyle === "classic"}
            onClick={() => onUpdate("widgetStyle", "classic")}
          >
            Classic (Accordion)
          </Button>
          <Button
            pressed={isBottomSheet}
            onClick={() => onUpdate("widgetStyle", "bottom-sheet")}
          >
            Bottom Sheet (New)
          </Button>
        </ButtonGroup>
      </BlockStack>

      {/* Bottom-sheet sub-controls (only shown when bottom-sheet selected) */}
      {isBottomSheet && (
        <>
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
            Empty Slot Card Border
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

          <InlineColorInput
            id="emptySlotBorderColorInput"
            label="Empty slot border color"
            value={settings.emptySlotBorderColor ?? settings.globalPrimaryButtonColor ?? "#007AFF"}
            onChange={(val) => onUpdate("emptySlotBorderColor", val)}
          />

          <Divider />

          <Text as="p" variant="bodyMd" fontWeight="medium">
            Free Gift Badge Image
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Upload a PNG or SVG to replace the default red gift ribbon on free-gift slots. Leave blank to use the built-in ribbon.
          </Text>
          <TextField
            label="Badge image URL"
            labelHidden
            placeholder="https://cdn.shopify.com/…/badge.png"
            value={settings.freeGiftBadgeUrl ?? ""}
            onChange={(val) => onUpdate("freeGiftBadgeUrl", val)}
            autoComplete="off"
          />
        </>
      )}
    </BlockStack>
  );
}
