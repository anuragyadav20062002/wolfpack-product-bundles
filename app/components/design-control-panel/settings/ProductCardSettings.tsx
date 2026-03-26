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

      <BlockStack gap="100">
        <ColorPicker
          label="Selected Card Background"
          value={settings.productCardBgColor}
          onChange={(value) => onUpdate("productCardBgColor", value)}
        />
        <Text as="p" variant="bodySm" tone="subdued">
          Applied to product cards when they have been added to the bundle.
        </Text>
      </BlockStack>

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
        <Text as="p" variant="bodySm" tone="subdued">
          Desktop only — mobile always shows 2 cards per row.
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

      <Divider />

      <Text as="p" variant="headingSm" fontWeight="semibold">
        Hover & Animation
      </Text>

      <RangeSlider
        label="Hover Lift (translate Y)"
        helpText="How many pixels the card rises on hover. 0 = no lift."
        value={settings.productCardHoverTranslateY}
        onChange={(value) => onUpdate("productCardHoverTranslateY", value as number)}
        min={0}
        max={12}
        step={1}
        output
        suffix={`${settings.productCardHoverTranslateY}px`}
      />

      <RangeSlider
        label="Transition Duration"
        helpText="Speed of hover animations in milliseconds."
        value={settings.productCardTransitionDuration}
        onChange={(value) => onUpdate("productCardTransitionDuration", value as number)}
        min={0}
        max={600}
        step={50}
        output
        suffix={`${settings.productCardTransitionDuration}ms`}
      />
    </BlockStack>
  );
}
