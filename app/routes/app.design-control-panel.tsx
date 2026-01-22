import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData, useNavigation } from "@remix-run/react";
import {
  Page,
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Button,
  Divider,
  Banner,
  Collapsible,
  Box,
  Frame,
  Toast,
  Card,
  Layout,
} from "@shopify/polaris";
import { Modal, SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useCallback, useEffect } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@shopify/polaris-icons";
import { prisma } from "../db.server";

// Import centralized state hook
import { useDesignControlPanelState } from "../hooks/useDesignControlPanelState";

// Import extracted components
import { NavigationItem } from "../components/design-control-panel/NavigationItem";
import { SettingsPanel } from "../components/design-control-panel/settings";
import { PreviewPanel } from "../components/design-control-panel/preview";
import { ModalLayout } from "../components/design-control-panel/ModalLayout";

// Import configuration
import { DEFAULT_SETTINGS, mergeSettings } from "../components/design-control-panel/config";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;

  const productPageSettings = await prisma.designSettings.findUnique({
    where: { shopId_bundleType: { shopId, bundleType: "product_page" } }
  });

  const fullPageSettings = await prisma.designSettings.findUnique({
    where: { shopId_bundleType: { shopId, bundleType: "full_page" } }
  });


  // Use imported default settings and merge function
  const settings = {
    product_page: mergeSettings(productPageSettings, DEFAULT_SETTINGS.product_page),
    full_page: mergeSettings(fullPageSettings, DEFAULT_SETTINGS.full_page),
  };


  return json({
    shopId,
    settings,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    const shopId = session.shop;
    const formData = await request.json();

    const bundleType = formData.bundleType as "product_page" | "full_page";
    const settings = formData.settings;

    const footerSettings = {
      footerBgColor: settings.footerBgColor,
      footerTotalBgColor: settings.footerTotalBgColor,
      footerBorderRadius: settings.footerBorderRadius,
      footerPadding: settings.footerPadding,
      footerFinalPriceColor: settings.footerFinalPriceColor,
      footerFinalPriceFontSize: settings.footerFinalPriceFontSize,
      footerFinalPriceFontWeight: settings.footerFinalPriceFontWeight,
      footerStrikePriceColor: settings.footerStrikePriceColor,
      footerStrikeFontSize: settings.footerStrikeFontSize,
      footerStrikeFontWeight: settings.footerStrikeFontWeight,
      footerPriceVisibility: settings.footerPriceVisibility,
      footerBackButtonBgColor: settings.footerBackButtonBgColor,
      footerBackButtonTextColor: settings.footerBackButtonTextColor,
      footerBackButtonBorderColor: settings.footerBackButtonBorderColor,
      footerBackButtonBorderRadius: settings.footerBackButtonBorderRadius,
      footerNextButtonBgColor: settings.footerNextButtonBgColor,
      footerNextButtonTextColor: settings.footerNextButtonTextColor,
      footerNextButtonBorderColor: settings.footerNextButtonBorderColor,
      footerNextButtonBorderRadius: settings.footerNextButtonBorderRadius,
      footerDiscountTextVisibility: settings.footerDiscountTextVisibility,
      footerProgressBarFilledColor: settings.footerProgressBarFilledColor,
      footerProgressBarEmptyColor: settings.footerProgressBarEmptyColor,
    };

    const stepBarSettings = {
      stepNameFontColor: settings.stepNameFontColor,
      stepNameFontSize: settings.stepNameFontSize,
      completedStepCheckMarkColor: settings.completedStepCheckMarkColor,
      completedStepBgColor: settings.completedStepBgColor,
      completedStepCircleBorderColor: settings.completedStepCircleBorderColor,
      completedStepCircleBorderRadius: settings.completedStepCircleBorderRadius,
      incompleteStepBgColor: settings.incompleteStepBgColor,
      incompleteStepCircleStrokeColor: settings.incompleteStepCircleStrokeColor,
      incompleteStepCircleStrokeRadius: settings.incompleteStepCircleStrokeRadius,
      stepBarProgressFilledColor: settings.stepBarProgressFilledColor,
      stepBarProgressEmptyColor: settings.stepBarProgressEmptyColor,
      tabsActiveBgColor: settings.tabsActiveBgColor,
      tabsActiveTextColor: settings.tabsActiveTextColor,
      tabsInactiveBgColor: settings.tabsInactiveBgColor,
      tabsInactiveTextColor: settings.tabsInactiveTextColor,
      tabsBorderColor: settings.tabsBorderColor,
      tabsBorderRadius: settings.tabsBorderRadius,
    };

    const globalColorsSettings = {
      globalPrimaryButtonColor: settings.globalPrimaryButtonColor,
      globalButtonTextColor: settings.globalButtonTextColor,
      globalPrimaryTextColor: settings.globalPrimaryTextColor,
      globalSecondaryTextColor: settings.globalSecondaryTextColor,
      globalFooterBgColor: settings.globalFooterBgColor,
      globalFooterTextColor: settings.globalFooterTextColor,
    };

    const generalSettings = {
      // Empty State
      emptyStateCardBgColor: settings.emptyStateCardBgColor,
      emptyStateCardBorderColor: settings.emptyStateCardBorderColor,
      emptyStateTextColor: settings.emptyStateTextColor,
      emptyStateBorderStyle: settings.emptyStateBorderStyle,
      // Drawer
      drawerBgColor: settings.drawerBgColor,
      // Add to Cart Button
      addToCartButtonBgColor: settings.addToCartButtonBgColor,
      addToCartButtonTextColor: settings.addToCartButtonTextColor,
      addToCartButtonBorderRadius: settings.addToCartButtonBorderRadius,
      // Toasts
      toastBgColor: settings.toastBgColor,
      toastTextColor: settings.toastTextColor,
      // Bundle Design
      bundleBgColor: settings.bundleBgColor,
      footerScrollBarColor: settings.footerScrollBarColor,
      // Product Page Title
      productPageTitleFontColor: settings.productPageTitleFontColor,
      productPageTitleFontSize: settings.productPageTitleFontSize,
      // Bundle Upsell
      bundleUpsellButtonBgColor: settings.bundleUpsellButtonBgColor,
      bundleUpsellBorderColor: settings.bundleUpsellBorderColor,
      bundleUpsellTextColor: settings.bundleUpsellTextColor,
      // Filters
      filterIconColor: settings.filterIconColor,
      filterBgColor: settings.filterBgColor,
      filterTextColor: settings.filterTextColor,
      // Header Text
      conditionsTextColor: settings.conditionsTextColor,
      conditionsTextFontSize: settings.conditionsTextFontSize,
      discountTextColor: settings.discountTextColor,
      discountTextFontSize: settings.discountTextFontSize,
    };

    await prisma.designSettings.upsert({
      where: {
        shopId_bundleType: {
          shopId,
          bundleType,
        },
      },
      create: {
        shopId,
        bundleType,
        customCss: settings.customCss || null,
        productCardBgColor: settings.productCardBgColor,
        productCardFontColor: settings.productCardFontColor,
        productCardFontSize: settings.productCardFontSize,
        productCardFontWeight: settings.productCardFontWeight,
        productCardImageFit: settings.productCardImageFit,
        productCardsPerRow: settings.productCardsPerRow,
        productPriceVisibility: settings.productPriceVisibility,
        productPriceBgColor: settings.productPriceBgColor,
        productStrikePriceColor: settings.productStrikePriceColor,
        productStrikeFontSize: settings.productStrikeFontSize,
        productStrikeFontWeight: settings.productStrikeFontWeight,
        productFinalPriceColor: settings.productFinalPriceColor,
        productFinalPriceFontSize: settings.productFinalPriceFontSize,
        productFinalPriceFontWeight: settings.productFinalPriceFontWeight,
        buttonBgColor: settings.buttonBgColor,
        buttonTextColor: settings.buttonTextColor,
        buttonFontSize: settings.buttonFontSize,
        buttonFontWeight: settings.buttonFontWeight,
        buttonBorderRadius: settings.buttonBorderRadius,
        buttonHoverBgColor: settings.buttonHoverBgColor,
        buttonAddToCartText: settings.buttonAddToCartText,
        quantitySelectorBgColor: settings.quantitySelectorBgColor,
        quantitySelectorTextColor: settings.quantitySelectorTextColor,
        quantitySelectorFontSize: settings.quantitySelectorFontSize,
        quantitySelectorBorderRadius: settings.quantitySelectorBorderRadius,
        productCardWidth: settings.productCardWidth,
        productCardHeight: settings.productCardHeight,
        productCardSpacing: settings.productCardSpacing,
        productCardBorderRadius: settings.productCardBorderRadius,
        productCardPadding: settings.productCardPadding,
        productCardBorderWidth: settings.productCardBorderWidth,
        productCardBorderColor: settings.productCardBorderColor,
        productCardShadow: settings.productCardShadow,
        productCardHoverShadow: settings.productCardHoverShadow,
        productImageHeight: settings.productImageHeight,
        productImageBorderRadius: settings.productImageBorderRadius,
        productImageBgColor: settings.productImageBgColor,
        modalBgColor: settings.modalBgColor,
        modalBorderRadius: settings.modalBorderRadius,
        modalTitleFontSize: settings.modalTitleFontSize,
        modalTitleFontWeight: settings.modalTitleFontWeight,
        modalPriceFontSize: settings.modalPriceFontSize,
        modalVariantBorderRadius: settings.modalVariantBorderRadius,
        modalButtonBgColor: settings.modalButtonBgColor,
        modalButtonTextColor: settings.modalButtonTextColor,
        modalButtonBorderRadius: settings.modalButtonBorderRadius,
        globalColorsSettings: globalColorsSettings,
        footerSettings: footerSettings,
        stepBarSettings: stepBarSettings,
        generalSettings: generalSettings,
      },
      update: {
        customCss: settings.customCss || null,
        productCardBgColor: settings.productCardBgColor,
        productCardFontColor: settings.productCardFontColor,
        productCardFontSize: settings.productCardFontSize,
        productCardFontWeight: settings.productCardFontWeight,
        productCardImageFit: settings.productCardImageFit,
        productCardsPerRow: settings.productCardsPerRow,
        productPriceVisibility: settings.productPriceVisibility,
        productPriceBgColor: settings.productPriceBgColor,
        productStrikePriceColor: settings.productStrikePriceColor,
        productStrikeFontSize: settings.productStrikeFontSize,
        productStrikeFontWeight: settings.productStrikeFontWeight,
        productFinalPriceColor: settings.productFinalPriceColor,
        productFinalPriceFontSize: settings.productFinalPriceFontSize,
        productFinalPriceFontWeight: settings.productFinalPriceFontWeight,
        buttonBgColor: settings.buttonBgColor,
        buttonTextColor: settings.buttonTextColor,
        buttonFontSize: settings.buttonFontSize,
        buttonFontWeight: settings.buttonFontWeight,
        buttonBorderRadius: settings.buttonBorderRadius,
        buttonHoverBgColor: settings.buttonHoverBgColor,
        buttonAddToCartText: settings.buttonAddToCartText,
        quantitySelectorBgColor: settings.quantitySelectorBgColor,
        quantitySelectorTextColor: settings.quantitySelectorTextColor,
        quantitySelectorFontSize: settings.quantitySelectorFontSize,
        quantitySelectorBorderRadius: settings.quantitySelectorBorderRadius,
        productCardWidth: settings.productCardWidth,
        productCardHeight: settings.productCardHeight,
        productCardSpacing: settings.productCardSpacing,
        productCardBorderRadius: settings.productCardBorderRadius,
        productCardPadding: settings.productCardPadding,
        productCardBorderWidth: settings.productCardBorderWidth,
        productCardBorderColor: settings.productCardBorderColor,
        productCardShadow: settings.productCardShadow,
        productCardHoverShadow: settings.productCardHoverShadow,
        productImageHeight: settings.productImageHeight,
        productImageBorderRadius: settings.productImageBorderRadius,
        productImageBgColor: settings.productImageBgColor,
        modalBgColor: settings.modalBgColor,
        modalBorderRadius: settings.modalBorderRadius,
        modalTitleFontSize: settings.modalTitleFontSize,
        modalTitleFontWeight: settings.modalTitleFontWeight,
        modalPriceFontSize: settings.modalPriceFontSize,
        modalVariantBorderRadius: settings.modalVariantBorderRadius,
        modalButtonBgColor: settings.modalButtonBgColor,
        modalButtonTextColor: settings.modalButtonTextColor,
        modalButtonBorderRadius: settings.modalButtonBorderRadius,
        globalColorsSettings: globalColorsSettings,
        footerSettings: footerSettings,
        stepBarSettings: stepBarSettings,
        generalSettings: generalSettings,
      },
    });

    return json({ success: true, message: "Design settings saved successfully!" });
  } catch (error) {
    console.error("Error saving design settings:", error);
    return json({ success: false, message: "Failed to save design settings" }, { status: 500 });
  }
}

