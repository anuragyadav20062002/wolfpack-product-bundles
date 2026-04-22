import { BlockStack, Text, Divider, RangeSlider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Footer Settings Panel
 * Controls the basic footer appearance (background, border radius, padding)
 */
export function FooterSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Footer
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Shared footer settings apply to both floating and sidebar layouts. Sidebar card settings control only the full-page sidebar layout.
      </Text>
      <Divider />

      <ColorPicker
        label="Background Color"
        value={settings.footerBgColor}
        onChange={(value) => onUpdate("footerBgColor", value)}
      />

      <ColorPicker
        label="Total Pill Background Color"
        value={settings.footerTotalBgColor}
        onChange={(value) => onUpdate("footerTotalBgColor", value)}
      />

      <RangeSlider
        label="Border Radius"
        value={settings.footerBorderRadius}
        onChange={(value) => onUpdate("footerBorderRadius", value as number)}
        min={0}
        max={24}
        output
      />

      <RangeSlider
        label="Padding"
        value={settings.footerPadding}
        onChange={(value) => onUpdate("footerPadding", value as number)}
        min={8}
        max={32}
        output
      />

      <Divider />
      <Text as="h3" variant="headingSm">
        Sidebar card
      </Text>

      <ColorPicker
        label="Card Background"
        value={settings.sidebarCardBgColor}
        onChange={(value) => onUpdate("sidebarCardBgColor", value)}
      />

      <ColorPicker
        label="Card Text"
        value={settings.sidebarCardTextColor}
        onChange={(value) => onUpdate("sidebarCardTextColor", value)}
      />

      <ColorPicker
        label="Card Border"
        value={settings.sidebarCardBorderColor}
        onChange={(value) => onUpdate("sidebarCardBorderColor", value)}
      />

      <RangeSlider
        label="Card Border Width"
        value={settings.sidebarCardBorderWidth}
        onChange={(value) => onUpdate("sidebarCardBorderWidth", value as number)}
        min={0}
        max={6}
        output
      />

      <RangeSlider
        label="Card Border Radius"
        value={settings.sidebarCardBorderRadius}
        onChange={(value) => onUpdate("sidebarCardBorderRadius", value as number)}
        min={0}
        max={24}
        output
      />

      <RangeSlider
        label="Card Padding"
        value={settings.sidebarCardPadding}
        onChange={(value) => onUpdate("sidebarCardPadding", value as number)}
        min={12}
        max={36}
        output
      />

      <RangeSlider
        label="Card Width"
        value={settings.sidebarCardWidth}
        onChange={(value) => onUpdate("sidebarCardWidth", value as number)}
        min={300}
        max={460}
        output
      />

      <RangeSlider
        label="Sticky Offset"
        value={settings.sidebarStickyOffset}
        onChange={(value) => onUpdate("sidebarStickyOffset", value as number)}
        min={0}
        max={160}
        output
      />

      <RangeSlider
        label="Product List Max Height"
        value={settings.sidebarProductListMaxHeight}
        onChange={(value) => onUpdate("sidebarProductListMaxHeight", value as number)}
        min={180}
        max={520}
        output
      />

      <ColorPicker
        label="Discount Background"
        value={settings.sidebarDiscountBgColor}
        onChange={(value) => onUpdate("sidebarDiscountBgColor", value)}
      />

      <ColorPicker
        label="Discount Text"
        value={settings.sidebarDiscountTextColor}
        onChange={(value) => onUpdate("sidebarDiscountTextColor", value)}
      />

      <ColorPicker
        label="Sidebar Button Background"
        value={settings.sidebarButtonBgColor}
        onChange={(value) => onUpdate("sidebarButtonBgColor", value)}
      />

      <ColorPicker
        label="Sidebar Button Text"
        value={settings.sidebarButtonTextColor}
        onChange={(value) => onUpdate("sidebarButtonTextColor", value)}
      />

      <RangeSlider
        label="Sidebar Button Radius"
        value={settings.sidebarButtonBorderRadius}
        onChange={(value) => onUpdate("sidebarButtonBorderRadius", value as number)}
        min={0}
        max={40}
        output
      />
    </BlockStack>
  );
}
