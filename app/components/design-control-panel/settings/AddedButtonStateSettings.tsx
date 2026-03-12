import { BlockStack, Text, Divider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Added Button State Settings Panel
 * Controls the button appearance after a product has been added to the bundle
 */
export function AddedButtonStateSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Added State
      </Text>
      <Divider />

      <Text as="p" variant="bodySm" tone="subdued">
        Button appearance after a product has been added to the bundle
      </Text>

      <ColorPicker
        label="Background Color"
        value={settings.buttonAddedBgColor}
        onChange={(value) => onUpdate("buttonAddedBgColor", value)}
      />

      <ColorPicker
        label="Text Color"
        value={settings.buttonAddedTextColor}
        onChange={(value) => onUpdate("buttonAddedTextColor", value)}
      />
    </BlockStack>
  );
}
