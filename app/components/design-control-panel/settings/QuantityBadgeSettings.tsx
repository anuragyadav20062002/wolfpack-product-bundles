import { BlockStack, Text, Divider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Quantity Badge Settings Panel
 * Controls the small badge shown on footer product tiles indicating quantity selected.
 */
export function QuantityBadgeSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Quantity Badge
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        The small circular badge overlaid on each product tile in the bundle footer,
        showing how many of that item has been selected.
      </Text>
      <Divider />

      <ColorPicker
        label="Badge Background Color"
        value={settings.tileQuantityBadgeBgColor}
        onChange={(value) => onUpdate("tileQuantityBadgeBgColor", value)}
      />

      <ColorPicker
        label="Badge Text Color"
        value={settings.tileQuantityBadgeTextColor}
        onChange={(value) => onUpdate("tileQuantityBadgeTextColor", value)}
      />
    </BlockStack>
  );
}
