import { BlockStack, Text, Divider, TextField } from "@shopify/polaris";
import { InlineColorInput } from "../common/InlineColorInput";
import type { SettingsComponentProps } from "./types";

/**
 * Add to Cart Button Settings Panel
 * Controls the appearance and text of the Add to Cart button
 */
export function AddToCartButtonSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Checkout Button
      </Text>
      <Divider />

      <InlineColorInput
        id="addToCartButtonBgColorInput"
        label="Background Color"
        value={settings.addToCartButtonBgColor}
        onChange={(value) => onUpdate("addToCartButtonBgColor", value)}
      />

      <InlineColorInput
        id="addToCartButtonTextColorInput"
        label="Text Color"
        value={settings.addToCartButtonTextColor}
        onChange={(value) => onUpdate("addToCartButtonTextColor", value)}
      />

      <BlockStack gap="200">
        <TextField
          label="Button Corner Radius"
          type="number"
          value={String(settings.addToCartButtonBorderRadius)}
          onChange={(value) => onUpdate("addToCartButtonBorderRadius", Number(value))}
          autoComplete="off"
          suffix="px"
        />
      </BlockStack>

      <BlockStack gap="200">
        <TextField
          label="Button Text"
          value={settings.buttonAddToCartText}
          onChange={(value) => onUpdate("buttonAddToCartText", value)}
          autoComplete="off"
          placeholder="Add to Cart"
        />
      </BlockStack>
    </BlockStack>
  );
}
