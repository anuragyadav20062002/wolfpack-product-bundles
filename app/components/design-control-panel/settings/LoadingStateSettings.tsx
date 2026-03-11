import { BlockStack, Text, Divider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Loading State Settings Panel
 * Controls the overlay shown while the widget initialises or fetches data.
 */
export function LoadingStateSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Loading State
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Styles the small loading indicator displayed while the bundle widget
        fetches product data. Keep the background and text colours consistent
        with your store theme.
      </Text>
      <Divider />

      <ColorPicker
        label="Overlay Background Color"
        value={settings.loadingOverlayBgColor}
        onChange={(value) => onUpdate("loadingOverlayBgColor", value)}
      />

      <ColorPicker
        label="Loading Text Color"
        value={settings.loadingOverlayTextColor}
        onChange={(value) => onUpdate("loadingOverlayTextColor", value)}
      />
    </BlockStack>
  );
}
