import { BlockStack, Text, Divider } from "@shopify/polaris";
import { InlineColorInput } from "../common/InlineColorInput";
import type { SettingsComponentProps } from "./types";

/**
 * Step Bar Progress Bar Settings Panel
 * Controls the appearance of the progress bar connecting steps
 */
export function StepBarProgressBarSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Progress Bar
      </Text>
      <Divider />

      <InlineColorInput
        id="stepBarProgressFilledColorInput"
        label="Progress Bar Filled Color"
        value={settings.stepBarProgressFilledColor}
        onChange={(value) => onUpdate("stepBarProgressFilledColor", value)}
      />

      <InlineColorInput
        id="stepBarProgressEmptyColorInput"
        label="Progress Bar Empty Color"
        value={settings.stepBarProgressEmptyColor}
        onChange={(value) => onUpdate("stepBarProgressEmptyColor", value)}
      />
    </BlockStack>
  );
}
