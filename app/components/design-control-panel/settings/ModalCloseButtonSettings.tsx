import { BlockStack, Text, Divider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Modal Close Button Settings Panel
 * Controls the × close button that dismisses the variant selector modal.
 */
export function ModalCloseButtonSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Modal Close Button
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Styles the × button in the top-right corner of the variant selector modal.
      </Text>
      <Divider />

      <ColorPicker
        label="Icon Color"
        value={settings.modalCloseButtonColor}
        onChange={(value) => onUpdate("modalCloseButtonColor", value)}
      />

      <ColorPicker
        label="Background Color"
        value={settings.modalCloseButtonBgColor}
        onChange={(value) => onUpdate("modalCloseButtonBgColor", value)}
      />

      <ColorPicker
        label="Hover Icon Color"
        value={settings.modalCloseButtonHoverColor}
        onChange={(value) => onUpdate("modalCloseButtonHoverColor", value)}
      />
    </BlockStack>
  );
}
