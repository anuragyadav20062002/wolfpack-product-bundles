import { BlockStack, Text, Divider, Button, ButtonGroup, RangeSlider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Product Card Settings Panel
 * Controls the appearance of product cards in the bundle widget
 */
export function ProductCardSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Product Card
      </Text>
      <Divider />

      <ColorPicker
        label="Background Color"
        value={settings.productCardBgColor}
        onChange={(value) => onUpdate("productCardBgColor", value)}
      />

      <RangeSlider
        label="Font Size"
        value={settings.productCardFontSize}
        onChange={(value) => onUpdate("productCardFontSize", value as number)}
        min={12}
        max={24}
        output
      />

      <RangeSlider
        label="Font Weight"
        value={settings.productCardFontWeight}
        onChange={(value) => onUpdate("productCardFontWeight", value as number)}
        min={300}
        max={900}
        step={100}
        output
      />

      <BlockStack gap="200">
        <Text as="p" variant="bodyMd" fontWeight="medium">
          Product Image Fit
        </Text>
        <ButtonGroup variant="segmented">
          <Button
            pressed={settings.productCardImageFit === "cover"}
            onClick={() => onUpdate("productCardImageFit", "cover")}
          >
            Cover
          </Button>
          <Button
            pressed={settings.productCardImageFit === "fill"}
            onClick={() => onUpdate("productCardImageFit", "fill")}
          >
            Fill
          </Button>
          <Button
            pressed={settings.productCardImageFit === "contain"}
            onClick={() => onUpdate("productCardImageFit", "contain")}
          >
            Contain
          </Button>
        </ButtonGroup>
      </BlockStack>

      <BlockStack gap="200">
        <Text as="p" variant="bodyMd" fontWeight="medium">
          Number of cards per row
        </Text>
        <ButtonGroup variant="segmented">
          <Button
            pressed={String(settings.productCardsPerRow) === "3"}
            onClick={() => onUpdate("productCardsPerRow", 3)}
          >
            3
          </Button>
          <Button
            pressed={String(settings.productCardsPerRow) === "4"}
            onClick={() => onUpdate("productCardsPerRow", 4)}
          >
            4
          </Button>
          <Button
            pressed={String(settings.productCardsPerRow) === "5"}
            onClick={() => onUpdate("productCardsPerRow", 5)}
          >
            5
          </Button>
        </ButtonGroup>
      </BlockStack>
    </BlockStack>
  );
}
