import { type LoaderFunctionArgs } from "@remix-run/node";
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
  Select,
  Checkbox,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState } from "react";
import { AppLogger } from "../lib/logger";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // CRITICAL: Use app's API key (client_id from shopify.app.toml), NOT extension UUID
  // Per Shopify docs: addAppBlockId={api_key}/{handle}
  // Reference: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration
  const apiKey = process.env.SHOPIFY_API_KEY;
  // Block handle must match the liquid filename (without .liquid extension)
  // File: extensions/bundle-builder/blocks/bundle.liquid
  const blockHandle = 'bundle';

  return {
    shop: session.shop,
    apiKey,
    blockHandle,
  };
};

export default function Onboarding() {
  const { shop, apiKey, blockHandle } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('product');
  const [selectedTarget, setSelectedTarget] = useState('newAppsSection');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const totalSteps = 4;

  /**
   * Generate theme editor deep link following Shopify's official documentation
   * https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration
   *
   * URL Structure: https://{shop}/admin/themes/current/editor?template={template}&addAppBlockId={api_key}/{handle}&target={target}
   *
   * @param template - JSON template name (product, index, collection, etc.)
   * @param target - Where to add the block (newAppsSection, mainSection, sectionGroup:header, etc.)
   */
  const generateThemeEditorLink = (template: string = 'product', target: string = 'newAppsSection') => {
    // CRITICAL: Use app's API key (client_id), not extension UUID
    const appBlockId = `${apiKey}/${blockHandle}`;

    // Construct deep link with proper parameters
    const params = new URLSearchParams({
      template: template,
      addAppBlockId: appBlockId,
      target: target
    });

    const deepLink = `https://${shop}/admin/themes/current/editor?${params.toString()}`;

    AppLogger.debug('Generated theme editor deep link', {
      shop,
      template,
      target,
      appBlockId,
      apiKey,
      deepLink
    });

    return deepLink;
  };

  const handleOpenThemeEditor = () => {
    const themeEditorUrl = generateThemeEditorLink(selectedTemplate, selectedTarget);
    AppLogger.info('Opening theme editor from onboarding wizard', {
      shop,
      template: selectedTemplate,
      target: selectedTarget
    });

    // Use window.open with _top to navigate the entire app frame
    // This avoids popup blockers and works within Shopify admin
    window.open(themeEditorUrl, '_top');
  };

  const steps = [
    {
      number: 1,
      title: "Create Your First Bundle",
      description: "Start by creating a bundle with products you want to offer together.",
      action: {
        label: "Create Bundle",
        onAction: () => navigate("/app/bundles/cart-transform"),
      },
      completed: false,
    },
    {
      number: 2,
      title: "Add Bundle Widget to Your Theme",
      description: "Place the bundle widget on your product pages using the theme editor.",
      action: {
        label: "Open Theme Editor",
        onAction: handleOpenThemeEditor,
      },
      completed: false,
    },
    {
      number: 3,
      title: "Customize Bundle Display",
      description: "Configure how your bundles appear to customers.",
      action: {
        label: "View Settings",
        onAction: () => navigate("/app/bundles/cart-transform"),
      },
      completed: false,
    },
    {
      number: 4,
      title: "Test Your Bundle",
      description: "Make a test purchase to ensure everything works correctly.",
      action: {
        label: "Go to Dashboard",
        onAction: () => navigate("/app/dashboard"),
      },
      completed: false,
    },
  ];

  return (
    <Page
      title="Welcome to Wolfpack Bundles"
      subtitle="Let's get your bundle app set up in just a few steps"
      backAction={{
        content: "Dashboard",
        onAction: () => navigate("/app/dashboard"),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Getting Started Guide
              </Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Follow these steps to start selling product bundles on your store.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <BlockStack gap="400">
            {steps.map((step) => (
              <Card key={step.number}>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="300" blockAlign="center">
                      <Badge
                        tone={step.number === currentStep ? "info" : step.completed ? "success" : undefined}
                      >
                        {`Step ${step.number}`}
                      </Badge>
                      <Text variant="headingMd" as="h3">
                        {step.title}
                      </Text>
                    </InlineStack>
                  </InlineStack>

                  <Text variant="bodyMd" as="p" tone="subdued">
                    {step.description}
                  </Text>

                  {step.number === 2 && (
                    <>
                      <Divider />
                      <BlockStack gap="400">
                        <Banner tone="info">
                          <BlockStack gap="200">
                            <Text variant="bodyMd" as="p" fontWeight="semibold">
                              Choose where to add the bundle widget:
                            </Text>
                            <Text variant="bodyMd" as="p" tone="subdued">
                              The bundle widget will open in the theme editor, ready to add to your selected template.
                            </Text>
                          </BlockStack>
                        </Banner>

                        <Card>
                          <BlockStack gap="400">
                            <Text variant="headingSm" as="h4">
                              Template Selection
                            </Text>
                            <Select
                              label="Which page should display bundles?"
                              options={[
                                { label: 'Product Pages (Recommended)', value: 'product' },
                                { label: 'Home Page', value: 'index' },
                                { label: 'Collection Pages', value: 'collection' },
                              ]}
                              value={selectedTemplate}
                              onChange={setSelectedTemplate}
                              helpText="Product pages are recommended since bundles are configured per product."
                            />

                            <Checkbox
                              label="Show advanced placement options"
                              checked={showAdvancedOptions}
                              onChange={setShowAdvancedOptions}
                            />

                            {showAdvancedOptions && (
                              <Select
                                label="Block placement"
                                options={[
                                  { label: 'New Apps Section (Recommended)', value: 'newAppsSection' },
                                  { label: 'Main Section', value: 'mainSection' },
                                  { label: 'Header Section Group', value: 'sectionGroup:header' },
                                  { label: 'Footer Section Group', value: 'sectionGroup:footer' },
                                ]}
                                value={selectedTarget}
                                onChange={setSelectedTarget}
                                helpText="Where the bundle widget will be added on the selected template."
                              />
                            )}
                          </BlockStack>
                        </Card>

                        <Banner tone="info">
                          <BlockStack gap="200">
                            <Text variant="bodyMd" as="p" fontWeight="semibold">
                              Step-by-step instructions:
                            </Text>
                            <List type="number">
                              <List.Item>
                                Click "Open Theme Editor" below to open your theme editor
                              </List.Item>
                              <List.Item>
                                The bundle-builder block will be pre-selected and ready to add
                              </List.Item>
                              <List.Item>
                                Position the block where you want it (we recommend near the product form)
                              </List.Item>
                              <List.Item>
                                Preview your changes to see how the bundle widget looks
                              </List.Item>
                              <List.Item>
                                Click "Save" in the theme editor to publish your changes
                              </List.Item>
                            </List>
                          </BlockStack>
                        </Banner>

                        <Banner tone="warning">
                          <BlockStack gap="200">
                            <Text variant="bodyMd" as="p" fontWeight="semibold">
                              Important notes:
                            </Text>
                            <List>
                              <List.Item>
                                Your theme must be Online Store 2.0 compatible (JSON templates)
                              </List.Item>
                              <List.Item>
                                The bundle widget will only display on products configured as bundles
                              </List.Item>
                              <List.Item>
                                You can customize the widget appearance in the theme editor settings
                              </List.Item>
                            </List>
                          </BlockStack>
                        </Banner>
                      </BlockStack>
                    </>
                  )}

                  <InlineStack gap="200">
                    <Button
                      variant={step.number === currentStep ? "primary" : "secondary"}
                      onClick={() => {
                        setCurrentStep(step.number);
                        step.action.onAction();
                      }}
                    >
                      {step.action.label}
                    </Button>
                    {step.number < totalSteps && (
                      <Button
                        onClick={() => setCurrentStep(step.number + 1)}
                      >
                        Skip to Next Step
                      </Button>
                    )}
                  </InlineStack>
                </BlockStack>
              </Card>
            ))}
          </BlockStack>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Need Help?
              </Text>
              <Text variant="bodyMd" as="p">
                If you encounter any issues during setup, please contact our support team or check our documentation.
              </Text>
              <InlineStack gap="200">
                <Button
                  url="https://docs.wolfpack-bundles.com"
                  external
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
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
