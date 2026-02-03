import { BlockStack, Text, Divider } from "@shopify/polaris";
import { InlineColorInput } from "../common/InlineColorInput";
import type { SettingsComponentProps } from "./types";

/**
 * Toasts Settings Panel
 * Controls the appearance of toast notifications
 */
export function ToastsSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Toasts
      </Text>
      <Divider />

      <InlineColorInput
        id="toastBgColorInput"
        label="Background Color"
        value={settings.toastBgColor}
        onChange={(value) => onUpdate("toastBgColor", value)}
      />

      <InlineColorInput
        id="toastTextColorInput"
        label="Text Color"
        value={settings.toastTextColor}
        onChange={(value) => onUpdate("toastTextColor", value)}
      />
    </BlockStack>
  );
}
