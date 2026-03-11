import { BlockStack, Text, Divider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Skeleton Loading Settings Panel
 * Controls the shimmer animation colours shown while product cards load.
 */
export function SkeletonSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Skeleton Loading
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Customise the shimmer animation displayed while product cards are loading.
        Match these colours to your bundle's background for a seamless experience.
      </Text>
      <Divider />

      <ColorPicker
        label="Base Background Color"
        value={settings.skeletonBaseBgColor}
        onChange={(value) => onUpdate("skeletonBaseBgColor", value)}
      />

      <ColorPicker
        label="Shimmer Color"
        value={settings.skeletonShimmerColor}
        onChange={(value) => onUpdate("skeletonShimmerColor", value)}
      />

      <ColorPicker
        label="Highlight Color"
        value={settings.skeletonHighlightColor}
        onChange={(value) => onUpdate("skeletonHighlightColor", value)}
      />
    </BlockStack>
  );
}
