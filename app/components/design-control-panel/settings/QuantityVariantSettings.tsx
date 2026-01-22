import { BlockStack, Text, Divider, RangeSlider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Quantity & Variant Selector Settings Panel
 * Controls the appearance of quantity and variant selectors
 */
export function QuantityVariantSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Quantity & Variant Selector
      </Text>
      <Divider />

      {/* Quantity Selector Section */}
      <BlockStack gap="400">
        <Text as="h3" variant="headingSm">
          Quantity Selector
        </Text>

        <ColorPicker
          label="Background Color"
          value={settings.quantitySelectorBgColor}
          onChange={(value) => onUpdate("quantitySelectorBgColor", value)}
        />

        <ColorPicker
          label="Text Color"
          value={settings.quantitySelectorTextColor}
          onChange={(value) => onUpdate("quantitySelectorTextColor", value)}
        />

        <RangeSlider
          label="Border Radius"
          value={settings.quantitySelectorBorderRadius}
          onChange={(value) => onUpdate("quantitySelectorBorderRadius", value as number)}
          min={0}
          max={67}
          output
          suffix="px"
        />
      </BlockStack>

      <Divider />

      {/* Variant Selector Section */}
      <BlockStack gap="400">
        <Text as="h3" variant="headingSm">
          Variant Selector
        </Text>

        <ColorPicker
          label="Background Color"
          value={settings.variantSelectorBgColor}
          onChange={(value) => onUpdate("variantSelectorBgColor", value)}
        />

        <ColorPicker
          label="Text Color"
          value={settings.variantSelectorTextColor}
          onChange={(value) => onUpdate("variantSelectorTextColor", value)}
        />

        <RangeSlider
          label="Border Radius"
          value={settings.variantSelectorBorderRadius}
          onChange={(value) => onUpdate("variantSelectorBorderRadius", value as number)}
          min={0}
          max={67}
          output
          suffix="px"
        />
      </BlockStack>
    </BlockStack>
  );
}
