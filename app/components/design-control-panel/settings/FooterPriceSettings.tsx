import { BlockStack, Text, Divider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import { VisibilityToggle } from "../common/VisibilityToggle";
import type { SettingsComponentProps } from "./types";

/**
 * Footer Price Settings Panel
 * Controls the price display in the footer section
 */
export function FooterPriceSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Price
      </Text>
      <Divider />

      <VisibilityToggle
        label="Visibility"
        value={settings.footerPriceVisibility}
        onChange={(value) => onUpdate("footerPriceVisibility", value)}
      />

      {settings.footerPriceVisibility && (
        <>
          <ColorPicker
            label="Final Price Font Color"
            value={settings.footerFinalPriceColor}
            onChange={(value) => onUpdate("footerFinalPriceColor", value)}
          />

          <ColorPicker
            label="Strikethrough Price Color"
            value={settings.footerStrikePriceColor}
            onChange={(value) => onUpdate("footerStrikePriceColor", value)}
          />
        </>
      )}
    </BlockStack>
  );
}
