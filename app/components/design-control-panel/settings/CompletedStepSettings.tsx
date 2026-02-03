import { BlockStack, Text, Divider, RangeSlider } from "@shopify/polaris";
import { InlineColorInput } from "../common/InlineColorInput";
import type { SettingsComponentProps } from "./types";

/**
 * Completed Step Settings Panel
 * Controls the appearance of completed steps in the step bar
 */
export function CompletedStepSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Completed Step
      </Text>
      <Divider />

      <InlineColorInput
        id="completedStepCheckMarkColorInput"
        label="Check Mark Color"
        value={settings.completedStepCheckMarkColor}
        onChange={(value) => onUpdate("completedStepCheckMarkColor", value)}
      />

      <InlineColorInput
        id="completedStepBgColorInput"
        label="Step Completed Background Color"
        value={settings.completedStepBgColor}
        onChange={(value) => onUpdate("completedStepBgColor", value)}
      />

      <InlineColorInput
        id="completedStepCircleBorderColorInput"
        label="Circle Border Color"
        value={settings.completedStepCircleBorderColor}
        onChange={(value) => onUpdate("completedStepCircleBorderColor", value)}
      />

      <RangeSlider
        label="Border Radius"
        value={settings.completedStepCircleBorderRadius}
        onChange={(value) => onUpdate("completedStepCircleBorderRadius", value as number)}
        min={0}
        max={50}
        output
      />
    </BlockStack>
  );
}