export default function DesignControlPanel() {
  const { settings } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const shopify = useAppBridge();

  // Use centralized state hook for all design settings
  const dcpState = useDesignControlPanelState(settings);

  // Destructure all values and state management functions from the hook
  const {
    // Bundle type
    selectedBundleType,
    setSelectedBundleType,

    // All current settings values
    settings: currentSettings,

    // Navigation
    expandedSection,
    activeSubSection,
    toggleSection,
    handleSubSectionClick,

    // State management
    hasUnsavedChanges,
    handleDiscard,
    getSettingsForSave,
    markAsSaved,

    // Toast state
    toastActive,
    toastMessage,
    toastError,
    setToastActive,
    setToastMessage,
    setToastError,

    // Custom CSS help
    customCssHelpOpen,
    setCustomCssHelpOpen,

    // Update function
    updateSetting,
  } = dcpState;

  // Extract only the values needed in this component (the rest are passed via currentSettings)
  const { customCss } = currentSettings;

  // Create setter for customCss (the only one used directly in this component)
  const setCustomCss = (value: string) => updateSetting("customCss", value);

  // Show/hide save bar based on unsaved changes (from hook)
  useEffect(() => {
    if (hasUnsavedChanges) {
      shopify.saveBar.show('dcp-save-bar');
    } else {
      shopify.saveBar.hide('dcp-save-bar');
    }
  }, [hasUnsavedChanges, shopify]);

  // Modal handlers
  const handleOpenModal = useCallback(() => {
    shopify.modal.show('dcp-customization-modal');
  }, [shopify]);

  const handleCloseModal = useCallback(() => {
    // Discard changes if there are any unsaved changes
    if (hasUnsavedChanges) {
      handleDiscard();
    }
    shopify.modal.hide('dcp-customization-modal');
  }, [shopify, hasUnsavedChanges, handleDiscard]);

  // Handle action data (form submission response)
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  useEffect(() => {
    if (actionData) {
      setToastActive(true);
      setToastMessage(actionData.message);
      setToastError(!actionData.success);

      // Hide save bar and mark as saved after successful save
      if (actionData.success) {
        shopify.saveBar.hide('dcp-save-bar');
        markAsSaved();
      }
    }
  }, [actionData, shopify, markAsSaved, setToastActive, setToastMessage, setToastError]);

  // Save settings using hook's getSettingsForSave
  const handleSaveSettings = useCallback(() => {
    const settingsToSave = getSettingsForSave();

    submit(
      {
        bundleType: selectedBundleType,
        settings: settingsToSave,
      },
      {
        method: "post",
        encType: "application/json",
      }
    );
  }, [selectedBundleType, getSettingsForSave, submit]);


  return (
    <Frame>
      <Page
        title="Design Control Panel"
        subtitle="Customize the appearance of your bundles"
        backAction={{
          content: "Go to Bundles",
          url: "/app/dashboard",
        }}
        primaryAction={{
          content: "Open Customisations",
          onAction: handleOpenModal,
        }}
      >
        {/* App Bridge Modal with max variant for full-screen */}
        <Modal id="dcp-customization-modal" variant="max">
          <div style={{ display: "flex", height: "100vh", maxWidth: "100%", overflowX: "hidden" }}>
            {/* Left Sidebar - Navigation */}
            <div
              style={{
                width: "220px",
                minWidth: "220px",
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

              {/* Global Colors Section */}
              <NavigationItem
                label="Global Colors"
                sectionKey="globalColors"
                onClick={() => handleSubSectionClick("globalColors")}
                isExpanded={expandedSection === "globalColors"}
                isActive={activeSubSection === "globalColors"}
              />

              <Divider />

              {/* Product Card Section */}
              <NavigationItem
                label="Product Card"
                sectionKey="productCard"
                hasChildren
                onClick={() => toggleSection("productCard")}
                isExpanded={expandedSection === "productCard"}
                isActive={false}
              />
              <Collapsible open={expandedSection === "productCard"} id="productCard-collapsible">
                <NavigationItem
                  label="Product Card"
                  sectionKey="productCard"
                  isChild
                  onClick={() => handleSubSectionClick("productCard")}
                  isActive={activeSubSection === "productCard"}
                />
                <NavigationItem
                  label="Product Card Typography"
                  sectionKey="productCardTypography"
                  isChild
                  onClick={() => handleSubSectionClick("productCardTypography")}
                  isActive={activeSubSection === "productCardTypography"}
                />
                <NavigationItem
                  label="Button"
                  sectionKey="button"
                  isChild
                  onClick={() => handleSubSectionClick("button")}
                  isActive={activeSubSection === "button"}
                />
                <NavigationItem
                  label="Quantity & Variant Selector"
                  sectionKey="quantityVariantSelector"
                  isChild
                  onClick={() => handleSubSectionClick("quantityVariantSelector")}
                  isActive={activeSubSection === "quantityVariantSelector"}
                />
              </Collapsible>

              {/* Bundle Footer Section */}
              <NavigationItem
                label="Bundle Footer"
                sectionKey="bundleFooter"
                hasChildren
                onClick={() => toggleSection("bundleFooter")}
                isExpanded={expandedSection === "bundleFooter"}
                isActive={false}
              />
              <Collapsible open={expandedSection === "bundleFooter"} id="bundleFooter-collapsible">
                <NavigationItem
                  label="Footer"
                  sectionKey="footer"
                  isChild
                  onClick={() => handleSubSectionClick("footer")}
                  isActive={activeSubSection === "footer"}
                />
                <NavigationItem
                  label="Price"
                  sectionKey="footerPrice"
                  isChild
                  onClick={() => handleSubSectionClick("footerPrice")}
                  isActive={activeSubSection === "footerPrice"}
                />
                <NavigationItem
                  label="Button"
                  sectionKey="footerButton"
                  isChild
                  onClick={() => handleSubSectionClick("footerButton")}
                  isActive={activeSubSection === "footerButton"}
                />
                <NavigationItem
                  label="Discount Text & Progress Bar"
                  sectionKey="footerDiscountProgress"
                  isChild
                  onClick={() => handleSubSectionClick("footerDiscountProgress")}
                  isActive={activeSubSection === "footerDiscountProgress"}
                />
              </Collapsible>

              {/* Bundle Header Section */}
              <NavigationItem
                label="Bundle Header"
                sectionKey="bundleHeader"
                hasChildren
                onClick={() => toggleSection("bundleHeader")}
                isExpanded={expandedSection === "bundleHeader"}
                isActive={false}
              />
              <Collapsible open={expandedSection === "bundleHeader"} id="bundleHeader-collapsible">
                <NavigationItem
                  label="Tabs"
                  sectionKey="headerTabs"
                  isChild
                  onClick={() => handleSubSectionClick("headerTabs")}
                  isActive={activeSubSection === "headerTabs"}
                />
                <NavigationItem
                  label="Header Text"
                  sectionKey="headerText"
                  isChild
                  onClick={() => handleSubSectionClick("headerText")}
                  isActive={activeSubSection === "headerText"}
                />
              </Collapsible>

              {/* General Section */}
              <NavigationItem
                label="General"
                sectionKey="general"
                hasChildren
                onClick={() => toggleSection("general")}
                isExpanded={expandedSection === "general"}
                isActive={false}
              />
              <Collapsible open={expandedSection === "general"} id="general-collapsible">
                <NavigationItem
                  label="Empty State"
                  sectionKey="emptyState"
                  isChild
                  onClick={() => handleSubSectionClick("emptyState")}
                  isActive={activeSubSection === "emptyState"}
                />
                <NavigationItem
                  label="Add to Cart Button"
                  sectionKey="addToCartButton"
                  isChild
                  onClick={() => handleSubSectionClick("addToCartButton")}
                  isActive={activeSubSection === "addToCartButton"}
                />
                <NavigationItem
                  label="Toasts"
                  sectionKey="toasts"
                  isChild
                  onClick={() => handleSubSectionClick("toasts")}
                  isActive={activeSubSection === "toasts"}
                />
              </Collapsible>
            </div>

            {/* Right Side - Visual Preview + Settings */}
            <div style={{ flex: 1, display: "flex", overflowY: "auto", minWidth: 0 }}>
              {/* Center - Visual Preview */}
              <div
                style={{
                  flex: 1,
                  padding: "20px",
                  backgroundColor: "#F4F4F4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 0,
                  overflowX: "hidden",
                }}
              >
                {/* Preview with Arrow Overlay */}
                <div style={{ position: "relative", display: "inline-block" }}>
                  <PreviewPanel activeSubSection={activeSubSection} settings={currentSettings} />
                </div>
              </div>

              {/* Right Panel - Settings Controls */}
              <div
                style={{
                  width: "240px",
                  minWidth: "240px",
                  borderLeft: "1px solid #D9D9D9",
                  padding: "20px",
                  backgroundColor: "#FFFFFF",
                  overflowY: "auto",
                }}
              >
                <SettingsPanel
                  activeSubSection={activeSubSection}
                  settings={currentSettings}
                  onUpdate={updateSetting}
                  customCssHelpOpen={customCssHelpOpen}
                  setCustomCssHelpOpen={setCustomCssHelpOpen}
                />
              </div>
            </div>
          </div>
        </Modal>

        {/* Custom CSS Section - Outside Modal for Power Users */}
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
                    onClick={() => setCustomCssHelpOpen(!customCssHelpOpen)}
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
                  onChange={setCustomCss}
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
                    onClick={handleSaveSettings}
                    loading={isLoading}
                  >
                    Save Custom CSS
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* App Bridge Save Bar */}
        <SaveBar id="dcp-save-bar">
          <button
            variant="primary"
            onClick={handleSaveSettings}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleDiscard}
            disabled={isLoading}
          >
            Discard
          </button>
        </SaveBar>
      </Page>
      {toastActive && (
        <Toast
          content={toastMessage}
          onDismiss={() => setToastActive(false)}
          error={toastError}
        />
      )}
    </Frame>
  );
}
