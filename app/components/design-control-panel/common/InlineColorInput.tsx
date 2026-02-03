import { BlockStack, InlineStack, Text } from "@shopify/polaris";

interface InlineColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  id: string;
}

/**
 * InlineColorInput - A compact inline color input with a 41x41 color circle.
 * Used in settings panels where multiple color inputs are stacked vertically.
 * Features:
 * - Circular color swatch (41x41px)
 * - Hidden native color input
 * - Label and hex value display
 */
export function InlineColorInput({
  label,
  value,
  onChange,
  id,
}: InlineColorInputProps) {
  const handleClick = () => {
    const input = document.getElementById(id);
    if (input) input.click();
  };

  return (
    <BlockStack gap="300">
      <InlineStack gap="300" align="start" blockAlign="center">
        <div
          style={{
            width: "41px",
            height: "41px",
            borderRadius: "50%",
            backgroundColor: value,
            border: "1px solid #E3E3E3",
            cursor: "pointer",
            position: "relative",
          }}
          onClick={handleClick}
        >
          <input
            id={id}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: "absolute",
              opacity: 0,
              width: "100%",
              height: "100%",
              cursor: "pointer",
            }}
          />
        </div>
        <BlockStack gap="100">
          <Text as="p" variant="bodyMd" fontWeight="medium">
            {label}
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            {value}
          </Text>
        </BlockStack>
      </InlineStack>
    </BlockStack>
  );
}
