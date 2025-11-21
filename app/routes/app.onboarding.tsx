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
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState } from "react";
import { AppLogger } from "../lib/logger";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Get extension UUID from environment
  const extensionUuid = process.env.SHOPIFY_BUNDLE_BUILDER_ID;
  const blockHandle = 'bundle-builder';

  return {
    shop: session.shop,
    extensionUuid,
    blockHandle,
  };
};

export default function Onboarding() {
  const { shop, extensionUuid, blockHandle } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = 4;

  // Generate theme editor deep link
  const generateThemeEditorLink = () => {
    const appBlockId = `${extensionUuid}/${blockHandle}`;
    // Simple deep link following Shopify's official documentation
    // This opens theme editor on the product template with the block ready to add
    return `https://${shop}/admin/themes/current/editor?template=product&addAppBlockId=${appBlockId}&target=newAppsSection`;
  };

  const handleOpenThemeEditor = () => {
    const themeEditorUrl = generateThemeEditorLink();
    AppLogger.info('Opening theme editor from onboarding wizard', { shop });

    // Use window.open with _top to navigate the entire app frame
    // This avoids popup blockers
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
                      <Banner tone="info">
                        <BlockStack gap="200">
                          <Text variant="bodyMd" as="p" fontWeight="semibold">
                            How to add the bundle widget to your theme:
                          </Text>
                          <List type="number">
                            <List.Item>
                              Click "Open Theme Editor" below to navigate to your theme editor
                            </List.Item>
                            <List.Item>
                              In the theme editor, you'll see the "bundle-builder" block available to add
                            </List.Item>
                            <List.Item>
                              Click the "Add block" button and look for "Apps" section
                            </List.Item>
                            <List.Item>
                              Select "bundle-builder" from the list of available app blocks
                            </List.Item>
                            <List.Item>
                              Position the block where you want it to appear on product pages (typically near the product form)
                            </List.Item>
                            <List.Item>
                              Click "Save" in the theme editor to publish your changes
                            </List.Item>
                          </List>
                        </BlockStack>
                      </Banner>
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
