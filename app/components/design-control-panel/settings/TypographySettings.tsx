import { BlockStack, Text, Divider, Button, ButtonGroup, RangeSlider } from "@shopify/polaris";
import type { SettingsComponentProps } from "./types";

/**
 * Typography Settings Panel
 * Controls button text-transform and letter-spacing for the bundle widget.
 */
export function TypographySettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Typography
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Fine-tune text styling across buttons in the bundle widget.
      </Text>
      <Divider />

      <BlockStack gap="200">
        <Text as="p" variant="bodyMd" fontWeight="medium">
          Button Text Transform
        </Text>
        <ButtonGroup variant="segmented">
          <Button
            pressed={settings.buttonTextTransform === "none"}
            onClick={() => onUpdate("buttonTextTransform", "none")}
          >
            None
          </Button>
          <Button
            pressed={settings.buttonTextTransform === "uppercase"}
            onClick={() => onUpdate("buttonTextTransform", "uppercase")}
          >
            UPPER
          </Button>
          <Button
            pressed={settings.buttonTextTransform === "capitalize"}
            onClick={() => onUpdate("buttonTextTransform", "capitalize")}
          >
            Capitalize
          </Button>
        </ButtonGroup>
      </BlockStack>

      <RangeSlider
        label="Button Letter Spacing"
        helpText="0 = default, 5 = 0.05em, 10 = 0.10em"
        value={settings.buttonLetterSpacing}
        onChange={(value) => onUpdate("buttonLetterSpacing", value as number)}
        min={0}
        max={20}
        step={1}
        output
      />
    </BlockStack>
  );
}
