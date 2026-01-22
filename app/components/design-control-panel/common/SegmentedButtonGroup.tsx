import { BlockStack, Text, Button, ButtonGroup } from "@shopify/polaris";

interface SegmentedButtonOption<T> {
  label: string;
  value: T;
}

interface SegmentedButtonGroupProps<T> {
  label: string;
  options: SegmentedButtonOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * SegmentedButtonGroup - A labeled button group with segmented variant.
 * Used for mutually exclusive options like visibility toggles, style choices, etc.
 */
export function SegmentedButtonGroup<T>({
  label,
  options,
  value,
  onChange,
}: SegmentedButtonGroupProps<T>) {
  return (
    <BlockStack gap="200">
      <Text as="p" variant="bodyMd" fontWeight="medium">
        {label}
      </Text>
      <ButtonGroup variant="segmented">
        {options.map((option) => (
          <Button
            key={String(option.value)}
            pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </ButtonGroup>
    </BlockStack>
  );
}
