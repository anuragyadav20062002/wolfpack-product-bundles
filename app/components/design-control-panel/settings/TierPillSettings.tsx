import { BlockStack, Text, Divider, Button, ButtonGroup, RangeSlider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Tier Pill Settings Panel (Full-Page Bundles Only)
 * Controls the appearance of the Beco-style pricing tier pill bar.
 */
export function TierPillSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Pricing Tier Pills
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Full-page bundles only — shown when 2 or more pricing tiers are configured.
      </Text>
      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Active Pill
      </Text>

      <ColorPicker
        label="Active background"
        value={settings.tierPillActiveBgColor ?? settings.globalPrimaryButtonColor ?? "#111111"}
        onChange={(value) => onUpdate("tierPillActiveBgColor", value)}
      />

      <ColorPicker
        label="Active text"
        value={settings.tierPillActiveTextColor ?? "#FFFFFF"}
        onChange={(value) => onUpdate("tierPillActiveTextColor", value)}
      />

      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Inactive Pill
      </Text>

      <ColorPicker
        label="Inactive background"
        value={settings.tierPillInactiveBgColor ?? "#F2FAE6"}
        onChange={(value) => onUpdate("tierPillInactiveBgColor", value)}
      />

      <ColorPicker
        label="Inactive text"
        value={settings.tierPillInactiveTextColor ?? "#333333"}
        onChange={(value) => onUpdate("tierPillInactiveTextColor", value)}
      />

      <ColorPicker
        label="Hover background"
        value={settings.tierPillHoverBgColor ?? "#DCF5D2"}
        onChange={(value) => onUpdate("tierPillHoverBgColor", value)}
      />

      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Border & Shape
      </Text>

      <ColorPicker
        label="Border color"
        value={settings.tierPillBorderColor ?? "#000000"}
        onChange={(value) => onUpdate("tierPillBorderColor", value)}
      />

      <RangeSlider
        label="Border radius"
        value={settings.tierPillBorderRadius ?? 8}
        onChange={(value) => onUpdate("tierPillBorderRadius", value as number)}
        min={0}
        max={50}
        output
        suffix={`${settings.tierPillBorderRadius ?? 8}px`}
      />

      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Size & Spacing
      </Text>

      <RangeSlider
        label="Pill height"
        value={settings.tierPillHeight ?? 52}
        onChange={(value) => onUpdate("tierPillHeight", value as number)}
        min={32}
        max={80}
        output
        suffix={`${settings.tierPillHeight ?? 52}px`}
      />

      <RangeSlider
        label="Gap between pills"
        value={settings.tierPillGap ?? 12}
        onChange={(value) => onUpdate("tierPillGap", value as number)}
        min={4}
        max={32}
        output
        suffix={`${settings.tierPillGap ?? 12}px`}
      />

      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Typography
      </Text>

      <RangeSlider
        label="Font size"
        value={settings.tierPillFontSize ?? 14}
        onChange={(value) => onUpdate("tierPillFontSize", value as number)}
        min={12}
        max={24}
        output
        suffix={`${settings.tierPillFontSize ?? 14}px`}
      />

      <BlockStack gap="200">
        <Text as="p" variant="bodySm">
          Font weight
        </Text>
        <ButtonGroup variant="segmented">
          <Button
            pressed={settings.tierPillFontWeight === 400}
            onClick={() => onUpdate("tierPillFontWeight", 400)}
          >
            Normal
          </Button>
          <Button
            pressed={(settings.tierPillFontWeight ?? 600) === 600}
            onClick={() => onUpdate("tierPillFontWeight", 600)}
          >
            Semi-Bold
          </Button>
          <Button
            pressed={settings.tierPillFontWeight === 700}
            onClick={() => onUpdate("tierPillFontWeight", 700)}
          >
            Bold
          </Button>
        </ButtonGroup>
      </BlockStack>
    </BlockStack>
  );
}
