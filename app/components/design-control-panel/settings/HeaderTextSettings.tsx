import { BlockStack, Text, Divider, RangeSlider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Header Text Settings Panel
 * Controls the text styling in the bundle header
 */
export function HeaderTextSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Header Text
      </Text>
      <Divider />

      <ColorPicker
        label="Conditions Text Color"
        value={settings.conditionsTextColor}
        onChange={(value) => onUpdate("conditionsTextColor", value)}
      />

      <RangeSlider
        label="Conditions Text Font Size"
        value={settings.conditionsTextFontSize}
        onChange={(value) => onUpdate("conditionsTextFontSize", value as number)}
        min={12}
        max={32}
        output
      />

      <ColorPicker
        label="Discount Text Color"
        value={settings.discountTextColor}
        onChange={(value) => onUpdate("discountTextColor", value)}
      />

      <RangeSlider
        label="Discount Text Font Size"
        value={settings.discountTextFontSize}
        onChange={(value) => onUpdate("discountTextFontSize", value as number)}
        min={10}
        max={24}
        output
      />
    </BlockStack>
  );
}
