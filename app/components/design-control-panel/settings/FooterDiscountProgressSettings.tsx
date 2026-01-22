import { BlockStack, Text, Divider, Button, ButtonGroup, RangeSlider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import { VisibilityToggle } from "../common/VisibilityToggle";
import type { SettingsComponentProps } from "./types";

/**
 * Footer Discount & Progress Bar Settings Panel
 * Controls the discount text and progress bar in the footer
 */
export function FooterDiscountProgressSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Discount Text & Progress Bar
      </Text>
      <Divider />

      <VisibilityToggle
        label="Discount Text"
        value={settings.footerDiscountTextVisibility}
        onChange={(value) => onUpdate("footerDiscountTextVisibility", value)}
      />

      <Divider />

      <ColorPicker
        label="Progress Bar Filled Color"
        value={settings.footerProgressBarFilledColor}
        onChange={(value) => onUpdate("footerProgressBarFilledColor", value)}
      />

      <ColorPicker
        label="Progress Bar Empty Color"
        value={settings.footerProgressBarEmptyColor}
        onChange={(value) => onUpdate("footerProgressBarEmptyColor", value)}
      />

      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Success Message Styling
      </Text>

      <RangeSlider
        label="Font Size"
        value={settings.successMessageFontSize}
        onChange={(value) => onUpdate("successMessageFontSize", value as number)}
        min={10}
        max={24}
        output
        suffix={settings.successMessageFontSize ? `${settings.successMessageFontSize}px` : ""}
      />

      <BlockStack gap="200">
        <Text as="p" variant="bodySm">
          Font Weight
        </Text>
        <ButtonGroup variant="segmented">
          <Button
            pressed={settings.successMessageFontWeight === 400}
            onClick={() => onUpdate("successMessageFontWeight", 400)}
          >
            Normal
          </Button>
          <Button
            pressed={settings.successMessageFontWeight === 600}
            onClick={() => onUpdate("successMessageFontWeight", 600)}
          >
            Semi-Bold
          </Button>
          <Button
            pressed={settings.successMessageFontWeight === 700}
            onClick={() => onUpdate("successMessageFontWeight", 700)}
          >
            Bold
          </Button>
        </ButtonGroup>
      </BlockStack>

      <ColorPicker
        label="Text Color"
        value={settings.successMessageTextColor}
        onChange={(value) => onUpdate("successMessageTextColor", value)}
      />

      <ColorPicker
        label="Background Color"
        value={settings.successMessageBgColor}
        onChange={(value) => onUpdate("successMessageBgColor", value)}
      />
    </BlockStack>
  );
}
