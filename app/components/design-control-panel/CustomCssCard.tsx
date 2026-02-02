/**
 * Custom CSS Card Component
 *
 * Provides a custom CSS editor with reference documentation
 */

import {
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Button,
  Collapsible,
  Box,
  Banner,
  Card,
  Layout,
} from "@shopify/polaris";

interface CustomCssCardProps {
  customCss: string;
  onCustomCssChange: (value: string) => void;
  customCssHelpOpen: boolean;
  onToggleHelp: () => void;
  onSave: () => void;
  isLoading: boolean;
}

export function CustomCssCard({
  customCss,
  onCustomCssChange,
  customCssHelpOpen,
  onToggleHelp,
  onSave,
  isLoading,
}: CustomCssCardProps) {
  return (
    <Layout>
      <Layout.Section>
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  Custom CSS
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Add your own CSS rules to customize the bundle widget beyond the visual editor settings.
                </Text>
              </BlockStack>
              <Button
                onClick={onToggleHelp}
                variant="plain"
                disclosure={customCssHelpOpen ? "up" : "down"}
              >
                CSS Reference
              </Button>
            </InlineStack>

            <Collapsible open={customCssHelpOpen} id="custom-css-help-main">
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="300">
                  <Text as="p" variant="headingSm">Available CSS Classes</Text>
                  <InlineStack gap="600" wrap={true}>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodySm" fontWeight="semibold">Container</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        .bundle-widget-full-page<br />
                        .bundle-step-container<br />
                        #bundle-builder-app
                      </Text>
                    </BlockStack>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodySm" fontWeight="semibold">Product Cards</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        .bundle-product-card<br />
                        .product-card<br />
                        .product-image<br />
                        .product-title<br />
                        .product-price
                      </Text>
                    </BlockStack>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodySm" fontWeight="semibold">Buttons</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        .bundle-add-button<br />
                        .add-bundle-to-cart<br />
                        .modal-nav-button<br />
                        .next-button<br />
                        .prev-button
                      </Text>
                    </BlockStack>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodySm" fontWeight="semibold">Footer & Modal</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        .bundle-footer<br />
                        .modal-footer<br />
                        .bundle-builder-modal<br />
                        .modal-content
                      </Text>
                    </BlockStack>
                  </InlineStack>
                  <Banner tone="warning">
                    <Text as="p" variant="bodySm">
                      For security, JavaScript URLs, @import rules, and potentially harmful patterns are automatically removed.
                    </Text>
                  </Banner>
                </BlockStack>
              </Box>
            </Collapsible>

            <TextField
              label="Custom CSS Rules"
              labelHidden
              value={customCss}
              onChange={onCustomCssChange}
              multiline={10}
              autoComplete="off"
              monospaced
              placeholder={`/* Example: Add shadow to product cards */
.product-card {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: transform 0.2s ease;
}

.product-card:hover {
  transform: translateY(-4px);
}

/* Example: Custom button styling */
.add-bundle-to-cart {
  border-radius: 24px;
}`}
              helpText={`${customCss.length.toLocaleString()} / 50,000 characters used`}
            />

            <InlineStack align="end">
              <Button
                variant="primary"
                onClick={onSave}
                loading={isLoading}
              >
                Save Custom CSS
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );
}
