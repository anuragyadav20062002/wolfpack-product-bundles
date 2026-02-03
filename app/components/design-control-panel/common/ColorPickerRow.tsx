import { BlockStack, InlineStack, Text, Divider } from "@shopify/polaris";
import { ColorPicker } from "./ColorPicker";

interface ColorPickerRowProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  showDivider?: boolean;
}

/**
 * ColorPickerRow - A standardized row layout for color picker settings.
 * Displays a label, optional description, and color picker in a consistent layout.
 */
export function ColorPickerRow({
  label,
  description,
  value,
  onChange,
  showDivider = true,
}: ColorPickerRowProps) {
  return (
    <>
      <InlineStack gap="300" align="space-between" blockAlign="start">
        <BlockStack gap="100" inlineAlign="start">
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            {label}
          </Text>
          {description && (
            <Text as="p" variant="bodySm" tone="subdued">
              {description}
            </Text>
          )}
        </BlockStack>
        <ColorPicker label="" value={value} onChange={onChange} />
      </InlineStack>
      {showDivider && <Divider />}
    </>
  );
}
