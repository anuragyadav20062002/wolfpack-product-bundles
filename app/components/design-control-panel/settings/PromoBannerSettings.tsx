import { BlockStack, Text, Divider, Button, ButtonGroup, RangeSlider, Checkbox } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Promo Banner Settings Panel (Full-Page Bundles Only)
 * Controls the promotional banner appearance at the top of full-page bundles
 */
export function PromoBannerSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Promo Banner
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Full-page bundles only
      </Text>
      <Divider />

      <Checkbox
        label="Enable Promo Banner"
        checked={settings.promoBannerEnabled}
        onChange={(checked) => onUpdate("promoBannerEnabled", checked)}
        helpText="Show the promotional banner at the top of full-page bundle pages"
      />

      <Divider />

      <ColorPicker
        label="Background Color"
        value={settings.promoBannerBgColor}
        onChange={(value) => onUpdate("promoBannerBgColor", value)}
      />

      <RangeSlider
        label="Border Radius"
        value={settings.promoBannerBorderRadius}
        onChange={(value) => onUpdate("promoBannerBorderRadius", value as number)}
        min={0}
        max={32}
        output
        suffix={settings.promoBannerBorderRadius ? `${settings.promoBannerBorderRadius}px` : ""}
      />

      <RangeSlider
        label="Padding"
        value={settings.promoBannerPadding}
        onChange={(value) => onUpdate("promoBannerPadding", value as number)}
        min={12}
        max={64}
        output
        suffix={settings.promoBannerPadding ? `${settings.promoBannerPadding}px` : ""}
      />

      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Title Styling
      </Text>

      <ColorPicker
        label="Title Color"
        value={settings.promoBannerTitleColor}
        onChange={(value) => onUpdate("promoBannerTitleColor", value)}
      />

      <RangeSlider
        label="Title Font Size"
        value={settings.promoBannerTitleFontSize}
        onChange={(value) => onUpdate("promoBannerTitleFontSize", value as number)}
        min={16}
        max={48}
        output
        suffix={settings.promoBannerTitleFontSize ? `${settings.promoBannerTitleFontSize}px` : ""}
      />

      <BlockStack gap="200">
        <Text as="p" variant="bodySm">
          Title Font Weight
        </Text>
        <ButtonGroup variant="segmented">
          <Button
            pressed={settings.promoBannerTitleFontWeight === 400}
            onClick={() => onUpdate("promoBannerTitleFontWeight", 400)}
          >
            Normal
          </Button>
          <Button
            pressed={settings.promoBannerTitleFontWeight === 600}
            onClick={() => onUpdate("promoBannerTitleFontWeight", 600)}
          >
            Semi-Bold
          </Button>
          <Button
            pressed={settings.promoBannerTitleFontWeight === 700}
            onClick={() => onUpdate("promoBannerTitleFontWeight", 700)}
          >
            Bold
          </Button>
        </ButtonGroup>
      </BlockStack>

      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Subtitle Styling
      </Text>

      <ColorPicker
        label="Subtitle Color"
        value={settings.promoBannerSubtitleColor}
        onChange={(value) => onUpdate("promoBannerSubtitleColor", value)}
      />

      <RangeSlider
        label="Subtitle Font Size"
        value={settings.promoBannerSubtitleFontSize}
        onChange={(value) => onUpdate("promoBannerSubtitleFontSize", value as number)}
        min={10}
        max={24}
        output
        suffix={settings.promoBannerSubtitleFontSize ? `${settings.promoBannerSubtitleFontSize}px` : ""}
      />

      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Note Text Styling
      </Text>

      <ColorPicker
        label="Note Color"
        value={settings.promoBannerNoteColor}
        onChange={(value) => onUpdate("promoBannerNoteColor", value)}
      />

      <RangeSlider
        label="Note Font Size"
        value={settings.promoBannerNoteFontSize}
        onChange={(value) => onUpdate("promoBannerNoteFontSize", value as number)}
        min={10}
        max={20}
        output
        suffix={settings.promoBannerNoteFontSize ? `${settings.promoBannerNoteFontSize}px` : ""}
      />
    </BlockStack>
  );
}
