import { BlockStack, Text, Divider, RangeSlider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Footer Settings Panel
 * Controls the basic footer appearance (background, border radius, padding)
 */
export function FooterSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Footer
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        These settings apply to both the sidebar panel and the floating footer — switching layouts will reflect the same values.
      </Text>
      <Divider />

      <ColorPicker
        label="Background Color"
        value={settings.footerBgColor}
        onChange={(value) => onUpdate("footerBgColor", value)}
      />

      <ColorPicker
        label="Total Pill Background Color"
        value={settings.footerTotalBgColor}
        onChange={(value) => onUpdate("footerTotalBgColor", value)}
      />

      <RangeSlider
        label="Border Radius"
        value={settings.footerBorderRadius}
        onChange={(value) => onUpdate("footerBorderRadius", value as number)}
        min={0}
        max={24}
        output
      />

      <RangeSlider
        label="Padding"
        value={settings.footerPadding}
        onChange={(value) => onUpdate("footerPadding", value as number)}
        min={8}
        max={32}
        output
      />
    </BlockStack>
  );
}
