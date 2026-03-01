import { BlockStack, Text, Divider, RangeSlider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Header Tabs Settings Panel
 * Controls the appearance of tabs in the bundle header
 */
export function HeaderTabsSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Tabs
      </Text>
      <Divider />

      <ColorPicker
        label="Tabs Active Background Color"
        value={settings.headerTabActiveBgColor}
        onChange={(value) => onUpdate("headerTabActiveBgColor", value)}
      />

      <ColorPicker
        label="Tabs Active Text Color"
        value={settings.headerTabActiveTextColor}
        onChange={(value) => onUpdate("headerTabActiveTextColor", value)}
      />

      <ColorPicker
        label="Tabs Inactive Background Color"
        value={settings.headerTabInactiveBgColor}
        onChange={(value) => onUpdate("headerTabInactiveBgColor", value)}
      />

      <ColorPicker
        label="Tabs Inactive Text Color"
        value={settings.headerTabInactiveTextColor}
        onChange={(value) => onUpdate("headerTabInactiveTextColor", value)}
      />

      <RangeSlider
        label="Border Radius"
        value={settings.headerTabRadius}
        onChange={(value) => onUpdate("headerTabRadius", value as number)}
        min={0}
        max={100}
        output
      />
    </BlockStack>
  );
}
