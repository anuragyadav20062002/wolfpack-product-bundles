import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  List,
  Badge,
  InlineStack,
  Banner,
  Divider,
  Collapsible,
  Icon,
  Box,
} from "@shopify/polaris";
import {
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  ExternalIcon,
  PlayIcon,
  ImageIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // CRITICAL: Use app's API key (client_id from shopify.app.toml), NOT extension UUID
  // Per Shopify docs: addAppBlockId={api_key}/{handle}
  // Reference: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration
  const apiKey = process.env.SHOPIFY_API_KEY;
  // Block handle must match the liquid filename (without .liquid extension)
  const blockHandle = 'bundle';

  return json({
    shop: session.shop,
    apiKey,
    blockHandle,
  });
};

export default function InstallationGuide() {
  const { shop, apiKey, blockHandle } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    step1: true,
    step2: false,
    step3: false,
    troubleshooting: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  /**
   * Generate theme editor deep link
   * Reference: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration
   */
  const openThemeEditor = () => {
    const shopDomain = shop.includes('.myshopify.com')
      ? shop.replace('.myshopify.com', '')
      : shop;

    // CRITICAL: Use app's API key (client_id), not extension UUID
    const appBlockId = `${apiKey}/${blockHandle}`;
    const themeEditorUrl = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?template=product&addAppBlockId=${appBlockId}&target=newAppsSection`;

    window.open(themeEditorUrl, '_top');
  };

  return (
    <Page
      title="Installation Guide"
      subtitle="Complete step-by-step guide to install and configure the Wolfpack Bundle Widget"
      backAction={{
        content: "Dashboard",
        onAction: () => navigate("/app/dashboard"),
      }}
      primaryAction={{
        content: "Create Your First Bundle",
        onAction: () => navigate("/app/bundles/cart-transform"),
      }}
    >
      <Layout>
        {/* Introduction Section */}
        <Layout.Section>
          <Banner tone="info">
            <BlockStack gap="200">
              <Text variant="headingMd" as="h2">
                Welcome to Wolfpack Bundles! 🎉
              </Text>
              <Text variant="bodyMd" as="p">
                This guide will walk you through installing the bundle widget on your store.
                The entire process takes about 5-10 minutes.
              </Text>
            </BlockStack>
          </Banner>
        </Layout.Section>

        {/* Prerequisites */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={InfoIcon} tone="info" />
                <Text variant="headingMd" as="h2">
                  Before You Start
                </Text>
              </InlineStack>

              <List type="bullet">
                <List.Item>
                  <Text variant="bodyMd" as="span">
                    Your theme must be <strong>Online Store 2.0 compatible</strong> (JSON templates)
                  </Text>
                </List.Item>
                <List.Item>
                  <Text variant="bodyMd" as="span">
                    You should have at least one bundle created in the app
                  </Text>
                </List.Item>
                <List.Item>
                  <Text variant="bodyMd" as="span">
                    Make sure you have a backup of your theme (recommended)
                  </Text>
                </List.Item>
              </List>

              <Banner tone="warning">
                <Text variant="bodyMd" as="p">
                  <strong>Not sure if your theme is compatible?</strong> Most themes from 2021 onwards
                  are Online Store 2.0. You can check by going to Online Store → Themes →
                  Theme Actions → Edit Code, and looking for a "templates" folder with .json files.
                </Text>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Step 1: Add Bundle Widget Block */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <Badge tone="info">Step 1</Badge>
                  <Text variant="headingLg" as="h2">
                    Add Bundle Widget to Your Theme
                  </Text>
                </InlineStack>
                <Button
                  onClick={() => toggleSection('step1')}
                  disclosure={openSections.step1 ? "up" : "down"}
                >
                  {openSections.step1 ? 'Collapse' : 'Expand'}
                </Button>
              </InlineStack>

              <Collapsible
                open={openSections.step1}
                id="step1-collapsible"
                transition={{duration: '200ms', timingFunction: 'ease-in-out'}}
              >
                <BlockStack gap="400">
                  <Divider />

                  <Text variant="headingMd" as="h3">
                    Method 1: Automatic Setup (Recommended)
                  </Text>

                  <List type="number">
                    <List.Item>
                      Click the <strong>"Open Theme Editor"</strong> button below
                    </List.Item>
                    <List.Item>
                      The theme editor will open with the <strong>Bundle Builder</strong> block pre-selected
                    </List.Item>
                    <List.Item>
                      Drag and drop the block to your desired position (we recommend near the Add to Cart button)
                    </List.Item>
                    <List.Item>
                      Click <strong>"Save"</strong> in the top right corner
                    </List.Item>
                  </List>

                  <InlineStack gap="300">
                    <Button
                      variant="primary"
                      onClick={openThemeEditor}
                      icon={ExternalIcon}
                    >
                      Open Theme Editor
                    </Button>
                    <Button
                      onClick={() => navigate("/app/bundles/cart-transform")}
                    >
                      Create Bundle First
                    </Button>
                  </InlineStack>

                  <Box
                    background="bg-surface-secondary"
                    padding="400"
                    borderRadius="200"
                  >
                    <BlockStack gap="300">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={ImageIcon} />
                        <Text variant="headingSm" as="h4" tone="subdued">
                          [Screenshot Placeholder]
                        </Text>
                      </InlineStack>
                      <Text variant="bodySm" as="p" tone="subdued">
                        <strong>Coming Soon:</strong> Screenshot showing the theme editor with
                        Bundle Builder block highlighted in the sidebar, ready to be added to the product page.
                      </Text>
                    </BlockStack>
                  </Box>

                  <Divider />

                  <Text variant="headingMd" as="h3">
                    Method 2: Manual Installation
                  </Text>

                  <Text variant="bodyMd" as="p">
                    If the automatic method doesn't work, follow these steps:
                  </Text>

                  <List type="number">
                    <List.Item>
                      From your Shopify admin, go to <strong>Online Store → Themes</strong>
                    </List.Item>
                    <List.Item>
                      Click <strong>"Customize"</strong> next to your active theme
                    </List.Item>
                    <List.Item>
                      In the theme editor, click the <strong>dropdown at the top</strong> and select <strong>"Products"</strong> from the template menu
                    </List.Item>
                    <List.Item>
                      Select the product template you want to use (or create a new one for bundles)
                    </List.Item>
                    <List.Item>
                      In the left sidebar, click <strong>"Add block"</strong> (or hover between sections until you see the + icon)
                    </List.Item>
                    <List.Item>
                      Scroll down to the <strong>"Apps"</strong> section
                    </List.Item>
                    <List.Item>
                      Click on <strong>"Bundle Builder"</strong> from the Wolfpack Bundles app
                    </List.Item>
                    <List.Item>
                      Drag the block to position it where you want (recommended: below product description, above Add to Cart)
                    </List.Item>
                    <List.Item>
                      Click <strong>"Save"</strong>
                    </List.Item>
                  </List>

                  <Box
                    background="bg-surface-secondary"
                    padding="400"
                    borderRadius="200"
                  >
                    <BlockStack gap="300">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={PlayIcon} />
                        <Text variant="headingSm" as="h4" tone="subdued">
                          [Video Tutorial Placeholder]
                        </Text>
                      </InlineStack>
                      <Text variant="bodySm" as="p" tone="subdued">
                        <strong>Coming Soon:</strong> Video tutorial showing the complete manual installation
                        process from start to finish, including tips on optimal block placement.
                      </Text>
                    </BlockStack>
                  </Box>

                  <Banner tone="info">
                    <BlockStack gap="200">
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        💡 Pro Tip: Custom Templates
                      </Text>
                      <Text variant="bodyMd" as="p">
                        For better organization, create a custom product template named "cart-transform"
                        specifically for bundle products. This keeps your regular products separate from
                        bundle products and gives you more control over the layout.
                      </Text>
                    </BlockStack>
                  </Banner>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Step 2: Configure Bundle Settings */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <Badge tone="info">Step 2</Badge>
                  <Text variant="headingLg" as="h2">
                    Configure Bundle Settings
                  </Text>
                </InlineStack>
                <Button
                  onClick={() => toggleSection('step2')}
                  disclosure={openSections.step2 ? "up" : "down"}
                >
                  {openSections.step2 ? 'Collapse' : 'Expand'}
                </Button>
              </InlineStack>

              <Collapsible
                open={openSections.step2}
                id="step2-collapsible"
                transition={{duration: '200ms', timingFunction: 'ease-in-out'}}
              >
                <BlockStack gap="400">
                  <Divider />

                  <Text variant="bodyMd" as="p">
                    Once you've added the Bundle Builder block to your theme, you can customize
                    how it looks and behaves:
                  </Text>

                  <List type="number">
                    <List.Item>
                      <strong>In the theme editor</strong>, click on the Bundle Builder block in the sidebar
                    </List.Item>
                    <List.Item>
                      You'll see various settings on the right side:
                      <List type="bullet">
                        <List.Item><strong>Show bundle widget:</strong> Toggle to show/hide the widget</List.Item>
                        <List.Item><strong>Bundle configuration ID:</strong> Auto-populated when you place widget from bundle config</List.Item>
                        <List.Item><strong>Layout and sizing:</strong> Adjust widget width, card sizes, cards per row</List.Item>
                        <List.Item><strong>Display options:</strong> Show/hide bundle title, step numbers, progress bar</List.Item>
                        <List.Item><strong>Discount messaging:</strong> Customize progress and success messages</List.Item>
                        <List.Item><strong>Progress bar styling:</strong> Choose colors and sizes</List.Item>
                        <List.Item><strong>Step navigation styling:</strong> Customize tab appearance</List.Item>
                        <List.Item><strong>Modal UI customization:</strong> Adjust product card appearance in selection modal</List.Item>
                      </List>
                    </List.Item>
                    <List.Item>
                      Customize these settings to match your store's branding
                    </List.Item>
                    <List.Item>
                      Click <strong>"Save"</strong> when done
                    </List.Item>
                  </List>

                  <Box
                    background="bg-surface-secondary"
                    padding="400"
                    borderRadius="200"
                  >
                    <BlockStack gap="300">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={ImageIcon} />
                        <Text variant="headingSm" as="h4" tone="subdued">
                          [Screenshot Placeholder]
                        </Text>
                      </InlineStack>
                      <Text variant="bodySm" as="p" tone="subdued">
                        <strong>Coming Soon:</strong> Screenshot showing the theme editor settings panel
                        with all available customization options for the bundle widget highlighted.
                      </Text>
                    </BlockStack>
                  </Box>

                  <Banner tone="info">
                    <Text variant="bodyMd" as="p">
                      <strong>Note:</strong> The widget will only display on products that have been
                      configured as bundle container products. Regular products won't show the widget.
                    </Text>
                  </Banner>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Step 3: Test Your Bundle */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <Badge tone="success">Step 3</Badge>
                  <Text variant="headingLg" as="h2">
                    Test Your Bundle
                  </Text>
                </InlineStack>
                <Button
                  onClick={() => toggleSection('step3')}
                  disclosure={openSections.step3 ? "up" : "down"}
                >
                  {openSections.step3 ? 'Collapse' : 'Expand'}
                </Button>
              </InlineStack>

              <Collapsible
                open={openSections.step3}
                id="step3-collapsible"
                transition={{duration: '200ms', timingFunction: 'ease-in-out'}}
              >
                <BlockStack gap="400">
                  <Divider />

                  <Text variant="bodyMd" as="p">
                    Before going live, test your bundle to ensure everything works correctly:
                  </Text>

                  <List type="number">
                    <List.Item>
                      Navigate to a bundle container product on your storefront
                    </List.Item>
                    <List.Item>
                      Verify the bundle widget appears and displays correctly
                    </List.Item>
                    <List.Item>
                      Click through each step and select products
                    </List.Item>
                    <List.Item>
                      Check that the progress bar updates as you make selections
                    </List.Item>
                    <List.Item>
                      Verify discount messages display correctly
                    </List.Item>
                    <List.Item>
                      Add the bundle to cart and verify all selected products are included
                    </List.Item>
                    <List.Item>
                      Complete a test checkout to ensure the cart transform applies discounts correctly
                    </List.Item>
                  </List>

                  <Banner tone="warning">
                    <BlockStack gap="200">
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        <Icon source={AlertCircleIcon} /> Important Testing Notes
                      </Text>
                      <List type="bullet">
                        <List.Item>
                          Use Shopify's test mode or create a test order to avoid processing real payments
                        </List.Item>
                        <List.Item>
                          Test on both desktop and mobile devices to ensure responsive design
                        </List.Item>
                        <List.Item>
                          Check browser console for any JavaScript errors (press F12)
                        </List.Item>
                        <List.Item>
                          Verify the bundle widget doesn't conflict with your theme's existing functionality
                        </List.Item>
                      </List>
                    </BlockStack>
                  </Banner>

                  <Box
                    background="bg-surface-secondary"
                    padding="400"
                    borderRadius="200"
                  >
                    <BlockStack gap="300">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={PlayIcon} />
                        <Text variant="headingSm" as="h4" tone="subdued">
                          [Video Tutorial Placeholder]
                        </Text>
                      </InlineStack>
                      <Text variant="bodySm" as="p" tone="subdued">
                        <strong>Coming Soon:</strong> Video demonstrating a complete test purchase
                        flow, showing what to look for and how to verify everything is working correctly.
                      </Text>
                    </BlockStack>
                  </Box>

                  <Banner tone="success">
                    <BlockStack gap="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={CheckCircleIcon} />
                        <Text variant="bodyMd" as="p" fontWeight="semibold">
                          Setup Complete! 🎉
                        </Text>
                      </InlineStack>
                      <Text variant="bodyMd" as="p">
                        Your bundle widget is now installed and ready to start increasing your
                        average order value. Monitor your analytics to see the impact!
                      </Text>
                    </BlockStack>
                  </Banner>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Troubleshooting Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={AlertCircleIcon} tone="warning" />
                  <Text variant="headingLg" as="h2">
                    Troubleshooting Common Issues
                  </Text>
                </InlineStack>
                <Button
                  onClick={() => toggleSection('troubleshooting')}
                  disclosure={openSections.troubleshooting ? "up" : "down"}
                >
                  {openSections.troubleshooting ? 'Collapse' : 'Expand'}
                </Button>
              </InlineStack>

              <Collapsible
                open={openSections.troubleshooting}
                id="troubleshooting-collapsible"
                transition={{duration: '200ms', timingFunction: 'ease-in-out'}}
              >
                <BlockStack gap="400">
                  <Divider />

                  {/* Issue 1 */}
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h3">
                        ❌ "bundle-builder not added" error in theme editor
                      </Text>
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Possible causes:
                      </Text>
                      <List type="bullet">
                        <List.Item>App extension not properly installed</List.Item>
                        <List.Item>Theme cache needs to be cleared</List.Item>
                        <List.Item>Extension UUID mismatch</List.Item>
                      </List>
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Solutions:
                      </Text>
                      <List type="number">
                        <List.Item>Refresh the theme editor page</List.Item>
                        <List.Item>Try closing and reopening the theme editor</List.Item>
                        <List.Item>Ensure the app is properly installed (check Apps section in Shopify admin)</List.Item>
                        <List.Item>Contact support if the issue persists</List.Item>
                      </List>
                    </BlockStack>
                  </Card>

                  {/* Issue 2 */}
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h3">
                        ❌ Bundle widget not showing on product page
                      </Text>
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Possible causes:
                      </Text>
                      <List type="bullet">
                        <List.Item>Product is not configured as a bundle container</List.Item>
                        <List.Item>Bundle metafields not synced</List.Item>
                        <List.Item>Widget is hidden or disabled in theme settings</List.Item>
                        <List.Item>Wrong product template being used</List.Item>
                      </List>
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Solutions:
                      </Text>
                      <List type="number">
                        <List.Item>Verify the product has bundle configuration metafields (check in Shopify admin → Products → Metafields)</List.Item>
                        <List.Item>Ensure "Show bundle widget" is enabled in theme editor settings</List.Item>
                        <List.Item>Check that the product is using the correct template (with the bundle widget block)</List.Item>
                        <List.Item>Check browser console for JavaScript errors (F12)</List.Item>
                      </List>
                    </BlockStack>
                  </Card>

                  {/* Issue 3 */}
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h3">
                        ❌ "data-bundle-config is empty" error in console
                      </Text>
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Possible causes:
                      </Text>
                      <List type="bullet">
                        <List.Item>Bundle not saved/published properly</List.Item>
                        <List.Item>Metafields not synced to product</List.Item>
                        <List.Item>Testing on a non-bundle product</List.Item>
                      </List>
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Solutions:
                      </Text>
                      <List type="number">
                        <List.Item>Go to the bundle configuration page and click "Save"</List.Item>
                        <List.Item>Verify the bundle has a Shopify product associated with it</List.Item>
                        <List.Item>Check that metafields are properly set on the product variant</List.Item>
                        <List.Item>Try re-syncing bundle data from the bundle configuration page</List.Item>
                      </List>
                    </BlockStack>
                  </Card>

                  {/* Issue 4 */}
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h3">
                        ❌ Bundle not applying discounts at checkout
                      </Text>
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Possible causes:
                      </Text>
                      <List type="bullet">
                        <List.Item>Cart transform function not configured</List.Item>
                        <List.Item>Discount rules not set up correctly</List.Item>
                        <List.Item>Bundle conditions not met</List.Item>
                      </List>
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Solutions:
                      </Text>
                      <List type="number">
                        <List.Item>Verify cart transform function is created and enabled</List.Item>
                        <List.Item>Check discount rules in bundle configuration</List.Item>
                        <List.Item>Ensure all required bundle steps have selections</List.Item>
                        <List.Item>Review cart transform function logs for errors</List.Item>
                      </List>
                    </BlockStack>
                  </Card>

                  {/* Issue 5 */}
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h3">
                        ❌ Widget styling conflicts with theme
                      </Text>
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Possible causes:
                      </Text>
                      <List type="bullet">
                        <List.Item>Theme CSS overriding widget styles</List.Item>
                        <List.Item>Conflicting JavaScript from other apps</List.Item>
                      </List>
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Solutions:
                      </Text>
                      <List type="number">
                        <List.Item>Try adjusting widget styling options in theme editor</List.Item>
                        <List.Item>Check for CSS conflicts in browser dev tools</List.Item>
                        <List.Item>Contact support for custom CSS adjustments</List.Item>
                      </List>
                    </BlockStack>
                  </Card>

                  <Banner tone="info">
                    <BlockStack gap="200">
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Still having issues?
                      </Text>
                      <Text variant="bodyMd" as="p">
                        If you've tried these solutions and are still experiencing problems,
                        please contact our support team with:
                      </Text>
                      <List type="bullet">
                        <List.Item>A description of the issue</List.Item>
                        <List.Item>Screenshots or screen recordings if possible</List.Item>
                        <List.Item>Any error messages from browser console</List.Item>
                        <List.Item>Your store URL and theme name</List.Item>
                      </List>
                    </BlockStack>
                  </Banner>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Next Steps Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Next Steps
              </Text>

              <List type="bullet">
                <List.Item>
                  <Button
                    variant="plain"
                    onClick={() => navigate("/app/bundles/cart-transform")}
                  >
                    Create more bundles
                  </Button>
                  {" "}to increase your product offerings
                </List.Item>
                <List.Item>
                  <Button
                    variant="plain"
                    onClick={() => navigate("/app/dashboard")}
                  >
                    View your dashboard
                  </Button>
                  {" "}to track bundle performance
                </List.Item>
                <List.Item>
                  Customize widget appearance to match your brand
                </List.Item>
                <List.Item>
                  Monitor analytics to optimize bundle offerings
                </List.Item>
              </List>

              <Divider />

              <BlockStack gap="200">
                <Text variant="headingSm" as="h3">
                  Need Help?
                </Text>
                <InlineStack gap="300">
                  <Button
                    url="https://docs.wolfpack-bundles.com"
                    external
                    icon={ExternalIcon}
                  >
                    View Documentation
                  </Button>
                  <Button
                    url="mailto:support@wolfpack-bundles.com"
                  >
                    Contact Support
                  </Button>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
