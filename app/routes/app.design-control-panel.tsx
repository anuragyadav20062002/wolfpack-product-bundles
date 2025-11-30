import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Select,
  ColorPicker,
  Button,
  Divider,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState, useCallback } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);

  // TODO: Fetch design settings from database
  // const designSettings = await getDesignSettings(session.shop);

  return json({
    message: "Design Control Panel - Coming Soon",
    // TODO: Add actual design settings here
  });
}

export default function DesignControlPanel() {
  // TODO: Replace with actual state management and form handling
  const [primaryColor, setPrimaryColor] = useState({ hue: 120, saturation: 1, brightness: 1 });
  const [secondaryColor, setSecondaryColor] = useState({ hue: 240, saturation: 1, brightness: 1 });
  const [fontFamily, setFontFamily] = useState("inter");
  const [fontSize, setFontSize] = useState("medium");
  const [buttonStyle, setButtonStyle] = useState("rounded");

  const handleSaveSettings = useCallback(() => {
    // TODO: Implement save functionality
    console.log("Saving design settings...");
  }, []);

  const handleResetSettings = useCallback(() => {
    // TODO: Implement reset to default functionality
    console.log("Resetting to default settings...");
  }, []);

  const fontOptions = [
    { label: "Inter", value: "inter" },
    { label: "Roboto", value: "roboto" },
    { label: "Open Sans", value: "open-sans" },
    { label: "Lato", value: "lato" },
    { label: "Montserrat", value: "montserrat" },
  ];

  const fontSizeOptions = [
    { label: "Small", value: "small" },
    { label: "Medium", value: "medium" },
    { label: "Large", value: "large" },
  ];

  const buttonStyleOptions = [
    { label: "Rounded", value: "rounded" },
    { label: "Square", value: "square" },
    { label: "Pill", value: "pill" },
  ];

  return (
    <Page
      title="Design Control Panel"
      subtitle="Customize the appearance of your bundles"
      primaryAction={{
        content: "Save Settings",
        onAction: handleSaveSettings,
      }}
      secondaryActions={[
        {
          content: "Reset to Default",
          onAction: handleResetSettings,
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {/* Placeholder Banner */}
            <Banner tone="info">
              <p>
                This is the Design Control Panel where you can customize the look and feel
                of your product bundles. Features coming soon!
              </p>
            </Banner>

            {/* Color Customization Section */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Color Settings
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Customize the color scheme for your bundle displays
                </Text>
                <Divider />

                <InlineStack gap="400" align="start">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Primary Color
                    </Text>
                    <ColorPicker
                      onChange={setPrimaryColor}
                      color={primaryColor}
                    />
                  </BlockStack>

                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Secondary Color
                    </Text>
                    <ColorPicker
                      onChange={setSecondaryColor}
                      color={secondaryColor}
                    />
                  </BlockStack>
                </InlineStack>

                {/* TODO: Add more color options (accent, background, text, etc.) */}
              </BlockStack>
            </Card>

            {/* Typography Section */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Typography Settings
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Control fonts and text styling for your bundles
                </Text>
                <Divider />

                <Select
                  label="Font Family"
                  options={fontOptions}
                  value={fontFamily}
                  onChange={setFontFamily}
                  helpText="Choose the primary font for your bundle displays"
                />

                <Select
                  label="Font Size"
                  options={fontSizeOptions}
                  value={fontSize}
                  onChange={setFontSize}
                  helpText="Set the base font size"
                />

                {/* TODO: Add more typography options (headings, body text, etc.) */}
              </BlockStack>
            </Card>

            {/* Button & Layout Section */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Button & Layout Settings
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Customize buttons and layout styles
                </Text>
                <Divider />

                <Select
                  label="Button Style"
                  options={buttonStyleOptions}
                  value={buttonStyle}
                  onChange={setButtonStyle}
                  helpText="Choose the button corner style"
                />

                {/* TODO: Add spacing, padding, border radius options */}
              </BlockStack>
            </Card>

            {/* Advanced Customization Section - Placeholder */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Advanced Customization
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Additional design controls (Coming Soon)
                </Text>
                <Divider />

                <BlockStack gap="300">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    • Custom CSS support
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    • Animation settings
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    • Mobile-specific styling
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    • Theme template selection
                  </Text>
                </BlockStack>

                {/* TODO: Implement advanced features */}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        {/* Preview Section - Placeholder */}
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Live Preview
              </Text>
              <Divider />
              <BlockStack gap="200" align="center">
                <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                  Preview panel coming soon
                </Text>
                <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                  See your design changes in real-time
                </Text>
              </BlockStack>

              {/* TODO: Add live preview of bundle with applied settings */}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
