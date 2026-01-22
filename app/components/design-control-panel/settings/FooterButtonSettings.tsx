import { BlockStack, Text, Divider, RangeSlider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Footer Button Settings Panel
 * Controls the appearance of Back and Next buttons in the footer
 */
export function FooterButtonSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Button
      </Text>
      <Divider />

      <Text as="h3" variant="headingSm">
        Back Button
      </Text>

      <ColorPicker
        label="Back Button Color"
        value={settings.footerBackButtonBgColor}
        onChange={(value) => onUpdate("footerBackButtonBgColor", value)}
      />

      <ColorPicker
        label="Back Button Text Color"
        value={settings.footerBackButtonTextColor}
        onChange={(value) => onUpdate("footerBackButtonTextColor", value)}
      />

      <Divider />

      <Text as="h3" variant="headingSm">
        Next Button
      </Text>

      <ColorPicker
        label="Next Button Color"
        value={settings.footerNextButtonBgColor}
        onChange={(value) => onUpdate("footerNextButtonBgColor", value)}
      />

      <ColorPicker
        label="Next Button Text Color"
        value={settings.footerNextButtonTextColor}
        onChange={(value) => onUpdate("footerNextButtonTextColor", value)}
      />

      <Divider />

      <Text as="h3" variant="headingSm">
        Common
      </Text>

      <RangeSlider
        label="Button Border Radius"
        value={settings.footerBackButtonBorderRadius}
        onChange={(value) => {
          onUpdate("footerBackButtonBorderRadius", value as number);
          onUpdate("footerNextButtonBorderRadius", value as number);
        }}
        min={0}
        max={67}
        output
      />
    </BlockStack>
  );
}
