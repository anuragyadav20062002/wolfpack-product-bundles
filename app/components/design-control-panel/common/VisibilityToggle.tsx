import { BlockStack, Text, Button, ButtonGroup } from "@shopify/polaris";

interface VisibilityToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  showLabel?: string;
  hideLabel?: string;
}

/**
 * VisibilityToggle - A standardized Show/Hide toggle component.
 * Used for visibility controls throughout the settings panel.
 */
export function VisibilityToggle({
  label,
  value,
  onChange,
  showLabel = "Show",
  hideLabel = "Hide",
}: VisibilityToggleProps) {
  return (
    <BlockStack gap="200">
      <Text as="p" variant="bodyMd" fontWeight="medium">
        {label}
      </Text>
      <ButtonGroup variant="segmented">
        <Button pressed={value === true} onClick={() => onChange(true)}>
          {showLabel}
        </Button>
        <Button pressed={value === false} onClick={() => onChange(false)}>
          {hideLabel}
        </Button>
      </ButtonGroup>
    </BlockStack>
  );
}
