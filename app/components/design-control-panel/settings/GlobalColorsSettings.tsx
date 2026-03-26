import { BlockStack, InlineStack, Text, Divider } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";
import type { SettingsComponentProps } from "./types";

/**
 * Global Colors Settings Panel
 * Controls brand-wide color settings that apply across the bundle widget
 */
export function GlobalColorsSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <InlineStack gap="200" align="start" blockAlign="center">
        <Text as="h2" variant="headingMd">
          Global Colors
        </Text>
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: "1.5px solid #8A8A8A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 600,
            color: "#4A4A4A",
            cursor: "help",
          }}
          title="Define your brand's primary colors that will be used consistently across the bundle widget"
        >
          i
        </div>
      </InlineStack>
      <Text as="p" variant="bodyMd" tone="subdued">
        Set brand-wide defaults here. Individual sections can override these values for fine-grained control.
      </Text>
      <Divider />

      {/* Primary Button Color */}
      <InlineStack gap="300" align="space-between" blockAlign="start">
        <BlockStack gap="100" inlineAlign="start">
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            Primary Button Color
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Main color for all primary action buttons (Add to Cart, Next, etc.)
          </Text>
        </BlockStack>
        <ColorPicker
          label=""
          value={settings.globalPrimaryButtonColor}
          onChange={(value) => onUpdate("globalPrimaryButtonColor", value)}
        />
      </InlineStack>
      <Divider />

      {/* Button Text Color */}
      <InlineStack gap="300" align="space-between" blockAlign="start">
        <BlockStack gap="100" inlineAlign="start">
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            Button Text Color
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Text color for all button labels and call-to-actions across the bundle
          </Text>
        </BlockStack>
        <ColorPicker
          label=""
          value={settings.globalButtonTextColor}
          onChange={(value) => onUpdate("globalButtonTextColor", value)}
        />
      </InlineStack>
      <Divider />

      {/* Primary Text Color */}
      <InlineStack gap="300" align="space-between" blockAlign="start">
        <BlockStack gap="100" inlineAlign="start">
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            Primary Text Color
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Main text color for product titles, headings, and important content
          </Text>
        </BlockStack>
        <ColorPicker
          label=""
          value={settings.globalPrimaryTextColor}
          onChange={(value) => onUpdate("globalPrimaryTextColor", value)}
        />
      </InlineStack>
      <Divider />

      {/* Secondary Text Color */}
      <InlineStack gap="300" align="space-between" blockAlign="start">
        <BlockStack gap="100" inlineAlign="start">
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            Secondary Text Color
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Supporting text for product descriptions, helper text, and subdued content
          </Text>
        </BlockStack>
        <ColorPicker
          label=""
          value={settings.globalSecondaryTextColor}
          onChange={(value) => onUpdate("globalSecondaryTextColor", value)}
        />
      </InlineStack>
      <Divider />

      {/* Footer Background */}
      <InlineStack gap="300" align="space-between" blockAlign="start">
        <BlockStack gap="100" inlineAlign="start">
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            Footer Background
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Background color for all footer sections in the bundle widget
          </Text>
        </BlockStack>
        <ColorPicker
          label=""
          value={settings.globalFooterBgColor}
          onChange={(value) => onUpdate("globalFooterBgColor", value)}
        />
      </InlineStack>
      <Divider />

      {/* Footer Text Color */}
      <InlineStack gap="300" align="space-between" blockAlign="start">
        <BlockStack gap="100" inlineAlign="start">
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            Footer Text Color
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Text color for all content and labels within footer sections
          </Text>
        </BlockStack>
        <ColorPicker
          label=""
          value={settings.globalFooterTextColor}
          onChange={(value) => onUpdate("globalFooterTextColor", value)}
        />
      </InlineStack>
    </BlockStack>
  );
}
