import { BlockStack, InlineStack, Text, Divider, TextField, Button, Collapsible, Box, Banner } from "@shopify/polaris";
import type { SettingsComponentProps } from "./types";

interface CustomCssSettingsProps extends SettingsComponentProps {
  customCssHelpOpen: boolean;
  setCustomCssHelpOpen: (open: boolean) => void;
}

/**
 * Custom CSS Settings Panel
 * Allows users to add custom CSS rules for advanced customization
 */
export function CustomCssSettings({
  settings,
  onUpdate,
  customCssHelpOpen,
  setCustomCssHelpOpen,
}: CustomCssSettingsProps) {
  return (
    <BlockStack gap="400">
      <InlineStack gap="200" align="start" blockAlign="center">
        <Text as="h2" variant="headingMd">
          Custom CSS
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
          title="Add custom CSS rules to further customize your bundle widget appearance"
        >
          i
        </div>
      </InlineStack>
      <Text as="p" variant="bodyMd" tone="subdued">
        Add your own CSS rules to customize the bundle widget beyond the available settings.
      </Text>
      <Divider />

      <BlockStack gap="300">
        <TextField
          label="Custom CSS Rules"
          value={settings.customCss}
          onChange={(value) => onUpdate("customCss", value)}
          multiline={8}
          autoComplete="off"
          placeholder={`.bundle-product-card {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.bundle-add-button:hover {
  transform: scale(1.02);
}`}
          helpText={`${settings.customCss.length.toLocaleString()} / 50,000 characters`}
        />

        <Button
          onClick={() => setCustomCssHelpOpen(!customCssHelpOpen)}
          variant="plain"
          disclosure={customCssHelpOpen ? "up" : "down"}
        >
          View CSS Class Reference
        </Button>

        <Collapsible open={customCssHelpOpen} id="custom-css-help">
          <Box padding="300" background="bg-surface-secondary" borderRadius="200">
            <BlockStack gap="300">
              <Text as="p" variant="headingSm">
                Available CSS Classes
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                <strong>Container:</strong>
                <br />
                .bundle-widget-full-page, .bundle-step-container
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                <strong>Product Cards:</strong>
                <br />
                .bundle-product-card, .bundle-product-image,
                <br />
                .bundle-product-title, .bundle-product-price
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                <strong>Buttons:</strong>
                <br />
                .bundle-add-button, .bundle-remove-button,
                <br />
                .bundle-next-button, .bundle-back-button
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                <strong>Footer:</strong>
                <br />
                .bundle-footer, .bundle-total-price,
                <br />
                .bundle-progress-bar
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                <strong>Modal:</strong>
                <br />
                .bundle-modal, .bundle-modal-content,
                <br />
                .bundle-modal-close
              </Text>
              <Banner tone="warning">
                <Text as="p" variant="bodySm">
                  For security, JavaScript URLs, @import rules, and other potentially harmful patterns
                  are automatically removed.
                </Text>
              </Banner>
            </BlockStack>
          </Box>
        </Collapsible>
      </BlockStack>
    </BlockStack>
  );
}
