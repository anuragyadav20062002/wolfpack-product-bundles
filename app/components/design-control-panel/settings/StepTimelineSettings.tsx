import { BlockStack, Text, Divider, RangeSlider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Step Timeline Settings Panel
 * Controls the horizontal step progress indicator at the top of the FPB widget.
 */
export function StepTimelineSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Step Timeline
      </Text>
      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Circle
      </Text>

      <RangeSlider
        label="Circle Size"
        value={settings.stepTimelineCircleSize}
        onChange={(value) => onUpdate("stepTimelineCircleSize", value as number)}
        min={28}
        max={80}
        output
        suffix={`${settings.stepTimelineCircleSize}px`}
      />

      <ColorPicker
        label="Circle Background"
        value={settings.stepTimelineCircleBg}
        onChange={(value) => onUpdate("stepTimelineCircleBg", value)}
      />

      <ColorPicker
        label="Active Circle Border"
        value={settings.stepTimelineCircleBorder}
        onChange={(value) => onUpdate("stepTimelineCircleBorder", value)}
      />

      <RangeSlider
        label="Circle Border Width"
        value={settings.stepTimelineCircleBorderWidth}
        onChange={(value) => onUpdate("stepTimelineCircleBorderWidth", value as number)}
        min={1}
        max={6}
        output
        suffix={`${settings.stepTimelineCircleBorderWidth}px`}
      />

      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Step States
      </Text>

      <ColorPicker
        label="Active Step Color"
        value={settings.stepTimelineActiveColor}
        onChange={(value) => onUpdate("stepTimelineActiveColor", value)}
      />

      <ColorPicker
        label="Inactive Step Color"
        value={settings.stepTimelineInactiveColor}
        onChange={(value) => onUpdate("stepTimelineInactiveColor", value)}
      />

      <ColorPicker
        label="Completed Step Color"
        value={settings.stepTimelineCompleteColor}
        onChange={(value) => onUpdate("stepTimelineCompleteColor", value)}
      />

      <ColorPicker
        label="Completed Circle Background"
        value={settings.stepTimelineCompletedBg}
        onChange={(value) => onUpdate("stepTimelineCompletedBg", value)}
      />

      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Connector Line
      </Text>

      <ColorPicker
        label="Line Color (empty)"
        value={settings.stepTimelineLineColor}
        onChange={(value) => onUpdate("stepTimelineLineColor", value)}
      />

      <ColorPicker
        label="Line Color (filled/completed)"
        value={settings.stepTimelineLineCompleted}
        onChange={(value) => onUpdate("stepTimelineLineCompleted", value)}
      />

      <RangeSlider
        label="Line Thickness"
        value={settings.stepTimelineLineHeight}
        onChange={(value) => onUpdate("stepTimelineLineHeight", value as number)}
        min={1}
        max={8}
        output
        suffix={`${settings.stepTimelineLineHeight}px`}
      />

      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Step Labels
      </Text>

      <ColorPicker
        label="Label Color"
        value={settings.stepTimelineNameColor}
        onChange={(value) => onUpdate("stepTimelineNameColor", value)}
      />

      <RangeSlider
        label="Label Font Size"
        value={settings.stepTimelineNameFontSize}
        onChange={(value) => onUpdate("stepTimelineNameFontSize", value as number)}
        min={9}
        max={18}
        output
        suffix={`${settings.stepTimelineNameFontSize}px`}
      />
    </BlockStack>
  );
}
