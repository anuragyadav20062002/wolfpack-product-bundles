import { BlockStack, Text, Divider, RangeSlider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Button Settings Panel
 * Controls the appearance of buttons on product cards
 */
export function ButtonSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Button
      </Text>
      <Divider />

      <ColorPicker
        label="Background Color"
        value={settings.buttonBgColor}
        onChange={(value) => onUpdate("buttonBgColor", value)}
      />

      <ColorPicker
        label="Text Color"
        value={settings.buttonTextColor}
        onChange={(value) => onUpdate("buttonTextColor", value)}
      />

      <RangeSlider
        label="Size"
        value={settings.buttonFontSize}
        onChange={(value) => onUpdate("buttonFontSize", value as number)}
        min={12}
        max={24}
        output
        suffix={`${settings.buttonFontSize}px`}
      />

      <RangeSlider
        label="Border Radius"
        value={settings.buttonBorderRadius}
        onChange={(value) => onUpdate("buttonBorderRadius", value as number)}
        min={0}
        max={24}
        output
        suffix={`${settings.buttonBorderRadius}px`}
      />
    </BlockStack>
  );
}
