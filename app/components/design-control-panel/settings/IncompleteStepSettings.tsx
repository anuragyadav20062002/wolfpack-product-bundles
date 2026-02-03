import { BlockStack, Text, Divider, RangeSlider } from "@shopify/polaris";
import { InlineColorInput } from "../common/InlineColorInput";
import type { SettingsComponentProps } from "./types";

/**
 * Incomplete Step Settings Panel
 * Controls the appearance of incomplete steps in the step bar
 */
export function IncompleteStepSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Incomplete Step
      </Text>
      <Divider />

      <InlineColorInput
        id="incompleteStepBgColorInput"
        label="Incomplete Step Background Color"
        value={settings.incompleteStepBgColor}
        onChange={(value) => onUpdate("incompleteStepBgColor", value)}
      />

      <InlineColorInput
        id="incompleteStepCircleStrokeColorInput"
        label="Circle Stroke Color"
        value={settings.incompleteStepCircleStrokeColor}
        onChange={(value) => onUpdate("incompleteStepCircleStrokeColor", value)}
      />

      <RangeSlider
        label="Border Radius"
        value={settings.incompleteStepCircleStrokeRadius}
        onChange={(value) => onUpdate("incompleteStepCircleStrokeRadius", value as number)}
        min={0}
        max={50}
        output
      />
    </BlockStack>
  );
}
