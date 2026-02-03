import { BlockStack, Text, Divider, RangeSlider } from "@shopify/polaris";
import { InlineColorInput } from "../common/InlineColorInput";
import type { SettingsComponentProps } from "./types";

/**
 * Step Bar Tabs Settings Panel
 * Controls the appearance of category tabs in the step bar area
 */
export function StepBarTabsSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Tabs
      </Text>
      <Divider />

      <InlineColorInput
        id="tabsActiveBgColorInput"
        label="Tabs Active Background Color"
        value={settings.tabsActiveBgColor}
        onChange={(value) => onUpdate("tabsActiveBgColor", value)}
      />

      <InlineColorInput
        id="tabsActiveTextColorInput"
        label="Tabs Active Text Color"
        value={settings.tabsActiveTextColor}
        onChange={(value) => onUpdate("tabsActiveTextColor", value)}
      />

      <InlineColorInput
        id="tabsInactiveBgColorInput"
        label="Tabs Inactive Background Color"
        value={settings.tabsInactiveBgColor}
        onChange={(value) => onUpdate("tabsInactiveBgColor", value)}
      />

      <InlineColorInput
        id="tabsInactiveTextColorInput"
        label="Tabs Inactive Text Color"
        value={settings.tabsInactiveTextColor}
        onChange={(value) => onUpdate("tabsInactiveTextColor", value)}
      />

      <InlineColorInput
        id="tabsBorderColorInput"
        label="Tabs Border Color"
        value={settings.tabsBorderColor}
        onChange={(value) => onUpdate("tabsBorderColor", value)}
      />

      <RangeSlider
        label="Border Radius"
        value={settings.tabsBorderRadius}
        onChange={(value) => onUpdate("tabsBorderRadius", value as number)}
        min={0}
        max={24}
        output
      />
    </BlockStack>
  );
}
