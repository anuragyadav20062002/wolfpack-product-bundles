import { BlockStack, Text, Divider, RangeSlider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Accessibility Settings Panel
 * Controls focus outlines for keyboard navigation within the bundle widget.
 */
export function AccessibilitySettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Accessibility
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Configure focus indicator styles for keyboard and assistive technology users.
        These outlines appear when navigating the bundle with Tab / keyboard shortcuts.
      </Text>
      <Divider />

      <ColorPicker
        label="Focus Outline Color"
        value={settings.focusOutlineColor}
        onChange={(value) => onUpdate("focusOutlineColor", value)}
      />

      <RangeSlider
        label="Focus Outline Width"
        value={settings.focusOutlineWidth}
        onChange={(value) => onUpdate("focusOutlineWidth", value as number)}
        min={1}
        max={4}
        step={1}
        output
        suffix={`${settings.focusOutlineWidth}px`}
      />
    </BlockStack>
  );
}
