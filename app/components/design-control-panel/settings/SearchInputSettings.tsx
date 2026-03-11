import { BlockStack, Text, Divider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Search Input Settings Panel
 * Controls the appearance of the search input in full-page bundle widgets.
 */
export function SearchInputSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Search Input
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Styles the search bar used to filter products within a bundle step (full-page widget only).
      </Text>
      <Divider />

      <ColorPicker
        label="Background Color"
        value={settings.searchInputBgColor}
        onChange={(value) => onUpdate("searchInputBgColor", value)}
      />

      <ColorPicker
        label="Border Color"
        value={settings.searchInputBorderColor}
        onChange={(value) => onUpdate("searchInputBorderColor", value)}
      />

      <ColorPicker
        label="Focus Border Color"
        value={settings.searchInputFocusBorderColor}
        onChange={(value) => onUpdate("searchInputFocusBorderColor", value)}
      />

      <Divider />

      <ColorPicker
        label="Text Color"
        value={settings.searchInputTextColor}
        onChange={(value) => onUpdate("searchInputTextColor", value)}
      />

      <ColorPicker
        label="Placeholder Color"
        value={settings.searchInputPlaceholderColor}
        onChange={(value) => onUpdate("searchInputPlaceholderColor", value)}
      />

      <Divider />

      <ColorPicker
        label="Clear Button Background"
        value={settings.searchClearButtonBgColor}
        onChange={(value) => onUpdate("searchClearButtonBgColor", value)}
      />

      <ColorPicker
        label="Clear Button Icon Color"
        value={settings.searchClearButtonColor}
        onChange={(value) => onUpdate("searchClearButtonColor", value)}
      />
    </BlockStack>
  );
}
