import { BlockStack, Text, Divider, RangeSlider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import { VisibilityToggle } from "../common/VisibilityToggle";
import type { SettingsComponentProps } from "./types";

/**
 * Product Card Typography Settings Panel
 * Controls typography and price display settings for product cards
 */
export function ProductCardTypographySettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Product Card Typography
      </Text>
      <Divider />

      <VisibilityToggle
        label="Product Title"
        value={settings.productTitleVisibility}
        onChange={(value) => onUpdate("productTitleVisibility", value)}
      />

      <ColorPicker
        label="Product Font Color"
        value={settings.productCardFontColor}
        onChange={(value) => onUpdate("productCardFontColor", value)}
      />

      <RangeSlider
        label="Product Name Font Size"
        value={settings.productCardFontSize}
        onChange={(value) => onUpdate("productCardFontSize", value as number)}
        min={12}
        max={24}
        output
      />

      <RangeSlider
        label="Product Name Font Weight"
        value={settings.productCardFontWeight}
        onChange={(value) => onUpdate("productCardFontWeight", value as number)}
        min={300}
        max={900}
        step={100}
        output
      />

      <VisibilityToggle
        label="Product Price Visibility"
        value={settings.productPriceVisibility}
        onChange={(value) => onUpdate("productPriceVisibility", value)}
      />

      {settings.productPriceVisibility && (
        <>
          <ColorPicker
            label="Price Section Background Color"
            value={settings.productPriceBgColor}
            onChange={(value) => onUpdate("productPriceBgColor", value)}
          />

          <ColorPicker
            label="Strikethrough Price Color"
            value={settings.productStrikePriceColor}
            onChange={(value) => onUpdate("productStrikePriceColor", value)}
          />

          <RangeSlider
            label="Strikethrough Font Size"
            value={settings.productStrikeFontSize}
            onChange={(value) => onUpdate("productStrikeFontSize", value as number)}
            min={10}
            max={20}
            output
          />

          <RangeSlider
            label="Strikethrough Font Weight"
            value={settings.productStrikeFontWeight}
            onChange={(value) => onUpdate("productStrikeFontWeight", value as number)}
            min={300}
            max={700}
            step={100}
            output
          />

          <ColorPicker
            label="Final Price Font Color"
            value={settings.productFinalPriceColor}
            onChange={(value) => onUpdate("productFinalPriceColor", value)}
          />

          <RangeSlider
            label="Final Price Font Size"
            value={settings.productFinalPriceFontSize}
            onChange={(value) => onUpdate("productFinalPriceFontSize", value as number)}
            min={14}
            max={28}
            output
          />

          <RangeSlider
            label="Final Price Font Weight"
            value={settings.productFinalPriceFontWeight}
            onChange={(value) => onUpdate("productFinalPriceFontWeight", value as number)}
            min={400}
            max={900}
            step={100}
            output
          />
        </>
      )}
    </BlockStack>
  );
}
