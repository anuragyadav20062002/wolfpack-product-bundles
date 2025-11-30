import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Select,
  Button,
  Divider,
  Banner,
  Collapsible,
  ChoiceList,
  RangeSlider,
  Checkbox,
  Box,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState, useCallback, useEffect } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

// TODO: Import prisma client when implementing database integration
// import { prisma } from "../db.server";

// Bundle type options for the selector
const BUNDLE_TYPE_OPTIONS = [
  { label: "Product Page Bundle", value: "product_page" },
  { label: "Full Page Bundle", value: "full_page" },
];

const IMAGE_FIT_OPTIONS = [
  { label: "Cover", value: "cover" },
  { label: "Contain", value: "contain" },
  { label: "Fill", value: "fill" },
];

const CARDS_PER_ROW_OPTIONS = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;

  // TODO: Fetch design settings from database
  // const productPageSettings = await prisma.designSettings.findUnique({
  //   where: { shopId_bundleType: { shopId, bundleType: "product_page" } }
  // });

  // Mock data for now
  const mockSettings = {
    product_page: {
      // Product Card
      productCardBgColor: "#FFFFFF",
      productCardFontColor: "#000000",
      productCardFontSize: 16,
      productCardFontWeight: 400,
      productCardImageFit: "cover",
      productCardsPerRow: 3,
      productPriceVisibility: true,
      productStrikePriceColor: "#8D8D8D",
      productStrikeFontSize: 14,
      productStrikeFontWeight: 400,
      productFinalPriceColor: "#000000",
      productFinalPriceFontSize: 18,
      productFinalPriceFontWeight: 700,
      // Button
      buttonBgColor: "#000000",
      buttonTextColor: "#FFFFFF",
      buttonFontSize: 16,
      buttonFontWeight: 600,
      buttonBorderRadius: 8,
      buttonHoverBgColor: "#333333",
      buttonAddToCartText: "Add to cart",
      // Quantity Selector
      quantitySelectorBgColor: "#000000",
      quantitySelectorTextColor: "#FFFFFF",
      quantitySelectorFontSize: 16,
      quantitySelectorBorderRadius: 8,
    },
    full_page: {
      // Default settings for full_page (can be different from product_page)
      productCardBgColor: "#F9FAFB",
      productCardFontColor: "#111827",
      productCardFontSize: 18,
      productCardFontWeight: 500,
      productCardImageFit: "contain",
      productCardsPerRow: 4,
      productPriceVisibility: true,
      productStrikePriceColor: "#9CA3AF",
      productStrikeFontSize: 16,
      productStrikeFontWeight: 400,
      productFinalPriceColor: "#111827",
      productFinalPriceFontSize: 20,
      productFinalPriceFontWeight: 700,
      buttonBgColor: "#7132FF",
      buttonTextColor: "#FFFFFF",
      buttonFontSize: 18,
      buttonFontWeight: 700,
      buttonBorderRadius: 12,
      buttonHoverBgColor: "#5F2DD8",
      buttonAddToCartText: "Add Bundle to Cart",
      quantitySelectorBgColor: "#7132FF",
      quantitySelectorTextColor: "#FFFFFF",
      quantitySelectorFontSize: 18,
      quantitySelectorBorderRadius: 12,
    },
  };

  return json({
    shopId,
    settings: mockSettings,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;
  const formData = await request.formData();

  const bundleType = formData.get("bundleType") as string;
  const settingsJson = formData.get("settings") as string;
  const settings = JSON.parse(settingsJson);

  // TODO: Save to database
  // await prisma.designSettings.upsert({
  //   where: { shopId_bundleType: { shopId, bundleType } },
  //   create: { shopId, bundleType, ...settings },
  //   update: settings
  // });

  console.log("Saving design settings:", { shopId, bundleType, settings });

  return json({ success: true, message: "Design settings saved successfully!" });
}

export default function DesignControlPanel() {
  const { settings } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  // Bundle type selector
  const [selectedBundleType, setSelectedBundleType] = useState<"product_page" | "full_page">("product_page");

  // Current settings based on selected bundle type
  const currentSettings = settings[selectedBundleType];

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    productCard: true,
    productCardTypography: false,
    button: false,
    quantitySelector: false,
    bundleFooter: false,
    bundleStepBar: false,
    general: false,
    imagesGifs: false,
  });

  // Form state - Product Card Section
  const [productCardBgColor, setProductCardBgColor] = useState(currentSettings.productCardBgColor);
  const [productCardFontColor, setProductCardFontColor] = useState(currentSettings.productCardFontColor);
  const [productCardFontSize, setProductCardFontSize] = useState(currentSettings.productCardFontSize);
  const [productCardFontWeight, setProductCardFontWeight] = useState(currentSettings.productCardFontWeight);
  const [productCardImageFit, setProductCardImageFit] = useState(currentSettings.productCardImageFit);
  const [productCardsPerRow, setProductCardsPerRow] = useState(String(currentSettings.productCardsPerRow));
  const [productPriceVisibility, setProductPriceVisibility] = useState(currentSettings.productPriceVisibility);

  // Product Card Typography
  const [productStrikePriceColor, setProductStrikePriceColor] = useState(currentSettings.productStrikePriceColor);
  const [productStrikeFontSize, setProductStrikeFontSize] = useState(currentSettings.productStrikeFontSize);
  const [productStrikeFontWeight, setProductStrikeFontWeight] = useState(currentSettings.productStrikeFontWeight);
  const [productFinalPriceColor, setProductFinalPriceColor] = useState(currentSettings.productFinalPriceColor);
  const [productFinalPriceFontSize, setProductFinalPriceFontSize] = useState(currentSettings.productFinalPriceFontSize);
  const [productFinalPriceFontWeight, setProductFinalPriceFontWeight] = useState(currentSettings.productFinalPriceFontWeight);

  // Button Section
  const [buttonBgColor, setButtonBgColor] = useState(currentSettings.buttonBgColor);
  const [buttonTextColor, setButtonTextColor] = useState(currentSettings.buttonTextColor);
  const [buttonFontSize, setButtonFontSize] = useState(currentSettings.buttonFontSize);
  const [buttonFontWeight, setButtonFontWeight] = useState(currentSettings.buttonFontWeight);
  const [buttonBorderRadius, setButtonBorderRadius] = useState(currentSettings.buttonBorderRadius);
  const [buttonAddToCartText, setButtonAddToCartText] = useState(currentSettings.buttonAddToCartText);

  // Quantity Selector Section
  const [quantitySelectorBgColor, setQuantitySelectorBgColor] = useState(currentSettings.quantitySelectorBgColor);
  const [quantitySelectorTextColor, setQuantitySelectorTextColor] = useState(currentSettings.quantitySelectorTextColor);
  const [quantitySelectorFontSize, setQuantitySelectorFontSize] = useState(currentSettings.quantitySelectorFontSize);
  const [quantitySelectorBorderRadius, setQuantitySelectorBorderRadius] = useState(currentSettings.quantitySelectorBorderRadius);

  // Update form state when bundle type changes
  useEffect(() => {
    const newSettings = settings[selectedBundleType];
    setProductCardBgColor(newSettings.productCardBgColor);
    setProductCardFontColor(newSettings.productCardFontColor);
    setProductCardFontSize(newSettings.productCardFontSize);
    setProductCardFontWeight(newSettings.productCardFontWeight);
    setProductCardImageFit(newSettings.productCardImageFit);
    setProductCardsPerRow(String(newSettings.productCardsPerRow));
    setProductPriceVisibility(newSettings.productPriceVisibility);
    setProductStrikePriceColor(newSettings.productStrikePriceColor);
    setProductStrikeFontSize(newSettings.productStrikeFontSize);
    setProductStrikeFontWeight(newSettings.productStrikeFontWeight);
    setProductFinalPriceColor(newSettings.productFinalPriceColor);
    setProductFinalPriceFontSize(newSettings.productFinalPriceFontSize);
    setProductFinalPriceFontWeight(newSettings.productFinalPriceFontWeight);
    setButtonBgColor(newSettings.buttonBgColor);
    setButtonTextColor(newSettings.buttonTextColor);
    setButtonFontSize(newSettings.buttonFontSize);
    setButtonFontWeight(newSettings.buttonFontWeight);
    setButtonBorderRadius(newSettings.buttonBorderRadius);
    setButtonAddToCartText(newSettings.buttonAddToCartText);
    setQuantitySelectorBgColor(newSettings.quantitySelectorBgColor);
    setQuantitySelectorTextColor(newSettings.quantitySelectorTextColor);
    setQuantitySelectorFontSize(newSettings.quantitySelectorFontSize);
    setQuantitySelectorBorderRadius(newSettings.quantitySelectorBorderRadius);
  }, [selectedBundleType, settings]);

  const toggleSection = useCallback((section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleSaveSettings = useCallback(() => {
    const settingsToSave = {
      productCardBgColor,
      productCardFontColor,
      productCardFontSize,
      productCardFontWeight,
      productCardImageFit,
      productCardsPerRow: parseInt(productCardsPerRow),
      productPriceVisibility,
      productStrikePriceColor,
      productStrikeFontSize,
      productStrikeFontWeight,
      productFinalPriceColor,
      productFinalPriceFontSize,
      productFinalPriceFontWeight,
      buttonBgColor,
      buttonTextColor,
      buttonFontSize,
      buttonFontWeight,
      buttonBorderRadius,
      buttonAddToCartText,
      quantitySelectorBgColor,
      quantitySelectorTextColor,
      quantitySelectorFontSize,
      quantitySelectorBorderRadius,
    };

    const formData = new FormData();
    formData.append("bundleType", selectedBundleType);
    formData.append("settings", JSON.stringify(settingsToSave));

    submit(formData, { method: "post" });
  }, [
    selectedBundleType,
    productCardBgColor,
    productCardFontColor,
    productCardFontSize,
    productCardFontWeight,
    productCardImageFit,
    productCardsPerRow,
    productPriceVisibility,
    productStrikePriceColor,
    productStrikeFontSize,
    productStrikeFontWeight,
    productFinalPriceColor,
    productFinalPriceFontSize,
    productFinalPriceFontWeight,
    buttonBgColor,
    buttonTextColor,
    buttonFontSize,
    buttonFontWeight,
    buttonBorderRadius,
    buttonAddToCartText,
    quantitySelectorBgColor,
    quantitySelectorTextColor,
    quantitySelectorFontSize,
    quantitySelectorBorderRadius,
    submit,
  ]);

  const handleResetSettings = useCallback(() => {
    const defaultSettings = settings[selectedBundleType];
    setProductCardBgColor(defaultSettings.productCardBgColor);
    setProductCardFontColor(defaultSettings.productCardFontColor);
    setProductCardFontSize(defaultSettings.productCardFontSize);
    setProductCardFontWeight(defaultSettings.productCardFontWeight);
    setProductCardImageFit(defaultSettings.productCardImageFit);
    setProductCardsPerRow(String(defaultSettings.productCardsPerRow));
    setProductPriceVisibility(defaultSettings.productPriceVisibility);
    setProductStrikePriceColor(defaultSettings.productStrikePriceColor);
    setProductStrikeFontSize(defaultSettings.productStrikeFontSize);
    setProductStrikeFontWeight(defaultSettings.productStrikeFontWeight);
    setProductFinalPriceColor(defaultSettings.productFinalPriceColor);
    setProductFinalPriceFontSize(defaultSettings.productFinalPriceFontSize);
    setProductFinalPriceFontWeight(defaultSettings.productFinalPriceFontWeight);
    setButtonBgColor(defaultSettings.buttonBgColor);
    setButtonTextColor(defaultSettings.buttonTextColor);
    setButtonFontSize(defaultSettings.buttonFontSize);
    setButtonFontWeight(defaultSettings.buttonFontWeight);
    setButtonBorderRadius(defaultSettings.buttonBorderRadius);
    setButtonAddToCartText(defaultSettings.buttonAddToCartText);
    setQuantitySelectorBgColor(defaultSettings.quantitySelectorBgColor);
    setQuantitySelectorTextColor(defaultSettings.quantitySelectorTextColor);
    setQuantitySelectorFontSize(defaultSettings.quantitySelectorFontSize);
    setQuantitySelectorBorderRadius(defaultSettings.quantitySelectorBorderRadius);
  }, [selectedBundleType, settings]);

  const CollapsibleSection = ({
    title,
    sectionKey,
    children,
  }: {
    title: string;
    sectionKey: keyof typeof openSections;
    children: React.ReactNode;
  }) => {
    const isOpen = openSections[sectionKey];
    return (
      <Box>
        <div
          onClick={() => toggleSection(sectionKey)}
          style={{
            cursor: "pointer",
            padding: "12px 16px",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isOpen ? "#F9FAFB" : "transparent",
          }}
        >
          <InlineStack gap="200" blockAlign="center">
            <div
              style={{
                width: "3px",
                height: "19px",
                backgroundColor: isOpen ? "#7132FF" : "transparent",
              }}
            />
            <Text as="span" variant="bodyMd" fontWeight="semibold">
              {title}
            </Text>
          </InlineStack>
          {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </div>
        <Collapsible open={isOpen} id={`${sectionKey}-collapsible`}>
          <div style={{ padding: "16px" }}>{children}</div>
        </Collapsible>
      </Box>
    );
  };

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
        {/* Left Sidebar - Navigation */}
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Customise
              </Text>

              <Select
                label="Bundle Type"
                options={BUNDLE_TYPE_OPTIONS}
                value={selectedBundleType}
                onChange={(value) => setSelectedBundleType(value as "product_page" | "full_page")}
                helpText="Choose which bundle type to customize"
              />

              <Divider />

              {/* Navigation Sections */}
              <BlockStack gap="0">
                <CollapsibleSection title="Product Card" sectionKey="productCard">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Background, image fit, layout
                  </Text>
                </CollapsibleSection>

                <CollapsibleSection title="Product Card Typography" sectionKey="productCardTypography">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Font colors, sizes, and weights
                  </Text>
                </CollapsibleSection>

                <CollapsibleSection title="Button" sectionKey="button">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Button styling and text
                  </Text>
                </CollapsibleSection>

                <CollapsibleSection title="Quantity Selector" sectionKey="quantitySelector">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Quantity selector appearance
                  </Text>
                </CollapsibleSection>

                <CollapsibleSection title="Bundle Footer" sectionKey="bundleFooter">
                  <Banner tone="info">
                    <Text as="p" variant="bodySm">
                      Coming soon! Footer customization options will be available here.
                    </Text>
                  </Banner>
                </CollapsibleSection>

                <CollapsibleSection title="Bundle Step Bar" sectionKey="bundleStepBar">
                  <Banner tone="info">
                    <Text as="p" variant="bodySm">
                      Coming soon! Step bar customization options will be available here.
                    </Text>
                  </Banner>
                </CollapsibleSection>

                <CollapsibleSection title="General" sectionKey="general">
                  <Banner tone="info">
                    <Text as="p" variant="bodySm">
                      Coming soon! General settings will be available here.
                    </Text>
                  </Banner>
                </CollapsibleSection>

                <CollapsibleSection title="Images & Gifs" sectionKey="imagesGifs">
                  <Banner tone="info">
                    <Text as="p" variant="bodySm">
                      Coming soon! Image and GIF settings will be available here.
                    </Text>
                  </Banner>
                </CollapsibleSection>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Right Sidebar - Settings Panel */}
        <Layout.Section>
          <BlockStack gap="400">
            {/* Product Card Settings */}
            {openSections.productCard && (
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Product Card
                  </Text>
                  <Divider />

                  <InlineStack gap="400" align="start">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Background Color
                      </Text>
                      <TextField
                        label=""
                        type="color"
                        value={productCardBgColor}
                        onChange={setProductCardBgColor}
                        autoComplete="off"
                      />
                      <Text as="p" variant="bodySm" tone="subdued">
                        {productCardBgColor}
                      </Text>
                    </BlockStack>
                  </InlineStack>

                  <RangeSlider
                    label="Font Size"
                    value={productCardFontSize}
                    onChange={setProductCardFontSize}
                    min={12}
                    max={24}
                    output
                  />

                  <RangeSlider
                    label="Font Weight"
                    value={productCardFontWeight}
                    onChange={setProductCardFontWeight}
                    min={300}
                    max={900}
                    step={100}
                    output
                  />

                  <Select
                    label="Product Image Fit"
                    options={IMAGE_FIT_OPTIONS}
                    value={productCardImageFit}
                    onChange={setProductCardImageFit}
                  />

                  <Select
                    label="Number of cards per row"
                    options={CARDS_PER_ROW_OPTIONS}
                    value={productCardsPerRow}
                    onChange={setProductCardsPerRow}
                  />
                </BlockStack>
              </Card>
            )}

            {/* Product Card Typography Settings */}
            {openSections.productCardTypography && (
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Product Card Typography
                  </Text>
                  <Divider />

                  {/* Product Font Color */}
                  <InlineStack gap="400" align="start">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Product Font Color
                      </Text>
                      <TextField
                        label=""
                        type="color"
                        value={productCardFontColor}
                        onChange={setProductCardFontColor}
                        autoComplete="off"
                      />
                      <Text as="p" variant="bodySm" tone="subdued">
                        {productCardFontColor}
                      </Text>
                    </BlockStack>
                  </InlineStack>

                  <Checkbox
                    label="Product Price Visibility"
                    checked={productPriceVisibility}
                    onChange={setProductPriceVisibility}
                  />

                  {/* Strikethrough Price Color */}
                  <InlineStack gap="400" align="start">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Strikethrough Price Color
                      </Text>
                      <TextField
                        label=""
                        type="color"
                        value={productStrikePriceColor}
                        onChange={setProductStrikePriceColor}
                        autoComplete="off"
                      />
                      <Text as="p" variant="bodySm" tone="subdued">
                        {productStrikePriceColor}
                      </Text>
                    </BlockStack>
                  </InlineStack>

                  <RangeSlider
                    label="Strikethrough Font Size"
                    value={productStrikeFontSize}
                    onChange={setProductStrikeFontSize}
                    min={10}
                    max={20}
                    output
                  />

                  <RangeSlider
                    label="Strikethrough Font Weight"
                    value={productStrikeFontWeight}
                    onChange={setProductStrikeFontWeight}
                    min={300}
                    max={700}
                    step={100}
                    output
                  />

                  {/* Final Price Color */}
                  <InlineStack gap="400" align="start">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Final Price Font Color
                      </Text>
                      <TextField
                        label=""
                        type="color"
                        value={productFinalPriceColor}
                        onChange={setProductFinalPriceColor}
                        autoComplete="off"
                      />
                      <Text as="p" variant="bodySm" tone="subdued">
                        {productFinalPriceColor}
                      </Text>
                    </BlockStack>
                  </InlineStack>

                  <RangeSlider
                    label="Final Price Font Size"
                    value={productFinalPriceFontSize}
                    onChange={setProductFinalPriceFontSize}
                    min={14}
                    max={28}
                    output
                  />

                  <RangeSlider
                    label="Final Price Font Weight"
                    value={productFinalPriceFontWeight}
                    onChange={setProductFinalPriceFontWeight}
                    min={400}
                    max={900}
                    step={100}
                    output
                  />
                </BlockStack>
              </Card>
            )}

            {/* Button Settings */}
            {openSections.button && (
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Button
                  </Text>
                  <Divider />

                  <InlineStack gap="400" align="start">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Background Color
                      </Text>
                      <TextField
                        label=""
                        type="color"
                        value={buttonBgColor}
                        onChange={setButtonBgColor}
                        autoComplete="off"
                      />
                      <Text as="p" variant="bodySm" tone="subdued">
                        {buttonBgColor}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Text Color
                      </Text>
                      <TextField
                        label=""
                        type="color"
                        value={buttonTextColor}
                        onChange={setButtonTextColor}
                        autoComplete="off"
                      />
                      <Text as="p" variant="bodySm" tone="subdued">
                        {buttonTextColor}
                      </Text>
                    </BlockStack>
                  </InlineStack>

                  <RangeSlider
                    label="Font Size"
                    value={buttonFontSize}
                    onChange={setButtonFontSize}
                    min={12}
                    max={24}
                    output
                  />

                  <RangeSlider
                    label="Border Radius"
                    value={buttonBorderRadius}
                    onChange={setButtonBorderRadius}
                    min={0}
                    max={24}
                    output
                  />

                  <TextField
                    label="Button Text"
                    value={buttonAddToCartText}
                    onChange={setButtonAddToCartText}
                    autoComplete="off"
                  />

                  <Checkbox
                    label="Show button with rounded corners"
                    checked={buttonBorderRadius > 0}
                    onChange={(checked) => setButtonBorderRadius(checked ? 8 : 0)}
                  />
                </BlockStack>
              </Card>
            )}

            {/* Quantity Selector Settings */}
            {openSections.quantitySelector && (
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Quantity Selector
                  </Text>
                  <Divider />

                  <InlineStack gap="400" align="start">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Background Color
                      </Text>
                      <TextField
                        label=""
                        type="color"
                        value={quantitySelectorBgColor}
                        onChange={setQuantitySelectorBgColor}
                        autoComplete="off"
                      />
                      <Text as="p" variant="bodySm" tone="subdued">
                        {quantitySelectorBgColor}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Text Color
                      </Text>
                      <TextField
                        label=""
                        type="color"
                        value={quantitySelectorTextColor}
                        onChange={setQuantitySelectorTextColor}
                        autoComplete="off"
                      />
                      <Text as="p" variant="bodySm" tone="subdued">
                        {quantitySelectorTextColor}
                      </Text>
                    </BlockStack>
                  </InlineStack>

                  <RangeSlider
                    label="Font Size"
                    value={quantitySelectorFontSize}
                    onChange={setQuantitySelectorFontSize}
                    min={12}
                    max={24}
                    output
                  />

                  <RangeSlider
                    label="Border Radius"
                    value={quantitySelectorBorderRadius}
                    onChange={setQuantitySelectorBorderRadius}
                    min={0}
                    max={24}
                    output
                  />
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
