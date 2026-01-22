import { BlockStack, Text, Divider, Button, ButtonGroup } from "@shopify/polaris";
import { InlineColorInput } from "../common/InlineColorInput";
import type { SettingsComponentProps } from "./types";

/**
 * Empty State Settings Panel
 * Controls the appearance of empty state cards
 */
export function EmptyStateSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Empty State
      </Text>
      <Divider />

      <InlineColorInput
        id="emptyStateCardBgColorInput"
        label="Card Background Color"
        value={settings.emptyStateCardBgColor}
        onChange={(value) => onUpdate("emptyStateCardBgColor", value)}
      />

      <InlineColorInput
        id="emptyStateCardBorderColorInput"
        label="Card Border Color"
        value={settings.emptyStateCardBorderColor}
        onChange={(value) => onUpdate("emptyStateCardBorderColor", value)}
      />

      <InlineColorInput
        id="emptyStateTextColorInput"
        label="Text Color"
        value={settings.emptyStateTextColor}
        onChange={(value) => onUpdate("emptyStateTextColor", value)}
      />

      <BlockStack gap="200">
        <Text as="p" variant="bodyMd" fontWeight="medium">
          Border Style
        </Text>
        <ButtonGroup variant="segmented">
          <Button
            pressed={settings.emptyStateBorderStyle === "solid"}
            onClick={() => onUpdate("emptyStateBorderStyle", "solid")}
          >
            Solid
          </Button>
          <Button
            pressed={settings.emptyStateBorderStyle === "dashed"}
            onClick={() => onUpdate("emptyStateBorderStyle", "dashed")}
          >
            Dashed
          </Button>
        </ButtonGroup>
      </BlockStack>
    </BlockStack>
  );
}
