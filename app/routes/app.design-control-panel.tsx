import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Modal,
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Select,
  Button,
  Divider,
  Banner,
  Collapsible,
  RangeSlider,
  Checkbox,
  Box,
  Icon,
  ButtonGroup,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState, useCallback, useEffect } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@shopify/polaris-icons";

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

  // Modal state
  const [modalActive, setModalActive] = useState(false);
  const [selectedBundleType, setSelectedBundleType] = useState<"product_page" | "full_page">("product_page");

  // Current settings based on selected bundle type
  const currentSettings = settings[selectedBundleType];

  // Navigation state
  const [expandedSection, setExpandedSection] = useState<string | null>("productCard");
  const [activeSubSection, setActiveSubSection] = useState<string>("productCard");

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

  const handleOpenModal = useCallback(() => setModalActive(true), []);
  const handleCloseModal = useCallback(() => setModalActive(false), []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  const handleSubSectionClick = useCallback((subSection: string) => {
    setActiveSubSection(subSection);
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
    handleCloseModal();
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
    handleCloseModal,
  ]);

  const NavigationItem = ({
    label,
    sectionKey,
    hasChildren = false,
    isChild = false,
    onClick,
  }: {
    label: string;
    sectionKey: string;
    hasChildren?: boolean;
    isChild?: boolean;
    onClick?: () => void;
  }) => {
    const isExpanded = expandedSection === sectionKey;
    const isActive = activeSubSection === sectionKey;

    return (
      <div
        onClick={onClick || (() => hasChildren && toggleSection(sectionKey))}
        style={{
          cursor: "pointer",
          padding: isChild ? "8px 16px 8px 36px" : "12px 16px",
          backgroundColor: isActive && isChild ? "#F3F3F3" : "transparent",
          borderLeft: isActive && isChild ? "3px solid #303030" : "3px solid transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text as="span" variant="bodyMd" fontWeight={isChild && isActive ? "semibold" : "regular"}>
          {label}
        </Text>
        {hasChildren && (
          <Icon source={isExpanded ? ChevronDownIcon : ChevronRightIcon} />
        )}
      </div>
    );
  };

  // Render settings panel based on active subsection
  const renderSettingsPanel = () => {
    switch (activeSubSection) {
      case "productCard":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Product Card
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: productCardBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("productCardBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="productCardBgColorInput"
                    type="color"
                    value={productCardBgColor}
                    onChange={(e) => setProductCardBgColor(e.target.value)}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      width: 0,
                      height: 0,
                    }}
                  />
                </div>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    Background Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {productCardBgColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <RangeSlider
              label="Font Size"
              value={productCardFontSize}
              onChange={(value) => setProductCardFontSize(value as number)}
              min={12}
              max={24}
              output
            />

            <RangeSlider
              label="Font Weight"
              value={productCardFontWeight}
              onChange={(value) => setProductCardFontWeight(value as number)}
              min={300}
              max={900}
              step={100}
              output
            />

            <BlockStack gap="200">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Product Image Fit
              </Text>
              <ButtonGroup variant="segmented">
                <Button
                  pressed={productCardImageFit === "cover"}
                  onClick={() => setProductCardImageFit("cover")}
                >
                  Cover
                </Button>
                <Button
                  pressed={productCardImageFit === "fill"}
                  onClick={() => setProductCardImageFit("fill")}
                >
                  Fill
                </Button>
                <Button
                  pressed={productCardImageFit === "contain"}
                  onClick={() => setProductCardImageFit("contain")}
                >
                  Contain
                </Button>
              </ButtonGroup>
            </BlockStack>

            <BlockStack gap="200">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Number of cards per row
              </Text>
              <ButtonGroup variant="segmented">
                <Button
                  pressed={productCardsPerRow === "3"}
                  onClick={() => setProductCardsPerRow("3")}
                >
                  3
                </Button>
                <Button
                  pressed={productCardsPerRow === "4"}
                  onClick={() => setProductCardsPerRow("4")}
                >
                  4
                </Button>
                <Button
                  pressed={productCardsPerRow === "5"}
                  onClick={() => setProductCardsPerRow("5")}
                >
                  5
                </Button>
              </ButtonGroup>
            </BlockStack>
          </BlockStack>
        );

      case "productCardTypography":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Product Card Typography
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: productCardFontColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("productCardFontColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="productCardFontColorInput"
                    type="color"
                    value={productCardFontColor}
                    onChange={(e) => setProductCardFontColor(e.target.value)}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      width: 0,
                      height: 0,
                    }}
                  />
                </div>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    Product Font Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {productCardFontColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <RangeSlider
              label="Font Size"
              value={productCardFontSize}
              onChange={(value) => setProductCardFontSize(value as number)}
              min={12}
              max={24}
              output
            />

            <RangeSlider
              label="Font Weight"
              value={productCardFontWeight}
              onChange={(value) => setProductCardFontWeight(value as number)}
              min={300}
              max={900}
              step={100}
              output
            />

            <BlockStack gap="200">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Product Price Visibility
              </Text>
              <ButtonGroup variant="segmented">
                <Button
                  pressed={productPriceVisibility === true}
                  onClick={() => setProductPriceVisibility(true)}
                >
                  Show
                </Button>
                <Button
                  pressed={productPriceVisibility === false}
                  onClick={() => setProductPriceVisibility(false)}
                >
                  Hide
                </Button>
              </ButtonGroup>
            </BlockStack>

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: productStrikePriceColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("productStrikePriceColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="productStrikePriceColorInput"
                    type="color"
                    value={productStrikePriceColor}
                    onChange={(e) => setProductStrikePriceColor(e.target.value)}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      width: 0,
                      height: 0,
                    }}
                  />
                </div>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    Strikethrough Price Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {productStrikePriceColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <RangeSlider
              label="Strikethrough Font Size"
              value={productStrikeFontSize}
              onChange={(value) => setProductStrikeFontSize(value as number)}
              min={10}
              max={20}
              output
            />

            <RangeSlider
              label="Strikethrough Font Weight"
              value={productStrikeFontWeight}
              onChange={(value) => setProductStrikeFontWeight(value as number)}
              min={300}
              max={700}
              step={100}
              output
            />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: productFinalPriceColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("productFinalPriceColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="productFinalPriceColorInput"
                    type="color"
                    value={productFinalPriceColor}
                    onChange={(e) => setProductFinalPriceColor(e.target.value)}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      width: 0,
                      height: 0,
                    }}
                  />
                </div>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    Final Price Font Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {productFinalPriceColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <RangeSlider
              label="Final Price Font Size"
              value={productFinalPriceFontSize}
              onChange={(value) => setProductFinalPriceFontSize(value as number)}
              min={14}
              max={28}
              output
            />

            <RangeSlider
              label="Final Price Font Weight"
              value={productFinalPriceFontWeight}
              onChange={(value) => setProductFinalPriceFontWeight(value as number)}
              min={400}
              max={900}
              step={100}
              output
            />
          </BlockStack>
        );

      case "button":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Button
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: buttonBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("buttonBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="buttonBgColorInput"
                    type="color"
                    value={buttonBgColor}
                    onChange={(e) => setButtonBgColor(e.target.value)}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      width: 0,
                      height: 0,
                    }}
                  />
                </div>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    Background Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {buttonBgColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: buttonTextColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("buttonTextColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="buttonTextColorInput"
                    type="color"
                    value={buttonTextColor}
                    onChange={(e) => setButtonTextColor(e.target.value)}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      width: 0,
                      height: 0,
                    }}
                  />
                </div>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    Text Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {buttonTextColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <RangeSlider
              label="Font Size"
              value={buttonFontSize}
              onChange={(value) => setButtonFontSize(value as number)}
              min={12}
              max={24}
              output
            />

            <RangeSlider
              label="Border Radius"
              value={buttonBorderRadius}
              onChange={(value) => setButtonBorderRadius(value as number)}
              min={0}
              max={24}
              output
            />

            <Checkbox
              label="Rounded Corners"
              checked={buttonBorderRadius > 0}
              onChange={(checked) => setButtonBorderRadius(checked ? 8 : 0)}
            />
          </BlockStack>
        );

      case "quantitySelector":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Quantity Selector
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: quantitySelectorBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("quantitySelectorBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="quantitySelectorBgColorInput"
                    type="color"
                    value={quantitySelectorBgColor}
                    onChange={(e) => setQuantitySelectorBgColor(e.target.value)}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      width: 0,
                      height: 0,
                    }}
                  />
                </div>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    Background Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {quantitySelectorBgColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: quantitySelectorTextColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("quantitySelectorTextColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="quantitySelectorTextColorInput"
                    type="color"
                    value={quantitySelectorTextColor}
                    onChange={(e) => setQuantitySelectorTextColor(e.target.value)}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      width: 0,
                      height: 0,
                    }}
                  />
                </div>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    Text Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {quantitySelectorTextColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <RangeSlider
              label="Font Size"
              value={quantitySelectorFontSize}
              onChange={(value) => setQuantitySelectorFontSize(value as number)}
              min={12}
              max={24}
              output
            />

            <RangeSlider
              label="Border Radius"
              value={quantitySelectorBorderRadius}
              onChange={(value) => setQuantitySelectorBorderRadius(value as number)}
              min={0}
              max={24}
              output
            />
          </BlockStack>
        );

      default:
        return (
          <Banner tone="info">
            <Text as="p" variant="bodyMd">
              This section is coming soon!
            </Text>
          </Banner>
        );
    }
  };

  return (
    <Page
      title="Design Control Panel"
      subtitle="Customize the appearance of your bundles"
      primaryAction={{
        content: "Open Customisations",
        onAction: handleOpenModal,
      }}
    >
      <Modal
        open={modalActive}
        onClose={handleCloseModal}
        title="Customisations"
        size="fullScreen"
        primaryAction={{
          content: "Save",
          onAction: handleSaveSettings,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleCloseModal,
          },
        ]}
      >
        <Modal.Section flush>
          <div style={{ display: "flex", height: "calc(100vh - 120px)", minHeight: "600px" }}>
            {/* Left Sidebar - Navigation */}
            <div
              style={{
                width: "269px",
                borderRight: "1px solid #D9D9D9",
                backgroundColor: "#FFFFFF",
                overflowY: "auto",
              }}
            >
              <div style={{ padding: "16px" }}>
                <Text as="h3" variant="headingSm">
                  Customise
                </Text>
              </div>

              <Divider />

              {/* Product Card Section */}
              <NavigationItem
                label="Product Card"
                sectionKey="productCard"
                hasChildren
              />
              <Collapsible open={expandedSection === "productCard"} id="productCard-collapsible">
                <NavigationItem
                  label="Product Card"
                  sectionKey="productCard"
                  isChild
                  onClick={() => handleSubSectionClick("productCard")}
                />
                <NavigationItem
                  label="Product Card Typography"
                  sectionKey="productCardTypography"
                  isChild
                  onClick={() => handleSubSectionClick("productCardTypography")}
                />
                <NavigationItem
                  label="Button"
                  sectionKey="button"
                  isChild
                  onClick={() => handleSubSectionClick("button")}
                />
                <NavigationItem
                  label="Quantity Selector"
                  sectionKey="quantitySelector"
                  isChild
                  onClick={() => handleSubSectionClick("quantitySelector")}
                />
              </Collapsible>

              {/* Other Sections - Collapsed by default */}
              <NavigationItem
                label="Bundle Footer"
                sectionKey="bundleFooter"
                hasChildren
              />
              <NavigationItem
                label="Bundle Step Bar"
                sectionKey="bundleStepBar"
                hasChildren
              />
              <NavigationItem
                label="General"
                sectionKey="general"
                hasChildren
              />
            </div>

            {/* Right Side - Visual Preview + Settings */}
            <div style={{ flex: 1, display: "flex", overflowY: "auto" }}>
              {/* Center - Visual Preview */}
              <div
                style={{
                  flex: 1,
                  padding: "40px",
                  backgroundColor: "#F4F4F4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  {/* Product Card Preview */}
                  <div
                    style={{
                      backgroundColor: productCardBgColor,
                      borderRadius: "12px",
                      padding: "24px",
                      maxWidth: "280px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      position: "relative",
                    }}
                  >
                    {/* Product Image Placeholder */}
                    <div
                      style={{
                        width: "100%",
                        height: "200px",
                        backgroundColor: "#E5E5E5",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Product Image
                      </Text>
                    </div>

                    {/* Product Title */}
                    <Text
                      as="h3"
                      variant="headingMd"
                      alignment="center"
                      fontWeight={String(productCardFontWeight) as any}
                    >
                      <span
                        style={{
                          color: productCardFontColor,
                          fontSize: `${productCardFontSize}px`,
                        }}
                      >
                        BIG PRODUCT NAME SPANNING TWO LINES
                      </span>
                    </Text>

                    {/* Prices */}
                    {productPriceVisibility && (
                      <div style={{ margin: "12px 0", textAlign: "center" }}>
                        <span
                          style={{
                            color: productStrikePriceColor,
                            fontSize: `${productStrikeFontSize}px`,
                            fontWeight: productStrikeFontWeight,
                            textDecoration: "line-through",
                            marginRight: "8px",
                          }}
                        >
                          $19.99
                        </span>
                        <span
                          style={{
                            color: productFinalPriceColor,
                            fontSize: `${productFinalPriceFontSize}px`,
                            fontWeight: productFinalPriceFontWeight,
                          }}
                        >
                          $19.99
                        </span>
                      </div>
                    )}

                    {/* Variant Selector */}
                    <div style={{ marginBottom: "12px" }}>
                      <input
                        type="text"
                        placeholder="Size 9"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: `${quantitySelectorBorderRadius}px`,
                          border: "1px solid #D1D1D1",
                          fontSize: `${quantitySelectorFontSize}px`,
                        }}
                        readOnly
                      />
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      style={{
                        width: "100%",
                        backgroundColor: buttonBgColor,
                        color: buttonTextColor,
                        border: "none",
                        borderRadius: `${buttonBorderRadius}px`,
                        padding: "12px 24px",
                        fontSize: `${buttonFontSize}px`,
                        fontWeight: buttonFontWeight,
                        cursor: "pointer",
                      }}
                    >
                      {buttonAddToCartText}
                    </button>
                  </div>

                  {/* Annotation Labels */}
                  <div style={{ marginTop: "40px" }}>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Preview updates as you customize
                    </Text>
                  </div>
                </div>
              </div>

              {/* Right Panel - Settings Controls */}
              <div
                style={{
                  width: "285px",
                  borderLeft: "1px solid #D9D9D9",
                  padding: "24px",
                  backgroundColor: "#FFFFFF",
                  overflowY: "auto",
                }}
              >
                {renderSettingsPanel()}
              </div>
            </div>
          </div>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
