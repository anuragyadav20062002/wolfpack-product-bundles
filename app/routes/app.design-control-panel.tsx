import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData, useNavigation } from "@remix-run/react";
import {
  Page,
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
  Frame,
  Toast,
} from "@shopify/polaris";
import { Modal, SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@shopify/polaris-icons";
import { prisma } from "../db.server";

// Import extracted components
import { ColorPicker } from "../components/design-control-panel/common/ColorPicker";
import { ArrowLabel } from "../components/design-control-panel/common/ArrowLabel";
import { NavigationItem } from "../components/design-control-panel/NavigationItem";
import { ProductCardPreview } from "../components/design-control-panel/preview/ProductCardPreview";
import { BundleFooterPreview } from "../components/design-control-panel/preview/BundleFooterPreview";
import { BundleHeaderPreview } from "../components/design-control-panel/preview/BundleHeaderPreview";
import { GeneralPreview } from "../components/design-control-panel/preview/GeneralPreview";
import {
  BUNDLE_TYPE_OPTIONS,
  IMAGE_FIT_OPTIONS,
  CARDS_PER_ROW_OPTIONS
} from "../components/design-control-panel/constants";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;

  const productPageSettings = await prisma.designSettings.findUnique({
    where: { shopId_bundleType: { shopId, bundleType: "product_page" } }
  });

  const fullPageSettings = await prisma.designSettings.findUnique({
    where: { shopId_bundleType: { shopId, bundleType: "full_page" } }
  });

  const defaultSettings = {
    product_page: {
      // Global Colors
      globalPrimaryButtonColor: "#000000",
      globalButtonTextColor: "#FFFFFF",
      globalPrimaryTextColor: "#000000",
      globalSecondaryTextColor: "#6B7280",
      globalFooterBgColor: "#FFFFFF",
      globalFooterTextColor: "#000000",
      // Product Card
      productCardBgColor: "#FFFFFF",
      productCardFontColor: "#000000",
      productCardFontSize: 16,
      productCardFontWeight: 400,
      productCardImageFit: "cover",
      productCardsPerRow: 3,
      productTitleVisibility: true,
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
      buttonAddToCartText: "Add to bundle",
      // Quantity Selector
      quantitySelectorBgColor: "#000000",
      quantitySelectorTextColor: "#FFFFFF",
      quantitySelectorFontSize: 16,
      quantitySelectorBorderRadius: 8,
      // Variant Selector
      variantSelectorBgColor: "#FFFFFF",
      variantSelectorTextColor: "#000000",
      variantSelectorBorderRadius: 8,
      // Bundle Footer
      footerBgColor: "#FFFFFF",
      footerTotalBgColor: "#F6F6F6",
      footerBorderRadius: 8,
      // Bundle Header - Tabs
      headerTabActiveBgColor: "#000000",
      headerTabActiveTextColor: "#FFFFFF",
      headerTabInactiveBgColor: "#FFFFFF",
      headerTabInactiveTextColor: "#000000",
      headerTabRadius: 67,
      // Bundle Header - Header Text
      conditionsTextColor: "#FFFFFF",
      conditionsTextFontSize: 16,
      discountTextColor: "#000000",
      discountTextFontSize: 14,
      footerPadding: 16,
      // Footer Price
      footerFinalPriceColor: "#000000",
      footerFinalPriceFontSize: 18,
      footerFinalPriceFontWeight: 700,
      footerStrikePriceColor: "#8D8D8D",
      footerStrikeFontSize: 14,
      footerStrikeFontWeight: 400,
      footerPriceVisibility: true,
      // Footer Buttons
      footerBackButtonBgColor: "#FFFFFF",
      footerBackButtonTextColor: "#000000",
      footerBackButtonBorderColor: "#E3E3E3",
      footerBackButtonBorderRadius: 8,
      footerNextButtonBgColor: "#000000",
      footerNextButtonTextColor: "#FFFFFF",
      footerNextButtonBorderColor: "#000000",
      footerNextButtonBorderRadius: 8,
      // Discount & Progress Bar
      footerDiscountTextVisibility: true,
      footerProgressBarFilledColor: "#000000",
      footerProgressBarEmptyColor: "#E3E3E3",
      // Bundle Step Bar - Step Name
      stepNameFontColor: "#000000",
      stepNameFontSize: 16,
      // Completed Step
      completedStepCheckMarkColor: "#FFFFFF",
      completedStepBgColor: "#000000",
      completedStepCircleBorderColor: "#000000",
      completedStepCircleBorderRadius: 50,
      // Incomplete Step
      incompleteStepBgColor: "#FFFFFF",
      incompleteStepCircleStrokeColor: "#000000",
      incompleteStepCircleStrokeRadius: 50,
      // Step Bar Progress Bar
      stepBarProgressFilledColor: "#000000",
      stepBarProgressEmptyColor: "#C6C6C6",
      // Tabs
      tabsActiveBgColor: "#000000",
      tabsActiveTextColor: "#FFFFFF",
      tabsInactiveBgColor: "#FFFFFF",
      tabsInactiveTextColor: "#000000",
      tabsBorderColor: "#000000",
      tabsBorderRadius: 8,
      // General Section
      // Empty State
      emptyStateCardBgColor: "#FFFFFF",
      emptyStateCardBorderColor: "#F6F6F6",
      emptyStateTextColor: "#9CA3AF",
      emptyStateBorderStyle: "dashed",
      // Drawer
      drawerBgColor: "#FFFFFF",
      // Add to Cart Button
      addToCartButtonBgColor: "#000000",
      addToCartButtonTextColor: "#FFFFFF",
      addToCartButtonBorderRadius: 67,
      // Toasts
      toastBgColor: "#000000",
      toastTextColor: "#FFFFFF",
      // Bundle Design
      bundleBgColor: "#FFFFFF",
      footerScrollBarColor: "#000000",
      // Product Page Title
      productPageTitleFontColor: "#000000",
      productPageTitleFontSize: 24,
      // Bundle Upsell
      bundleUpsellButtonBgColor: "#000000",
      bundleUpsellBorderColor: "#000000",
      bundleUpsellTextColor: "#FFFFFF",
      // Filters
      filterIconColor: "#000000",
      filterBgColor: "#FFFFFF",
      filterTextColor: "#000000",
    },
    full_page: {
      // Global Colors
      globalPrimaryButtonColor: "#7132FF",
      globalButtonTextColor: "#FFFFFF",
      globalPrimaryTextColor: "#111827",
      globalSecondaryTextColor: "#9CA3AF",
      globalFooterBgColor: "#F9FAFB",
      globalFooterTextColor: "#111827",
      // Default settings for full_page (can be different from product_page)
      productCardBgColor: "#F9FAFB",
      productCardFontColor: "#111827",
      productCardFontSize: 18,
      productCardFontWeight: 500,
      productCardImageFit: "contain",
      productCardsPerRow: 4,
      productTitleVisibility: true,
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
      buttonAddToCartText: "Add to bundle",
      quantitySelectorBgColor: "#7132FF",
      quantitySelectorTextColor: "#FFFFFF",
      quantitySelectorFontSize: 18,
      quantitySelectorBorderRadius: 12,
      // Variant Selector
      variantSelectorBgColor: "#FFFFFF",
      variantSelectorTextColor: "#111827",
      variantSelectorBorderRadius: 12,
      // Bundle Footer
      footerBgColor: "#FFFFFF",
      footerTotalBgColor: "#F9FAFB",
      footerBorderRadius: 12,
      // Bundle Header - Tabs
      headerTabActiveBgColor: "#000000",
      headerTabActiveTextColor: "#FFFFFF",
      headerTabInactiveBgColor: "#FFFFFF",
      headerTabInactiveTextColor: "#000000",
      headerTabRadius: 67,
      // Bundle Header - Header Text
      conditionsTextColor: "#FFFFFF",
      conditionsTextFontSize: 16,
      discountTextColor: "#111827",
      discountTextFontSize: 14,
      footerPadding: 20,
      // Footer Price
      footerFinalPriceColor: "#111827",
      footerFinalPriceFontSize: 20,
      footerFinalPriceFontWeight: 700,
      footerStrikePriceColor: "#9CA3AF",
      footerStrikeFontSize: 16,
      footerStrikeFontWeight: 400,
      footerPriceVisibility: true,
      // Footer Buttons
      footerBackButtonBgColor: "#FFFFFF",
      footerBackButtonTextColor: "#111827",
      footerBackButtonBorderColor: "#E5E7EB",
      footerBackButtonBorderRadius: 12,
      footerNextButtonBgColor: "#7132FF",
      footerNextButtonTextColor: "#FFFFFF",
      footerNextButtonBorderColor: "#7132FF",
      footerNextButtonBorderRadius: 12,
      // Discount & Progress Bar
      footerDiscountTextVisibility: true,
      footerProgressBarFilledColor: "#7132FF",
      footerProgressBarEmptyColor: "#E5E7EB",
      // Bundle Step Bar - Step Name
      stepNameFontColor: "#111827",
      stepNameFontSize: 18,
      // Completed Step
      completedStepCheckMarkColor: "#FFFFFF",
      completedStepBgColor: "#7132FF",
      completedStepCircleBorderColor: "#7132FF",
      completedStepCircleBorderRadius: 50,
      // Incomplete Step
      incompleteStepBgColor: "#F9FAFB",
      incompleteStepCircleStrokeColor: "#9CA3AF",
      incompleteStepCircleStrokeRadius: 50,
      // Step Bar Progress Bar
      stepBarProgressFilledColor: "#7132FF",
      stepBarProgressEmptyColor: "#E5E7EB",
      // Tabs
      tabsActiveBgColor: "#7132FF",
      tabsActiveTextColor: "#FFFFFF",
      tabsInactiveBgColor: "#F9FAFB",
      tabsInactiveTextColor: "#111827",
      tabsBorderColor: "#E5E7EB",
      tabsBorderRadius: 12,
      // General Section
      // Empty State
      emptyStateCardBgColor: "#F9FAFB",
      emptyStateCardBorderColor: "#E5E7EB",
      emptyStateTextColor: "#9CA3AF",
      emptyStateBorderStyle: "dashed",
      // Drawer
      drawerBgColor: "#F9FAFB",
      // Add to Cart Button
      addToCartButtonBgColor: "#7132FF",
      addToCartButtonTextColor: "#FFFFFF",
      addToCartButtonBorderRadius: 67,
      // Toasts
      toastBgColor: "#7132FF",
      toastTextColor: "#FFFFFF",
      // Bundle Design
      bundleBgColor: "#F9FAFB",
      footerScrollBarColor: "#7132FF",
      // Product Page Title
      productPageTitleFontColor: "#111827",
      productPageTitleFontSize: 28,
      // Bundle Upsell
      bundleUpsellButtonBgColor: "#7132FF",
      bundleUpsellBorderColor: "#7132FF",
      bundleUpsellTextColor: "#FFFFFF",
      // Filters
      filterIconColor: "#111827",
      filterBgColor: "#F9FAFB",
      filterTextColor: "#111827",
    },
  };

  const mergeSettings = (dbSettings: any, defaults: any) => {
    if (!dbSettings) return defaults;

    const globalColorsSettings = dbSettings.globalColorsSettings as any || {};
    const footerSettings = dbSettings.footerSettings as any || {};
    const stepBarSettings = dbSettings.stepBarSettings as any || {};
    const generalSettings = dbSettings.generalSettings as any || {};

    return {
      ...defaults,
      productCardBgColor: dbSettings.productCardBgColor || defaults.productCardBgColor,
      productCardFontColor: dbSettings.productCardFontColor || defaults.productCardFontColor,
      productCardFontSize: dbSettings.productCardFontSize || defaults.productCardFontSize,
      productCardFontWeight: dbSettings.productCardFontWeight || defaults.productCardFontWeight,
      productCardImageFit: dbSettings.productCardImageFit || defaults.productCardImageFit,
      productCardsPerRow: dbSettings.productCardsPerRow || defaults.productCardsPerRow,
      productPriceVisibility: dbSettings.productPriceVisibility !== undefined ? dbSettings.productPriceVisibility : defaults.productPriceVisibility,
      productStrikePriceColor: dbSettings.productStrikePriceColor || defaults.productStrikePriceColor,
      productStrikeFontSize: dbSettings.productStrikeFontSize || defaults.productStrikeFontSize,
      productStrikeFontWeight: dbSettings.productStrikeFontWeight || defaults.productStrikeFontWeight,
      productFinalPriceColor: dbSettings.productFinalPriceColor || defaults.productFinalPriceColor,
      productFinalPriceFontSize: dbSettings.productFinalPriceFontSize || defaults.productFinalPriceFontSize,
      productFinalPriceFontWeight: dbSettings.productFinalPriceFontWeight || defaults.productFinalPriceFontWeight,
      buttonBgColor: dbSettings.buttonBgColor || defaults.buttonBgColor,
      buttonTextColor: dbSettings.buttonTextColor || defaults.buttonTextColor,
      buttonFontSize: dbSettings.buttonFontSize || defaults.buttonFontSize,
      buttonFontWeight: dbSettings.buttonFontWeight || defaults.buttonFontWeight,
      buttonBorderRadius: dbSettings.buttonBorderRadius || defaults.buttonBorderRadius,
      buttonHoverBgColor: dbSettings.buttonHoverBgColor || defaults.buttonHoverBgColor,
      buttonAddToCartText: dbSettings.buttonAddToCartText || defaults.buttonAddToCartText,
      quantitySelectorBgColor: dbSettings.quantitySelectorBgColor || defaults.quantitySelectorBgColor,
      quantitySelectorTextColor: dbSettings.quantitySelectorTextColor || defaults.quantitySelectorTextColor,
      quantitySelectorFontSize: dbSettings.quantitySelectorFontSize || defaults.quantitySelectorFontSize,
      quantitySelectorBorderRadius: dbSettings.quantitySelectorBorderRadius || defaults.quantitySelectorBorderRadius,
      ...globalColorsSettings,
      ...footerSettings,
      ...stepBarSettings,
      ...generalSettings,
    };
  };

  const settings = {
    product_page: mergeSettings(productPageSettings, defaultSettings.product_page),
    full_page: mergeSettings(fullPageSettings, defaultSettings.full_page),
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
        productCardBgColor: settings.productCardBgColor,
        productCardFontColor: settings.productCardFontColor,
        productCardFontSize: settings.productCardFontSize,
        productCardFontWeight: settings.productCardFontWeight,
        productCardImageFit: settings.productCardImageFit,
        productCardsPerRow: settings.productCardsPerRow,
        productPriceVisibility: settings.productPriceVisibility,
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
        globalColorsSettings: globalColorsSettings,
        footerSettings: footerSettings,
        stepBarSettings: stepBarSettings,
        generalSettings: generalSettings,
      },
      update: {
        productCardBgColor: settings.productCardBgColor,
        productCardFontColor: settings.productCardFontColor,
        productCardFontSize: settings.productCardFontSize,
        productCardFontWeight: settings.productCardFontWeight,
        productCardImageFit: settings.productCardImageFit,
        productCardsPerRow: settings.productCardsPerRow,
        productPriceVisibility: settings.productPriceVisibility,
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

  // Bundle type state
  const [selectedBundleType, setSelectedBundleType] = useState<"product_page" | "full_page">("product_page");

  // Current settings based on selected bundle type
  const currentSettings = settings[selectedBundleType];

  // Navigation state
  const [expandedSection, setExpandedSection] = useState<string | null>("productCard");
  const [activeSubSection, setActiveSubSection] = useState<string>("productCard");

  // Global Colors Section
  const [globalPrimaryButtonColor, setGlobalPrimaryButtonColor] = useState(currentSettings.globalPrimaryButtonColor || "#000000");
  const [globalButtonTextColor, setGlobalButtonTextColor] = useState(currentSettings.globalButtonTextColor || "#FFFFFF");
  const [globalPrimaryTextColor, setGlobalPrimaryTextColor] = useState(currentSettings.globalPrimaryTextColor || "#000000");
  const [globalSecondaryTextColor, setGlobalSecondaryTextColor] = useState(currentSettings.globalSecondaryTextColor || "#6B7280");
  const [globalFooterBgColor, setGlobalFooterBgColor] = useState(currentSettings.globalFooterBgColor || "#FFFFFF");
  const [globalFooterTextColor, setGlobalFooterTextColor] = useState(currentSettings.globalFooterTextColor || "#000000");

  // Form state - Product Card Section
  const [productCardBgColor, setProductCardBgColor] = useState(currentSettings.productCardBgColor);
  const [productCardFontColor, setProductCardFontColor] = useState(currentSettings.productCardFontColor);
  const [productCardFontSize, setProductCardFontSize] = useState(currentSettings.productCardFontSize);
  const [productCardFontWeight, setProductCardFontWeight] = useState(currentSettings.productCardFontWeight);
  const [productCardImageFit, setProductCardImageFit] = useState(currentSettings.productCardImageFit);
  const [productCardsPerRow, setProductCardsPerRow] = useState(String(currentSettings.productCardsPerRow));
  const [productTitleVisibility, setProductTitleVisibility] = useState(currentSettings.productTitleVisibility);
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

  // Variant Selector Section
  const [variantSelectorBgColor, setVariantSelectorBgColor] = useState(currentSettings.variantSelectorBgColor);
  const [variantSelectorTextColor, setVariantSelectorTextColor] = useState(currentSettings.variantSelectorTextColor);
  const [variantSelectorBorderRadius, setVariantSelectorBorderRadius] = useState(currentSettings.variantSelectorBorderRadius);

  // Bundle Footer Section
  const [footerBgColor, setFooterBgColor] = useState(currentSettings.footerBgColor);
  const [footerTotalBgColor, setFooterTotalBgColor] = useState(currentSettings.footerTotalBgColor);
  const [footerBorderRadius, setFooterBorderRadius] = useState(currentSettings.footerBorderRadius);
  const [footerPadding, setFooterPadding] = useState(currentSettings.footerPadding);

  // Footer Price
  const [footerFinalPriceColor, setFooterFinalPriceColor] = useState(currentSettings.footerFinalPriceColor);
  const [footerFinalPriceFontSize, setFooterFinalPriceFontSize] = useState(currentSettings.footerFinalPriceFontSize);
  const [footerFinalPriceFontWeight, setFooterFinalPriceFontWeight] = useState(currentSettings.footerFinalPriceFontWeight);
  const [footerStrikePriceColor, setFooterStrikePriceColor] = useState(currentSettings.footerStrikePriceColor);
  const [footerStrikeFontSize, setFooterStrikeFontSize] = useState(currentSettings.footerStrikeFontSize);
  const [footerStrikeFontWeight, setFooterStrikeFontWeight] = useState(currentSettings.footerStrikeFontWeight);
  const [footerPriceVisibility, setFooterPriceVisibility] = useState(currentSettings.footerPriceVisibility);

  // Footer Buttons
  const [footerBackButtonBgColor, setFooterBackButtonBgColor] = useState(currentSettings.footerBackButtonBgColor);
  const [footerBackButtonTextColor, setFooterBackButtonTextColor] = useState(currentSettings.footerBackButtonTextColor);
  const [footerBackButtonBorderColor, setFooterBackButtonBorderColor] = useState(currentSettings.footerBackButtonBorderColor);
  const [footerBackButtonBorderRadius, setFooterBackButtonBorderRadius] = useState(currentSettings.footerBackButtonBorderRadius);
  const [footerNextButtonBgColor, setFooterNextButtonBgColor] = useState(currentSettings.footerNextButtonBgColor);
  const [footerNextButtonTextColor, setFooterNextButtonTextColor] = useState(currentSettings.footerNextButtonTextColor);
  const [footerNextButtonBorderColor, setFooterNextButtonBorderColor] = useState(currentSettings.footerNextButtonBorderColor);
  const [footerNextButtonBorderRadius, setFooterNextButtonBorderRadius] = useState(currentSettings.footerNextButtonBorderRadius);

  // Discount & Progress Bar
  const [footerDiscountTextVisibility, setFooterDiscountTextVisibility] = useState(currentSettings.footerDiscountTextVisibility);
  const [footerProgressBarFilledColor, setFooterProgressBarFilledColor] = useState(currentSettings.footerProgressBarFilledColor);
  const [footerProgressBarEmptyColor, setFooterProgressBarEmptyColor] = useState(currentSettings.footerProgressBarEmptyColor);

  // Bundle Header Section
  // Tabs
  const [headerTabActiveBgColor, setHeaderTabActiveBgColor] = useState(currentSettings.headerTabActiveBgColor || "#000000");
  const [headerTabActiveTextColor, setHeaderTabActiveTextColor] = useState(currentSettings.headerTabActiveTextColor || "#FFFFFF");
  const [headerTabInactiveBgColor, setHeaderTabInactiveBgColor] = useState(currentSettings.headerTabInactiveBgColor || "#FFFFFF");
  const [headerTabInactiveTextColor, setHeaderTabInactiveTextColor] = useState(currentSettings.headerTabInactiveTextColor || "#000000");
  const [headerTabRadius, setHeaderTabRadius] = useState(currentSettings.headerTabRadius || 67);
  // Header Text
  const [conditionsTextColor, setConditionsTextColor] = useState(currentSettings.conditionsTextColor || "#FFFFFF");
  const [conditionsTextFontSize, setConditionsTextFontSize] = useState(currentSettings.conditionsTextFontSize || 16);
  const [discountTextColor, setDiscountTextColor] = useState(currentSettings.discountTextColor || "#000000");
  const [discountTextFontSize, setDiscountTextFontSize] = useState(currentSettings.discountTextFontSize || 14);

  // General Section
  // Empty State
  const [emptyStateCardBgColor, setEmptyStateCardBgColor] = useState(currentSettings.emptyStateCardBgColor || "#FFFFFF");
  const [emptyStateCardBorderColor, setEmptyStateCardBorderColor] = useState(currentSettings.emptyStateCardBorderColor || "#F6F6F6");
  const [emptyStateTextColor, setEmptyStateTextColor] = useState(currentSettings.emptyStateTextColor || "#9CA3AF");
  const [emptyStateBorderStyle, setEmptyStateBorderStyle] = useState(currentSettings.emptyStateBorderStyle || "dashed");
  // Drawer
  const [drawerBgColor, setDrawerBgColor] = useState(currentSettings.drawerBgColor || "#FFFFFF");
  // Add to Cart Button
  const [addToCartButtonBgColor, setAddToCartButtonBgColor] = useState(currentSettings.addToCartButtonBgColor || "#000000");
  const [addToCartButtonTextColor, setAddToCartButtonTextColor] = useState(currentSettings.addToCartButtonTextColor || "#FFFFFF");
  const [addToCartButtonBorderRadius, setAddToCartButtonBorderRadius] = useState(currentSettings.addToCartButtonBorderRadius || 67);
  // Toasts
  const [toastBgColor, setToastBgColor] = useState(currentSettings.toastBgColor || "#000000");
  const [toastTextColor, setToastTextColor] = useState(currentSettings.toastTextColor || "#FFFFFF");

  // Bundle Step Bar Section
  const [stepNameFontColor, setStepNameFontColor] = useState(currentSettings.stepNameFontColor || "#000000");
  const [stepNameFontSize, setStepNameFontSize] = useState(currentSettings.stepNameFontSize || 16);
  const [completedStepCheckMarkColor, setCompletedStepCheckMarkColor] = useState(currentSettings.completedStepCheckMarkColor || "#FFFFFF");
  const [completedStepBgColor, setCompletedStepBgColor] = useState(currentSettings.completedStepBgColor || "#000000");
  const [completedStepCircleBorderColor, setCompletedStepCircleBorderColor] = useState(currentSettings.completedStepCircleBorderColor || "#000000");
  const [completedStepCircleBorderRadius, setCompletedStepCircleBorderRadius] = useState(currentSettings.completedStepCircleBorderRadius || 50);
  const [incompleteStepBgColor, setIncompleteStepBgColor] = useState(currentSettings.incompleteStepBgColor || "#FFFFFF");
  const [incompleteStepCircleStrokeColor, setIncompleteStepCircleStrokeColor] = useState(currentSettings.incompleteStepCircleStrokeColor || "#000000");
  const [incompleteStepCircleStrokeRadius, setIncompleteStepCircleStrokeRadius] = useState(currentSettings.incompleteStepCircleStrokeRadius || 50);
  const [stepBarProgressFilledColor, setStepBarProgressFilledColor] = useState(currentSettings.stepBarProgressFilledColor || "#000000");
  const [stepBarProgressEmptyColor, setStepBarProgressEmptyColor] = useState(currentSettings.stepBarProgressEmptyColor || "#C6C6C6");

  // Tabs Section
  const [tabsActiveBgColor, setTabsActiveBgColor] = useState(currentSettings.tabsActiveBgColor || "#000000");
  const [tabsActiveTextColor, setTabsActiveTextColor] = useState(currentSettings.tabsActiveTextColor || "#FFFFFF");
  const [tabsInactiveBgColor, setTabsInactiveBgColor] = useState(currentSettings.tabsInactiveBgColor || "#FFFFFF");
  const [tabsInactiveTextColor, setTabsInactiveTextColor] = useState(currentSettings.tabsInactiveTextColor || "#000000");
  const [tabsBorderColor, setTabsBorderColor] = useState(currentSettings.tabsBorderColor || "#000000");
  const [tabsBorderRadius, setTabsBorderRadius] = useState(currentSettings.tabsBorderRadius || 8);

  // General Section - Additional Settings
  const [bundleBgColor, setBundleBgColor] = useState(currentSettings.bundleBgColor || "#FFFFFF");
  const [footerScrollBarColor, setFooterScrollBarColor] = useState(currentSettings.footerScrollBarColor || "#000000");
  const [productPageTitleFontColor, setProductPageTitleFontColor] = useState(currentSettings.productPageTitleFontColor || "#000000");
  const [productPageTitleFontSize, setProductPageTitleFontSize] = useState(currentSettings.productPageTitleFontSize || 24);
  const [bundleUpsellButtonBgColor, setBundleUpsellButtonBgColor] = useState(currentSettings.bundleUpsellButtonBgColor || "#000000");
  const [bundleUpsellBorderColor, setBundleUpsellBorderColor] = useState(currentSettings.bundleUpsellBorderColor || "#000000");
  const [bundleUpsellTextColor, setBundleUpsellTextColor] = useState(currentSettings.bundleUpsellTextColor || "#FFFFFF");
  const [filterIconColor, setFilterIconColor] = useState(currentSettings.filterIconColor || "#000000");
  const [filterBgColor, setFilterBgColor] = useState(currentSettings.filterBgColor || "#FFFFFF");
  const [filterTextColor, setFilterTextColor] = useState(currentSettings.filterTextColor || "#000000");

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
    setFooterBgColor(newSettings.footerBgColor);
    setFooterTotalBgColor(newSettings.footerTotalBgColor);
    setFooterBorderRadius(newSettings.footerBorderRadius);
    setFooterPadding(newSettings.footerPadding);
    setFooterFinalPriceColor(newSettings.footerFinalPriceColor);
    setFooterFinalPriceFontSize(newSettings.footerFinalPriceFontSize);
    setFooterFinalPriceFontWeight(newSettings.footerFinalPriceFontWeight);
    setFooterStrikePriceColor(newSettings.footerStrikePriceColor);
    setFooterStrikeFontSize(newSettings.footerStrikeFontSize);
    setFooterStrikeFontWeight(newSettings.footerStrikeFontWeight);
    setFooterPriceVisibility(newSettings.footerPriceVisibility);
    setFooterBackButtonBgColor(newSettings.footerBackButtonBgColor);
    setFooterBackButtonTextColor(newSettings.footerBackButtonTextColor);
    setFooterBackButtonBorderColor(newSettings.footerBackButtonBorderColor);
    setFooterBackButtonBorderRadius(newSettings.footerBackButtonBorderRadius);
    setFooterNextButtonBgColor(newSettings.footerNextButtonBgColor);
    setFooterNextButtonTextColor(newSettings.footerNextButtonTextColor);
    setFooterNextButtonBorderColor(newSettings.footerNextButtonBorderColor);
    setFooterNextButtonBorderRadius(newSettings.footerNextButtonBorderRadius);
    setFooterDiscountTextVisibility(newSettings.footerDiscountTextVisibility);
    setFooterProgressBarFilledColor(newSettings.footerProgressBarFilledColor);
    setFooterProgressBarEmptyColor(newSettings.footerProgressBarEmptyColor);
    // Bundle Step Bar
    setStepNameFontColor(newSettings.stepNameFontColor);
    setStepNameFontSize(newSettings.stepNameFontSize);
    setCompletedStepCheckMarkColor(newSettings.completedStepCheckMarkColor);
    setCompletedStepBgColor(newSettings.completedStepBgColor);
    setCompletedStepCircleBorderColor(newSettings.completedStepCircleBorderColor);
    setCompletedStepCircleBorderRadius(newSettings.completedStepCircleBorderRadius);
    setIncompleteStepBgColor(newSettings.incompleteStepBgColor);
    setIncompleteStepCircleStrokeColor(newSettings.incompleteStepCircleStrokeColor);
    setIncompleteStepCircleStrokeRadius(newSettings.incompleteStepCircleStrokeRadius);
    setStepBarProgressFilledColor(newSettings.stepBarProgressFilledColor);
    setStepBarProgressEmptyColor(newSettings.stepBarProgressEmptyColor);
    setTabsActiveBgColor(newSettings.tabsActiveBgColor);
    setTabsActiveTextColor(newSettings.tabsActiveTextColor);
    setTabsInactiveBgColor(newSettings.tabsInactiveBgColor);
    setTabsInactiveTextColor(newSettings.tabsInactiveTextColor);
    setTabsBorderColor(newSettings.tabsBorderColor);
    setTabsBorderRadius(newSettings.tabsBorderRadius);
    // General Section
    setBundleBgColor(newSettings.bundleBgColor);
    setFooterScrollBarColor(newSettings.footerScrollBarColor);
    setProductPageTitleFontColor(newSettings.productPageTitleFontColor);
    setProductPageTitleFontSize(newSettings.productPageTitleFontSize);
    setBundleUpsellButtonBgColor(newSettings.bundleUpsellButtonBgColor);
    setBundleUpsellBorderColor(newSettings.bundleUpsellBorderColor);
    setBundleUpsellTextColor(newSettings.bundleUpsellTextColor);
    setToastBgColor(newSettings.toastBgColor);
    setToastTextColor(newSettings.toastTextColor);
    setFilterIconColor(newSettings.filterIconColor);
    setFilterBgColor(newSettings.filterBgColor);
    setFilterTextColor(newSettings.filterTextColor);
  }, [selectedBundleType, settings]);

  // Track if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const current = settings[selectedBundleType];
    return (
      productCardBgColor !== current.productCardBgColor ||
      productCardFontColor !== current.productCardFontColor ||
      productCardFontSize !== current.productCardFontSize ||
      productCardFontWeight !== current.productCardFontWeight ||
      productCardImageFit !== current.productCardImageFit ||
      String(productCardsPerRow) !== String(current.productCardsPerRow) ||
      productTitleVisibility !== current.productTitleVisibility ||
      productPriceVisibility !== current.productPriceVisibility ||
      productStrikePriceColor !== current.productStrikePriceColor ||
      productStrikeFontSize !== current.productStrikeFontSize ||
      productStrikeFontWeight !== current.productStrikeFontWeight ||
      productFinalPriceColor !== current.productFinalPriceColor ||
      productFinalPriceFontSize !== current.productFinalPriceFontSize ||
      productFinalPriceFontWeight !== current.productFinalPriceFontWeight ||
      buttonBgColor !== current.buttonBgColor ||
      buttonTextColor !== current.buttonTextColor ||
      buttonFontSize !== current.buttonFontSize ||
      buttonFontWeight !== current.buttonFontWeight ||
      buttonBorderRadius !== current.buttonBorderRadius ||
      buttonAddToCartText !== current.buttonAddToCartText ||
      quantitySelectorBgColor !== current.quantitySelectorBgColor ||
      quantitySelectorTextColor !== current.quantitySelectorTextColor ||
      quantitySelectorFontSize !== current.quantitySelectorFontSize ||
      quantitySelectorBorderRadius !== current.quantitySelectorBorderRadius ||
      variantSelectorBgColor !== current.variantSelectorBgColor ||
      variantSelectorTextColor !== current.variantSelectorTextColor ||
      variantSelectorBorderRadius !== current.variantSelectorBorderRadius ||
      footerBgColor !== current.footerBgColor ||
      footerTotalBgColor !== current.footerTotalBgColor ||
      footerBorderRadius !== current.footerBorderRadius ||
      footerPadding !== current.footerPadding ||
      footerFinalPriceColor !== current.footerFinalPriceColor ||
      footerFinalPriceFontSize !== current.footerFinalPriceFontSize ||
      footerFinalPriceFontWeight !== current.footerFinalPriceFontWeight ||
      footerStrikePriceColor !== current.footerStrikePriceColor ||
      footerStrikeFontSize !== current.footerStrikeFontSize ||
      footerStrikeFontWeight !== current.footerStrikeFontWeight ||
      footerPriceVisibility !== current.footerPriceVisibility ||
      footerBackButtonBgColor !== current.footerBackButtonBgColor ||
      footerBackButtonTextColor !== current.footerBackButtonTextColor ||
      footerBackButtonBorderColor !== current.footerBackButtonBorderColor ||
      footerBackButtonBorderRadius !== current.footerBackButtonBorderRadius ||
      footerNextButtonBgColor !== current.footerNextButtonBgColor ||
      footerNextButtonTextColor !== current.footerNextButtonTextColor ||
      footerNextButtonBorderColor !== current.footerNextButtonBorderColor ||
      footerNextButtonBorderRadius !== current.footerNextButtonBorderRadius ||
      footerDiscountTextVisibility !== current.footerDiscountTextVisibility ||
      footerProgressBarFilledColor !== current.footerProgressBarFilledColor ||
      footerProgressBarEmptyColor !== current.footerProgressBarEmptyColor ||
      stepNameFontColor !== current.stepNameFontColor ||
      stepNameFontSize !== current.stepNameFontSize ||
      completedStepCheckMarkColor !== current.completedStepCheckMarkColor ||
      completedStepBgColor !== current.completedStepBgColor ||
      completedStepCircleBorderColor !== current.completedStepCircleBorderColor ||
      completedStepCircleBorderRadius !== current.completedStepCircleBorderRadius ||
      incompleteStepBgColor !== current.incompleteStepBgColor ||
      incompleteStepCircleStrokeColor !== current.incompleteStepCircleStrokeColor ||
      incompleteStepCircleStrokeRadius !== current.incompleteStepCircleStrokeRadius ||
      stepBarProgressFilledColor !== current.stepBarProgressFilledColor ||
      stepBarProgressEmptyColor !== current.stepBarProgressEmptyColor ||
      tabsActiveBgColor !== current.tabsActiveBgColor ||
      tabsActiveTextColor !== current.tabsActiveTextColor ||
      tabsInactiveBgColor !== current.tabsInactiveBgColor ||
      tabsInactiveTextColor !== current.tabsInactiveTextColor ||
      tabsBorderColor !== current.tabsBorderColor ||
      tabsBorderRadius !== current.tabsBorderRadius ||
      bundleBgColor !== current.bundleBgColor ||
      footerScrollBarColor !== current.footerScrollBarColor ||
      productPageTitleFontColor !== current.productPageTitleFontColor ||
      productPageTitleFontSize !== current.productPageTitleFontSize ||
      bundleUpsellButtonBgColor !== current.bundleUpsellButtonBgColor ||
      bundleUpsellBorderColor !== current.bundleUpsellBorderColor ||
      bundleUpsellTextColor !== current.bundleUpsellTextColor ||
      toastBgColor !== current.toastBgColor ||
      toastTextColor !== current.toastTextColor ||
      filterIconColor !== current.filterIconColor ||
      filterBgColor !== current.filterBgColor ||
      filterTextColor !== current.filterTextColor ||
      globalPrimaryButtonColor !== current.globalPrimaryButtonColor ||
      globalButtonTextColor !== current.globalButtonTextColor ||
      globalPrimaryTextColor !== current.globalPrimaryTextColor ||
      globalSecondaryTextColor !== current.globalSecondaryTextColor ||
      globalFooterBgColor !== current.globalFooterBgColor ||
      globalFooterTextColor !== current.globalFooterTextColor ||
      conditionsTextColor !== current.conditionsTextColor ||
      conditionsTextFontSize !== current.conditionsTextFontSize ||
      discountTextColor !== current.discountTextColor ||
      discountTextFontSize !== current.discountTextFontSize
    );
  }, [
    settings,
    selectedBundleType,
    productCardBgColor,
    productCardFontColor,
    productCardFontSize,
    productCardFontWeight,
    productCardImageFit,
    productCardsPerRow,
    productTitleVisibility,
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
    variantSelectorBgColor,
    variantSelectorTextColor,
    variantSelectorBorderRadius,
    footerBgColor,
    footerTotalBgColor,
    footerBorderRadius,
    footerPadding,
    footerFinalPriceColor,
    footerFinalPriceFontSize,
    footerFinalPriceFontWeight,
    footerStrikePriceColor,
    footerStrikeFontSize,
    footerStrikeFontWeight,
    footerPriceVisibility,
    footerBackButtonBgColor,
    footerBackButtonTextColor,
    footerBackButtonBorderColor,
    footerBackButtonBorderRadius,
    footerNextButtonBgColor,
    footerNextButtonTextColor,
    footerNextButtonBorderColor,
    footerNextButtonBorderRadius,
    footerDiscountTextVisibility,
    footerProgressBarFilledColor,
    footerProgressBarEmptyColor,
    headerTabActiveBgColor,
    headerTabActiveTextColor,
    headerTabInactiveBgColor,
    headerTabInactiveTextColor,
    headerTabRadius,
    bundleBgColor,
    footerScrollBarColor,
    productPageTitleFontColor,
    productPageTitleFontSize,
    bundleUpsellButtonBgColor,
    bundleUpsellBorderColor,
    bundleUpsellTextColor,
    toastBgColor,
    toastTextColor,
    filterIconColor,
    filterBgColor,
    filterTextColor,
    globalPrimaryButtonColor,
    globalButtonTextColor,
    globalPrimaryTextColor,
    globalSecondaryTextColor,
    globalFooterBgColor,
    globalFooterTextColor,
    conditionsTextColor,
    conditionsTextFontSize,
    discountTextColor,
    discountTextFontSize,
  ]);

  // Function to discard changes and revert to saved values
  const handleDiscard = useCallback(() => {
    const savedSettings = settings[selectedBundleType];
    setProductCardBgColor(savedSettings.productCardBgColor);
    setProductCardFontColor(savedSettings.productCardFontColor);
    setProductCardFontSize(savedSettings.productCardFontSize);
    setProductCardFontWeight(savedSettings.productCardFontWeight);
    setProductCardImageFit(savedSettings.productCardImageFit);
    setProductCardsPerRow(String(savedSettings.productCardsPerRow));
    setProductTitleVisibility(savedSettings.productTitleVisibility);
    setProductPriceVisibility(savedSettings.productPriceVisibility);
    setProductStrikePriceColor(savedSettings.productStrikePriceColor);
    setProductStrikeFontSize(savedSettings.productStrikeFontSize);
    setProductStrikeFontWeight(savedSettings.productStrikeFontWeight);
    setProductFinalPriceColor(savedSettings.productFinalPriceColor);
    setProductFinalPriceFontSize(savedSettings.productFinalPriceFontSize);
    setProductFinalPriceFontWeight(savedSettings.productFinalPriceFontWeight);
    setButtonBgColor(savedSettings.buttonBgColor);
    setButtonTextColor(savedSettings.buttonTextColor);
    setButtonFontSize(savedSettings.buttonFontSize);
    setButtonFontWeight(savedSettings.buttonFontWeight);
    setButtonBorderRadius(savedSettings.buttonBorderRadius);
    setButtonAddToCartText(savedSettings.buttonAddToCartText);
    setQuantitySelectorBgColor(savedSettings.quantitySelectorBgColor);
    setQuantitySelectorTextColor(savedSettings.quantitySelectorTextColor);
    setQuantitySelectorFontSize(savedSettings.quantitySelectorFontSize);
    setQuantitySelectorBorderRadius(savedSettings.quantitySelectorBorderRadius);
    setVariantSelectorBgColor(savedSettings.variantSelectorBgColor);
    setVariantSelectorTextColor(savedSettings.variantSelectorTextColor);
    setVariantSelectorBorderRadius(savedSettings.variantSelectorBorderRadius);
    setFooterBgColor(savedSettings.footerBgColor);
    setFooterTotalBgColor(savedSettings.footerTotalBgColor);
    setFooterBorderRadius(savedSettings.footerBorderRadius);
    setFooterPadding(savedSettings.footerPadding);
    setFooterFinalPriceColor(savedSettings.footerFinalPriceColor);
    setFooterFinalPriceFontSize(savedSettings.footerFinalPriceFontSize);
    setFooterFinalPriceFontWeight(savedSettings.footerFinalPriceFontWeight);
    setFooterStrikePriceColor(savedSettings.footerStrikePriceColor);
    setFooterStrikeFontSize(savedSettings.footerStrikeFontSize);
    setFooterStrikeFontWeight(savedSettings.footerStrikeFontWeight);
    setFooterPriceVisibility(savedSettings.footerPriceVisibility);
    setFooterBackButtonBgColor(savedSettings.footerBackButtonBgColor);
    setFooterBackButtonTextColor(savedSettings.footerBackButtonTextColor);
    setFooterBackButtonBorderColor(savedSettings.footerBackButtonBorderColor);
    setFooterBackButtonBorderRadius(savedSettings.footerBackButtonBorderRadius);
    setFooterNextButtonBgColor(savedSettings.footerNextButtonBgColor);
    setFooterNextButtonTextColor(savedSettings.footerNextButtonTextColor);
    setFooterNextButtonBorderColor(savedSettings.footerNextButtonBorderColor);
    setFooterNextButtonBorderRadius(savedSettings.footerNextButtonBorderRadius);
    setFooterDiscountTextVisibility(savedSettings.footerDiscountTextVisibility);
    setFooterProgressBarFilledColor(savedSettings.footerProgressBarFilledColor);
    setFooterProgressBarEmptyColor(savedSettings.footerProgressBarEmptyColor);
    setStepNameFontColor(savedSettings.stepNameFontColor);
    setStepNameFontSize(savedSettings.stepNameFontSize);
    setCompletedStepCheckMarkColor(savedSettings.completedStepCheckMarkColor);
    setCompletedStepBgColor(savedSettings.completedStepBgColor);
    setCompletedStepCircleBorderColor(savedSettings.completedStepCircleBorderColor);
    setCompletedStepCircleBorderRadius(savedSettings.completedStepCircleBorderRadius);
    setIncompleteStepBgColor(savedSettings.incompleteStepBgColor);
    setIncompleteStepCircleStrokeColor(savedSettings.incompleteStepCircleStrokeColor);
    setIncompleteStepCircleStrokeRadius(savedSettings.incompleteStepCircleStrokeRadius);
    setStepBarProgressFilledColor(savedSettings.stepBarProgressFilledColor);
    setStepBarProgressEmptyColor(savedSettings.stepBarProgressEmptyColor);
    setTabsActiveBgColor(savedSettings.tabsActiveBgColor);
    setTabsActiveTextColor(savedSettings.tabsActiveTextColor);
    setTabsInactiveBgColor(savedSettings.tabsInactiveBgColor);
    setTabsInactiveTextColor(savedSettings.tabsInactiveTextColor);
    setTabsBorderColor(savedSettings.tabsBorderColor);
    setTabsBorderRadius(savedSettings.tabsBorderRadius);
    setBundleBgColor(savedSettings.bundleBgColor);
    setFooterScrollBarColor(savedSettings.footerScrollBarColor);
    setProductPageTitleFontColor(savedSettings.productPageTitleFontColor);
    setProductPageTitleFontSize(savedSettings.productPageTitleFontSize);
    setBundleUpsellButtonBgColor(savedSettings.bundleUpsellButtonBgColor);
    setBundleUpsellBorderColor(savedSettings.bundleUpsellBorderColor);
    setBundleUpsellTextColor(savedSettings.bundleUpsellTextColor);
    setToastBgColor(savedSettings.toastBgColor);
    setToastTextColor(savedSettings.toastTextColor);
    setFilterIconColor(savedSettings.filterIconColor);
    setFilterBgColor(savedSettings.filterBgColor);
    setFilterTextColor(savedSettings.filterTextColor);
    setGlobalPrimaryButtonColor(savedSettings.globalPrimaryButtonColor);
    setGlobalButtonTextColor(savedSettings.globalButtonTextColor);
    setGlobalPrimaryTextColor(savedSettings.globalPrimaryTextColor);
    setGlobalSecondaryTextColor(savedSettings.globalSecondaryTextColor);
    setGlobalFooterBgColor(savedSettings.globalFooterBgColor);
    setGlobalFooterTextColor(savedSettings.globalFooterTextColor);
    setConditionsTextColor(savedSettings.conditionsTextColor);
    setConditionsTextFontSize(savedSettings.conditionsTextFontSize);
    setDiscountTextColor(savedSettings.discountTextColor);
    setDiscountTextFontSize(savedSettings.discountTextFontSize);
  }, [settings, selectedBundleType]);

  // Show/hide save bar based on unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      shopify.saveBar.show('dcp-save-bar');
    } else {
      shopify.saveBar.hide('dcp-save-bar');
    }
  }, [hasUnsavedChanges, shopify]);

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

  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  const handleSubSectionClick = useCallback((subSection: string) => {
    setActiveSubSection(subSection);
  }, []);

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);

  const isLoading = navigation.state === "submitting";

  useEffect(() => {
    if (actionData) {
      setToastActive(true);
      setToastMessage(actionData.message);
      setToastError(!actionData.success);

      // Hide save bar after successful save
      if (actionData.success) {
        shopify.saveBar.hide('dcp-save-bar');
      }
    }
  }, [actionData, shopify]);

  const handleSaveSettings = useCallback(() => {
    const settingsToSave = {
      globalPrimaryButtonColor,
      globalButtonTextColor,
      globalPrimaryTextColor,
      globalSecondaryTextColor,
      globalFooterBgColor,
      globalFooterTextColor,
      productCardBgColor,
      productCardFontColor,
      productCardFontSize,
      productCardFontWeight,
      productCardImageFit,
      productCardsPerRow: parseInt(productCardsPerRow),
      productPriceVisibility,
      productTitleVisibility,
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
      buttonHoverBgColor: buttonBgColor,
      buttonAddToCartText,
      quantitySelectorBgColor,
      quantitySelectorTextColor,
      quantitySelectorFontSize,
      quantitySelectorBorderRadius,
      variantSelectorBgColor,
      variantSelectorTextColor,
      variantSelectorBorderRadius,
      footerBgColor,
      footerTotalBgColor,
      footerBorderRadius,
      footerPadding,
      footerFinalPriceColor,
      footerFinalPriceFontSize,
      footerFinalPriceFontWeight,
      footerStrikePriceColor,
      footerStrikeFontSize,
      footerStrikeFontWeight,
      footerPriceVisibility,
      footerBackButtonBgColor,
      footerBackButtonTextColor,
      footerBackButtonBorderColor,
      footerBackButtonBorderRadius,
      footerNextButtonBgColor,
      footerNextButtonTextColor,
      footerNextButtonBorderColor,
      footerNextButtonBorderRadius,
      footerDiscountTextVisibility,
      footerProgressBarFilledColor,
      footerProgressBarEmptyColor,
      stepNameFontColor,
      stepNameFontSize,
      completedStepCheckMarkColor,
      completedStepBgColor,
      completedStepCircleBorderColor,
      completedStepCircleBorderRadius,
      incompleteStepBgColor,
      incompleteStepCircleStrokeColor,
      incompleteStepCircleStrokeRadius,
      stepBarProgressFilledColor,
      stepBarProgressEmptyColor,
      tabsActiveBgColor,
      tabsActiveTextColor,
      tabsInactiveBgColor,
      tabsInactiveTextColor,
      tabsBorderColor,
      tabsBorderRadius,
      bundleBgColor,
      footerScrollBarColor,
      productPageTitleFontColor,
      productPageTitleFontSize,
      bundleUpsellButtonBgColor,
      bundleUpsellBorderColor,
      bundleUpsellTextColor,
      toastBgColor,
      toastTextColor,
      filterIconColor,
      filterBgColor,
      filterTextColor,
    };

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
  }, [
    selectedBundleType,
    globalPrimaryButtonColor,
    globalButtonTextColor,
    globalPrimaryTextColor,
    globalSecondaryTextColor,
    globalFooterBgColor,
    globalFooterTextColor,
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
    variantSelectorBgColor,
    variantSelectorTextColor,
    variantSelectorBorderRadius,
    footerBgColor,
    footerTotalBgColor,
    footerBorderRadius,
    footerPadding,
    footerFinalPriceColor,
    footerFinalPriceFontSize,
    footerFinalPriceFontWeight,
    footerStrikePriceColor,
    footerStrikeFontSize,
    footerStrikeFontWeight,
    footerPriceVisibility,
    footerBackButtonBgColor,
    footerBackButtonTextColor,
    footerBackButtonBorderColor,
    footerBackButtonBorderRadius,
    footerNextButtonBgColor,
    footerNextButtonTextColor,
    footerNextButtonBorderColor,
    footerNextButtonBorderRadius,
    footerDiscountTextVisibility,
    footerProgressBarFilledColor,
    footerProgressBarEmptyColor,
    headerTabActiveBgColor,
    headerTabActiveTextColor,
    headerTabInactiveBgColor,
    headerTabInactiveTextColor,
    headerTabRadius,
    bundleBgColor,
    footerScrollBarColor,
    productPageTitleFontColor,
    productPageTitleFontSize,
    bundleUpsellButtonBgColor,
    bundleUpsellBorderColor,
    bundleUpsellTextColor,
    toastBgColor,
    toastTextColor,
    filterIconColor,
    filterBgColor,
    filterTextColor,
    submit,
  ]);


  // Render preview content based on active subsection
  const renderPreviewContent = () => {
    // Global Colors - No preview
    if (activeSubSection === "globalColors") {
      return null;
    }

    // Bundle Footer subsections
    if (["footer", "footerPrice", "footerButton", "footerDiscountProgress"].includes(activeSubSection)) {
      return (
        <BundleFooterPreview
          activeSubSection={activeSubSection}
          footerBgColor={footerBgColor}
          footerBorderRadius={footerBorderRadius}
          footerPadding={footerPadding}
          footerTotalBgColor={footerTotalBgColor}
          footerStrikePriceColor={footerStrikePriceColor}
          footerStrikeFontSize={footerStrikeFontSize}
          footerStrikeFontWeight={footerStrikeFontWeight}
          footerFinalPriceColor={footerFinalPriceColor}
          footerFinalPriceFontSize={footerFinalPriceFontSize}
          footerFinalPriceFontWeight={footerFinalPriceFontWeight}
          footerPriceVisibility={footerPriceVisibility}
          footerBackButtonBgColor={footerBackButtonBgColor}
          footerBackButtonTextColor={footerBackButtonTextColor}
          footerBackButtonBorderColor={footerBackButtonBorderColor}
          footerBackButtonBorderRadius={footerBackButtonBorderRadius}
          footerNextButtonBgColor={footerNextButtonBgColor}
          footerNextButtonTextColor={footerNextButtonTextColor}
          footerNextButtonBorderColor={footerNextButtonBorderColor}
          footerNextButtonBorderRadius={footerNextButtonBorderRadius}
          footerDiscountTextVisibility={footerDiscountTextVisibility}
          footerProgressBarFilledColor={footerProgressBarFilledColor}
          footerProgressBarEmptyColor={footerProgressBarEmptyColor}
        />
      );
    }

    // Bundle Header subsections
    if (["headerTabs", "headerText"].includes(activeSubSection)) {
      return (
        <BundleHeaderPreview
          activeSubSection={activeSubSection}
          headerTabActiveBgColor={headerTabActiveBgColor}
          headerTabActiveTextColor={headerTabActiveTextColor}
          headerTabInactiveBgColor={headerTabInactiveBgColor}
          headerTabInactiveTextColor={headerTabInactiveTextColor}
          headerTabRadius={headerTabRadius}
          conditionsTextColor={conditionsTextColor}
          conditionsTextFontSize={conditionsTextFontSize}
          discountTextColor={discountTextColor}
          discountTextFontSize={discountTextFontSize}
        />
      );
    }

    // Bundle Step Bar subsections
    if (["stepName", "completedStep", "incompleteStep", "stepBarProgressBar", "stepBarTabs"].includes(activeSubSection)) {
      return (
        <div style={{ maxWidth: "627px", width: "100%" }}>
          {/* Step Bar Container */}
          <div style={{ marginBottom: "24px" }}>
            {/* Steps with circles and progress bar */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
              {/* Progress Bar Background */}
              <div
                style={{
                  position: "absolute",
                  top: "33px",
                  left: "33px",
                  right: "33px",
                  height: "7px",
                  backgroundColor: stepBarProgressEmptyColor,
                  borderRadius: "4px",
                  zIndex: 0,
                }}
              >
                {/* Progress Bar Filled */}
                <div
                  style={{
                    width: "47%",
                    height: "100%",
                    backgroundColor: stepBarProgressFilledColor,
                    borderRadius: "4px",
                  }}
                />
              </div>

              {/* Steps Row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {/* Step 1 - Completed */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: "67px",
                      height: "67px",
                      borderRadius: `${completedStepCircleBorderRadius}%`,
                      backgroundColor: completedStepBgColor,
                      border: `2px solid ${completedStepCircleBorderColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke={completedStepCheckMarkColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span
                    style={{
                      color: stepNameFontColor,
                      fontSize: `${stepNameFontSize}px`,
                      fontWeight: 500,
                    }}
                  >
                    Step 1
                  </span>
                </div>

                {/* Step 2 - Completed */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: "67px",
                      height: "67px",
                      borderRadius: `${completedStepCircleBorderRadius}%`,
                      backgroundColor: completedStepBgColor,
                      border: `2px solid ${completedStepCircleBorderColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke={completedStepCheckMarkColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span
                    style={{
                      color: stepNameFontColor,
                      fontSize: `${stepNameFontSize}px`,
                      fontWeight: 500,
                    }}
                  >
                    Step 2
                  </span>
                </div>

                {/* Step 3 - Incomplete */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: "67px",
                      height: "67px",
                      borderRadius: `${incompleteStepCircleStrokeRadius}%`,
                      backgroundColor: incompleteStepBgColor,
                      border: `2px solid ${incompleteStepCircleStrokeColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        color: stepNameFontColor,
                        fontSize: "20px",
                        fontWeight: 600,
                      }}
                    >
                      3
                    </span>
                  </div>
                  <span
                    style={{
                      color: stepNameFontColor,
                      fontSize: `${stepNameFontSize}px`,
                      fontWeight: 500,
                    }}
                  >
                    Step 3
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            {activeSubSection === "stepBarTabs" && (
              <div style={{ marginTop: "32px", display: "flex", gap: "0", border: `1px solid ${tabsBorderColor}`, borderRadius: `${tabsBorderRadius}px`, overflow: "hidden" }}>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: tabsActiveBgColor,
                    color: tabsActiveTextColor,
                    padding: "12px 24px",
                    textAlign: "center",
                    fontSize: "16px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Category 1
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: tabsInactiveBgColor,
                    color: tabsInactiveTextColor,
                    padding: "12px 24px",
                    textAlign: "center",
                    fontSize: "16px",
                    fontWeight: 500,
                    cursor: "pointer",
                    borderLeft: `1px solid ${tabsBorderColor}`,
                  }}
                >
                  Category 2
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: tabsInactiveBgColor,
                    color: tabsInactiveTextColor,
                    padding: "12px 24px",
                    textAlign: "center",
                    fontSize: "16px",
                    fontWeight: 500,
                    cursor: "pointer",
                    borderLeft: `1px solid ${tabsBorderColor}`,
                  }}
                >
                  Category 3
                </div>
              </div>
            )}
          </div>

          {/* Annotation */}
          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <Text as="p" variant="bodySm" tone="subdued">
              Preview updates as you customize
            </Text>
          </div>
        </div>
      );
    }

    // General Section subsections - each has its own isolated preview
    if (["bundleDesign", "productPageTitle", "bundleUpsell"].includes(activeSubSection)) {
      // Bundle Design - Full bundle view with all components
      if (activeSubSection === "bundleDesign") {
        return (
          <div style={{ maxWidth: "800px", width: "100%", backgroundColor: bundleBgColor, padding: "40px", borderRadius: "12px" }}>
            {/* Product Page Title */}
            <h1
              style={{
                color: productPageTitleFontColor,
                fontSize: `${productPageTitleFontSize}px`,
                fontWeight: 600,
                margin: 0,
                marginBottom: "24px",
              }}
            >
              Product Page Title
            </h1>

            {/* Filters and Search Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              {/* Filters Button */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: filterBgColor,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #E3E3E3",
                  fontSize: "12px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 4.99509C3 3.89323 3.89262 3 4.99509 3H19.0049C20.1068 3 21 3.89262 21 4.99509V6.5C21 7.05 20.78 7.58 20.38 7.96L14.5 13.5V21L9.5 19V13.5L3.62 7.96C3.22 7.58 3 7.05 3 6.5V4.99509Z"
                    stroke={filterIconColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span style={{ color: filterTextColor, fontWeight: 500 }}>Filters</span>
              </div>

              {/* Search */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="#666" strokeWidth="2" />
                  <path d="M21 21L16.65 16.65" stroke="#666" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span style={{ color: "#666" }}>Search</span>
              </div>
            </div>

            {/* Step Bar */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ position: "relative", marginBottom: "16px" }}>
                <div
                  style={{
                    position: "absolute",
                    top: "18px",
                    left: "18px",
                    right: "18px",
                    height: "4px",
                    backgroundColor: stepBarProgressEmptyColor,
                    borderRadius: "2px",
                  }}
                >
                  <div style={{ width: "47%", height: "100%", backgroundColor: stepBarProgressFilledColor, borderRadius: "2px" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                  {[1, 2].map((step) => (
                    <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: completedStepBgColor,
                          border: `2px solid ${completedStepCircleBorderColor}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke={completedStepCheckMarkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span style={{ color: stepNameFontColor, fontSize: "11px" }}>Step {step}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: incompleteStepBgColor,
                        border: `2px solid ${incompleteStepCircleStrokeColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ color: stepNameFontColor, fontSize: "12px", fontWeight: 600 }}>3</span>
                    </div>
                    <span style={{ color: stepNameFontColor, fontSize: "11px" }}>Step 3</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={{ backgroundColor: productCardBgColor, borderRadius: "12px", padding: "12px" }}>
                  <div style={{ width: "100%", height: "100px", backgroundColor: "#E5E5E5", borderRadius: "8px", marginBottom: "8px" }} />
                  <div style={{ color: productCardFontColor, fontSize: "11px", fontWeight: productCardFontWeight, marginBottom: "6px" }}>
                    {i === 2 || i === 4 || i === 6 ? "big product name spanning two lines" : "Product Name"}
                  </div>
                  <div style={{ marginBottom: "8px", fontSize: "10px" }}>
                    <span style={{ color: productStrikePriceColor, textDecoration: "line-through", marginRight: "4px" }}>$19.99</span>
                    <span style={{ color: productFinalPriceColor, fontWeight: 600 }}>$15.99</span>
                  </div>
                  <button style={{ width: "100%", backgroundColor: buttonBgColor, color: buttonTextColor, padding: "6px", borderRadius: `${buttonBorderRadius}px`, border: "none", fontSize: "10px", cursor: "pointer" }}>
                    Add to cart
                  </button>
                </div>
              ))}
            </div>

            {/* Footer with Scroll Bar */}
            <div style={{ backgroundColor: footerBgColor, borderRadius: `${footerBorderRadius}px`, padding: `${footerPadding}px`, position: "relative" }}>
              {/* Scroll Bar Indicator */}
              <div
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "20px",
                  bottom: "20px",
                  width: "6px",
                  backgroundColor: "#F0F0F0",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div style={{ width: "100%", height: "40%", backgroundColor: footerScrollBarColor, borderRadius: "3px" }} />
              </div>

              {/* Cart Badge */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                <div
                  style={{
                    backgroundColor: "#000000",
                    color: "#FFFFFF",
                    borderRadius: "12px",
                    padding: "3px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  5 🛒
                </div>
              </div>

              {/* Discount Progress */}
              <div style={{ textAlign: "center", marginBottom: "10px", fontSize: "11px" }}>Buy 3 and get 30% off</div>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ width: "100%", height: "6px", backgroundColor: footerProgressBarEmptyColor, borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "47%", height: "100%", backgroundColor: footerProgressBarFilledColor }} />
                </div>
              </div>

              {/* Product List */}
              <div style={{ marginBottom: "16px", maxHeight: "80px", overflowY: "auto" }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", position: "relative", paddingLeft: "16px" }}>
                    <div style={{ position: "absolute", left: "0", width: "12px", height: "12px", backgroundColor: "#FFF", border: "1px solid #000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px" }}>×</div>
                    <div style={{ width: "28px", height: "28px", backgroundColor: "#E5E5E5", borderRadius: "4px" }} />
                    <div style={{ flex: 1, fontSize: "9px" }}>
                      <div style={{ fontWeight: 500 }}>Small product name</div>
                      <div style={{ color: "#666" }}>$19.99 x 4</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button style={{ flex: 1, backgroundColor: footerBackButtonBgColor, color: footerBackButtonTextColor, border: `1px solid ${footerBackButtonBorderColor}`, borderRadius: `${footerBackButtonBorderRadius}px`, padding: "8px", fontSize: "11px", cursor: "pointer" }}>
                  Back
                </button>
                <div style={{ flex: 1, backgroundColor: footerTotalBgColor, padding: "8px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: "9px", color: "#666", marginBottom: "2px" }}>Total</div>
                  <div>
                    <span style={{ color: footerStrikePriceColor, fontSize: "10px", textDecoration: "line-through", marginRight: "4px" }}>$19.99</span>
                    <span style={{ color: footerFinalPriceColor, fontSize: "12px", fontWeight: 700 }}>$19.99</span>
                  </div>
                </div>
                <button style={{ flex: 1, backgroundColor: footerNextButtonBgColor, color: footerNextButtonTextColor, border: `1px solid ${footerNextButtonBorderColor}`, borderRadius: `${footerNextButtonBorderRadius}px`, padding: "8px", fontSize: "11px", cursor: "pointer" }}>
                  Next
                </button>
              </div>
            </div>

            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <Text as="p" variant="bodySm" tone="subdued">
                Preview updates as you customize
              </Text>
            </div>
          </div>
        );
      }

      // Product Page Title - Only show the title
      if (activeSubSection === "productPageTitle") {
        return (
          <div style={{ maxWidth: "600px", width: "100%", textAlign: "center" }}>
            <h1
              style={{
                color: productPageTitleFontColor,
                fontSize: `${productPageTitleFontSize}px`,
                fontWeight: 600,
                margin: 0,
                marginBottom: "40px",
              }}
            >
              Product Page Title
            </h1>
            <div style={{ marginTop: "40px" }}>
              <Text as="p" variant="bodySm" tone="subdued">
                Preview updates as you customize
              </Text>
            </div>
          </div>
        );
      }

      // Bundle Upsell - Only show the large upsell button
      if (activeSubSection === "bundleUpsell") {
        return (
          <div style={{ maxWidth: "600px", width: "100%", textAlign: "center" }}>
            <button
              style={{
                width: "100%",
                backgroundColor: bundleUpsellButtonBgColor,
                color: bundleUpsellTextColor,
                border: `2px solid ${bundleUpsellBorderColor}`,
                padding: "20px 32px",
                borderRadius: "12px",
                fontSize: "18px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Add to Cart
            </button>
            <div style={{ marginTop: "40px" }}>
              <Text as="p" variant="bodySm" tone="subdued">
                Preview updates as you customize
              </Text>
            </div>
          </div>
        );
      }
    }

    // General subsections
    if (["emptyState", "addToCartButton", "toasts"].includes(activeSubSection)) {
      return (
        <GeneralPreview
          activeSubSection={activeSubSection}
          emptyStateCardBgColor={emptyStateCardBgColor}
          emptyStateBorderStyle={emptyStateBorderStyle}
          emptyStateCardBorderColor={emptyStateCardBorderColor}
          emptyStateTextColor={emptyStateTextColor}
          addToCartButtonBgColor={addToCartButtonBgColor}
          addToCartButtonTextColor={addToCartButtonTextColor}
          addToCartButtonBorderRadius={addToCartButtonBorderRadius}
          buttonAddToCartText={buttonAddToCartText}
          toastBgColor={toastBgColor}
          toastTextColor={toastTextColor}
        />
      );
    }

    // Product Card subsections (default)
    return (
      <ProductCardPreview
        productCardBgColor={productCardBgColor}
        productCardFontColor={productCardFontColor}
        productCardFontSize={productCardFontSize}
        productCardFontWeight={productCardFontWeight}
        productCardImageFit={productCardImageFit}
        productTitleVisibility={productTitleVisibility}
        productPriceVisibility={productPriceVisibility}
        productStrikePriceColor={productStrikePriceColor}
        productStrikeFontSize={productStrikeFontSize}
        productStrikeFontWeight={productStrikeFontWeight}
        productFinalPriceColor={productFinalPriceColor}
        productFinalPriceFontSize={productFinalPriceFontSize}
        productFinalPriceFontWeight={productFinalPriceFontWeight}
        variantSelectorBgColor={variantSelectorBgColor}
        variantSelectorTextColor={variantSelectorTextColor}
        variantSelectorBorderRadius={variantSelectorBorderRadius}
        quantitySelectorBgColor={quantitySelectorBgColor}
        quantitySelectorTextColor={quantitySelectorTextColor}
        quantitySelectorBorderRadius={quantitySelectorBorderRadius}
        buttonBgColor={buttonBgColor}
        buttonTextColor={buttonTextColor}
        buttonBorderRadius={buttonBorderRadius}
        buttonFontSize={buttonFontSize}
        buttonFontWeight={buttonFontWeight}
        buttonAddToCartText={buttonAddToCartText}
      />
    );
  };

  // Render arrow overlays based on active subsection
  const renderArrows = () => {
    // Product Card arrows (default when no specific subsection is selected)
    if (!activeSubSection || activeSubSection === "") {
      return (
        <>
          <ArrowLabel label="Product Card" position="left" horizontalDistance={160} />
          <ArrowLabel label="Product Image" position="top" verticalDistance={150} />
          <ArrowLabel label="Product Title" position="right" horizontalDistance={140} />
          <ArrowLabel label="Product Prices" position="left" horizontalDistance={160} />
          <ArrowLabel label="Variant Selector" position="right" horizontalDistance={160} />
          <ArrowLabel label="Button" position="bottom" verticalDistance={150} />
        </>
      );
    }

    // Quantity & Variant Selector arrows
    if (activeSubSection === "quantityVariantSelector") {
      return (
        <>
          <ArrowLabel label="Variant Selector" position="left" horizontalDistance={160} verticalOffset={-40} />
          <ArrowLabel label="Quantity Selector" position="right" horizontalDistance={160} verticalOffset={10} />
        </>
      );
    }

    // Product Card subsection arrows
    if (activeSubSection === "productCard") {
      return (
        <>
          <ArrowLabel label="Product Card" position="left" horizontalDistance={160} verticalOffset={-80} />
          <ArrowLabel label="Product Image" position="top" verticalDistance={150} />
        </>
      );
    }

    // Product Card Typography subsection arrows
    if (activeSubSection === "productCardTypography") {
      return (
        <>
          <ArrowLabel label="Product Title" position="top" verticalDistance={140} />
          <ArrowLabel label="Product Prices" position="bottom" verticalDistance={140} />
        </>
      );
    }

    // Button subsection arrows
    if (activeSubSection === "button") {
      return <ArrowLabel label="Add to Bundle Button" position="bottom" verticalDistance={130} />;
    }

    // Bundle Footer arrows
    if (activeSubSection === "footer") {
      return (
        <>
          <ArrowLabel label="Total Pill" position="top" verticalDistance={150} />
          <ArrowLabel label="Footer" position="top" verticalDistance={150} horizontalOffset={20} />
        </>
      );
    }

    if (activeSubSection === "footerPrice") {
      return <ArrowLabel label="Price" position="right" horizontalDistance={140} />;
    }

    if (activeSubSection === "footerButton") {
      return (
        <>
          <ArrowLabel label="Back Button" position="left" horizontalDistance={140} />
          <ArrowLabel label="Next Button" position="right" horizontalDistance={140} />
        </>
      );
    }

    if (activeSubSection === "footerDiscountProgress") {
      return (
        <>
          <ArrowLabel label="Discount Text" position="top" verticalDistance={120} />
          <ArrowLabel label="Progress Bar" position="bottom" verticalDistance={120} />
        </>
      );
    }

    // Bundle Header arrows
    if (activeSubSection === "headerText") {
      return (
        <>
          <ArrowLabel label="Conditions Text" position="top" verticalDistance={150} />
          <ArrowLabel label="Discount Text" position="bottom" verticalDistance={150} />
        </>
      );
    }

    // General section arrows
    if (activeSubSection === "emptyState") {
      return <ArrowLabel label="Empty State Card" position="top" verticalDistance={150} />;
    }

    if (activeSubSection === "addToCartButton") {
      return <ArrowLabel label="Add to Cart Button" position="top" verticalDistance={150} />;
    }

    if (activeSubSection === "toasts") {
      return <ArrowLabel label="Toast Notification" position="top" verticalDistance={150} />;
    }

    return null;
  };

  // Render settings panel based on active subsection
  const renderSettingsPanel = () => {
    switch (activeSubSection) {
      case "globalColors":
        return (
          <BlockStack gap="400">
            <InlineStack gap="200" align="start" blockAlign="center">
              <Text as="h2" variant="headingMd">
                Global Colors
              </Text>
              <div style={{
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
                cursor: "help"
              }} title="Define your brand's primary colors that will be used consistently across the bundle widget">
                i
              </div>
            </InlineStack>
            <Text as="p" variant="bodyMd" tone="subdued">
              Enter your brand colors here and the bundle will adapt
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
                value={globalPrimaryButtonColor}
                onChange={setGlobalPrimaryButtonColor}
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
                label="" value={globalButtonTextColor}
                onChange={setGlobalButtonTextColor}
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
                label="" value={globalPrimaryTextColor}
                onChange={setGlobalPrimaryTextColor}
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
                label="" value={globalSecondaryTextColor}
                onChange={setGlobalSecondaryTextColor}
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
                label="" value={globalFooterBgColor}
                onChange={setGlobalFooterBgColor}
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
                label="" value={globalFooterTextColor}
                onChange={setGlobalFooterTextColor}
              />
            </InlineStack>
          </BlockStack>
        );

      case "productCard":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Product Card
            </Text>
            <Divider />

            <ColorPicker
              label="Background Color"
              value={productCardBgColor}
              onChange={setProductCardBgColor}
            />

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

            <BlockStack gap="200">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Product Title
              </Text>
              <ButtonGroup variant="segmented">
                <Button
                  pressed={productTitleVisibility === true}
                  onClick={() => setProductTitleVisibility(true)}
                >
                  Show
                </Button>
                <Button
                  pressed={productTitleVisibility === false}
                  onClick={() => setProductTitleVisibility(false)}
                >
                  Hide
                </Button>
              </ButtonGroup>
            </BlockStack>

            <ColorPicker
              label="Product Font Color"
              value={productCardFontColor}
              onChange={setProductCardFontColor}
            />

            <RangeSlider
              label="Product Name Font Size"
              value={productCardFontSize}
              onChange={(value) => setProductCardFontSize(value as number)}
              min={12}
              max={24}
              output
            />

            <RangeSlider
              label="Product Name Font Weight"
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

            {productPriceVisibility && (
              <>
                <ColorPicker
                  label="Strikethrough Price Color"
                  value={productStrikePriceColor}
                  onChange={setProductStrikePriceColor}
                />

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

                <ColorPicker
                  label="Final Price Font Color"
                  value={productFinalPriceColor}
                  onChange={setProductFinalPriceColor}
                />

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
              </>
            )}
          </BlockStack>
        );

      case "button":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Button
            </Text>
            <Divider />

            <ColorPicker
              label="Background Color"
              value={buttonBgColor}
              onChange={setButtonBgColor}
            />

            <ColorPicker
              label="Text Color"
              value={buttonTextColor}
              onChange={setButtonTextColor}
            />

            <RangeSlider
              label="Size"
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
          </BlockStack>
        );

      case "quantityVariantSelector":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Quantity & Variant Selector
            </Text>
            <Divider />

            {/* Quantity Selector Section */}
            <BlockStack gap="400">
              <Text as="h3" variant="headingSm">
                Quantity Selector
              </Text>

              <ColorPicker
                label="Background Color"
                value={quantitySelectorBgColor}
                onChange={setQuantitySelectorBgColor}
              />

              <ColorPicker
                label="Text Color"
                value={quantitySelectorTextColor}
                onChange={setQuantitySelectorTextColor}
              />

              <RangeSlider
                label="Border Radius"
                value={quantitySelectorBorderRadius}
                onChange={(value) => setQuantitySelectorBorderRadius(value as number)}
                min={0}
                max={67}
                output
                suffix="px"
              />
            </BlockStack>

            <Divider />

            {/* Variant Selector Section */}
            <BlockStack gap="400">
              <Text as="h3" variant="headingSm">
                Variant Selector
              </Text>

              <ColorPicker
                label="Background Color"
                value={variantSelectorBgColor}
                onChange={setVariantSelectorBgColor}
              />

              <ColorPicker
                label="Text Color"
                value={variantSelectorTextColor}
                onChange={setVariantSelectorTextColor}
              />

              <RangeSlider
                label="Border Radius"
                value={variantSelectorBorderRadius}
                onChange={(value) => setVariantSelectorBorderRadius(value as number)}
                min={0}
                max={67}
                output
                suffix="px"
              />
            </BlockStack>
          </BlockStack>
        );

      case "footer":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Footer
            </Text>
            <Divider />

            <ColorPicker
              label="Background Color"
              value={footerBgColor}
              onChange={setFooterBgColor}
            />

            <ColorPicker
              label="Total Pill Background Color"
              value={footerTotalBgColor}
              onChange={setFooterTotalBgColor}
            />

            <RangeSlider
              label="Border Radius"
              value={footerBorderRadius}
              onChange={(value) => setFooterBorderRadius(value as number)}
              min={0}
              max={24}
              output
            />

            <RangeSlider
              label="Padding"
              value={footerPadding}
              onChange={(value) => setFooterPadding(value as number)}
              min={8}
              max={32}
              output
            />
          </BlockStack>
        );

      case "footerPrice":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Price
            </Text>
            <Divider />

            <BlockStack gap="200">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Visibility
              </Text>
              <ButtonGroup variant="segmented">
                <Button
                  pressed={footerPriceVisibility === true}
                  onClick={() => setFooterPriceVisibility(true)}
                >
                  Show
                </Button>
                <Button
                  pressed={footerPriceVisibility === false}
                  onClick={() => setFooterPriceVisibility(false)}
                >
                  Hide
                </Button>
              </ButtonGroup>
            </BlockStack>

            {footerPriceVisibility && (
              <>
                <ColorPicker
                  label="Final Price Font Color"
                  value={footerFinalPriceColor}
                  onChange={setFooterFinalPriceColor}
                />

                <ColorPicker
                  label="Strikethrough Price Color"
                  value={footerStrikePriceColor}
                  onChange={setFooterStrikePriceColor}
                />
              </>
            )}
          </BlockStack>
        );

      case "footerButton":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Button
            </Text>
            <Divider />

            <Text as="h3" variant="headingSm">
              Back Button
            </Text>

            <ColorPicker
              label="Back Button Color"
              value={footerBackButtonBgColor}
              onChange={setFooterBackButtonBgColor}
            />

            <ColorPicker
              label="Back Button Text Color"
              value={footerBackButtonTextColor}
              onChange={setFooterBackButtonTextColor}
            />

            <Divider />

            <Text as="h3" variant="headingSm">
              Next Button
            </Text>

            <ColorPicker
              label="Next Button Color"
              value={footerNextButtonBgColor}
              onChange={setFooterNextButtonBgColor}
            />

            <ColorPicker
              label="Next Button Text Color"
              value={footerNextButtonTextColor}
              onChange={setFooterNextButtonTextColor}
            />

            <Divider />

            <Text as="h3" variant="headingSm">
              Common
            </Text>

            <RangeSlider
              label="Button Border Radius"
              value={footerBackButtonBorderRadius}
              onChange={(value) => {
                setFooterBackButtonBorderRadius(value as number);
                setFooterNextButtonBorderRadius(value as number);
              }}
              min={0}
              max={67}
              output
            />
          </BlockStack>
        );

      case "footerDiscountProgress":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Discount Text & Progress Bar
            </Text>
            <Divider />

            <BlockStack gap="200">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Discount Text
              </Text>
              <ButtonGroup variant="segmented">
                <Button
                  pressed={footerDiscountTextVisibility === true}
                  onClick={() => setFooterDiscountTextVisibility(true)}
                >
                  Show
                </Button>
                <Button
                  pressed={footerDiscountTextVisibility === false}
                  onClick={() => setFooterDiscountTextVisibility(false)}
                >
                  Hide
                </Button>
              </ButtonGroup>
            </BlockStack>

            <Divider />

            <ColorPicker
              label="Progress Bar Filled Color"
              value={footerProgressBarFilledColor}
              onChange={setFooterProgressBarFilledColor}
            />

            <ColorPicker
              label="Progress Bar Empty Color"
              value={footerProgressBarEmptyColor}
              onChange={setFooterProgressBarEmptyColor}
            />
          </BlockStack>
        );

      // ========== BUNDLE HEADER SECTION ==========
      case "headerTabs":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Tabs
            </Text>
            <Divider />

            <ColorPicker
              label="Tabs Active Background Color"
              value={headerTabActiveBgColor}
              onChange={setHeaderTabActiveBgColor}
            />

            <ColorPicker
              label="Tabs Active Text Color"
              value={headerTabActiveTextColor}
              onChange={setHeaderTabActiveTextColor}
            />

            <ColorPicker
              label="Tabs Inactive Background Color"
              value={headerTabInactiveBgColor}
              onChange={setHeaderTabInactiveBgColor}
            />

            <ColorPicker
              label="Tabs Inactive Text Color"
              value={headerTabInactiveTextColor}
              onChange={setHeaderTabInactiveTextColor}
            />

            <RangeSlider
              label="Border Radius"
              value={headerTabRadius}
              onChange={(value) => setHeaderTabRadius(value as number)}
              min={0}
              max={100}
              output
            />
          </BlockStack>
        );

      case "headerText":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Header Text
            </Text>
            <Divider />

            <ColorPicker
              label="Conditions Text Color"
              value={conditionsTextColor}
              onChange={setConditionsTextColor}
            />

            <RangeSlider
              label="Conditions Text Font Size"
              value={conditionsTextFontSize}
              onChange={(value) => setConditionsTextFontSize(value as number)}
              min={12}
              max={32}
              output
            />

            <ColorPicker
              label="Discount Text Color"
              value={discountTextColor}
              onChange={setDiscountTextColor}
            />

            <RangeSlider
              label="Discount Text Font Size"
              value={discountTextFontSize}
              onChange={(value) => setDiscountTextFontSize(value as number)}
              min={10}
              max={24}
              output
            />
          </BlockStack>
        );

      case "completedStep":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Completed Step
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: completedStepCheckMarkColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("completedStepCheckMarkColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="completedStepCheckMarkColorInput"
                    type="color"
                    value={completedStepCheckMarkColor}
                    onChange={(e) => setCompletedStepCheckMarkColor(e.target.value)}
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
                    Check Mark Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {completedStepCheckMarkColor}
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
                    backgroundColor: completedStepBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("completedStepBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="completedStepBgColorInput"
                    type="color"
                    value={completedStepBgColor}
                    onChange={(e) => setCompletedStepBgColor(e.target.value)}
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
                    Step Completed Background Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {completedStepBgColor}
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
                    backgroundColor: completedStepCircleBorderColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("completedStepCircleBorderColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="completedStepCircleBorderColorInput"
                    type="color"
                    value={completedStepCircleBorderColor}
                    onChange={(e) => setCompletedStepCircleBorderColor(e.target.value)}
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
                    Circle Border Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {completedStepCircleBorderColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <RangeSlider
              label="Border Radius"
              value={completedStepCircleBorderRadius}
              onChange={(value) => setCompletedStepCircleBorderRadius(value as number)}
              min={0}
              max={50}
              output
            />
          </BlockStack>
        );

      case "incompleteStep":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Incomplete Step
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: incompleteStepBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("incompleteStepBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="incompleteStepBgColorInput"
                    type="color"
                    value={incompleteStepBgColor}
                    onChange={(e) => setIncompleteStepBgColor(e.target.value)}
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
                    Incomplete Step Background Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {incompleteStepBgColor}
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
                    backgroundColor: incompleteStepCircleStrokeColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("incompleteStepCircleStrokeColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="incompleteStepCircleStrokeColorInput"
                    type="color"
                    value={incompleteStepCircleStrokeColor}
                    onChange={(e) => setIncompleteStepCircleStrokeColor(e.target.value)}
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
                    Circle Stroke Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {incompleteStepCircleStrokeColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <RangeSlider
              label="Border Radius"
              value={incompleteStepCircleStrokeRadius}
              onChange={(value) => setIncompleteStepCircleStrokeRadius(value as number)}
              min={0}
              max={50}
              output
            />
          </BlockStack>
        );

      case "stepBarProgressBar":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Progress Bar
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: stepBarProgressFilledColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("stepBarProgressFilledColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="stepBarProgressFilledColorInput"
                    type="color"
                    value={stepBarProgressFilledColor}
                    onChange={(e) => setStepBarProgressFilledColor(e.target.value)}
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
                    Progress Bar Filled Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {stepBarProgressFilledColor}
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
                    backgroundColor: stepBarProgressEmptyColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("stepBarProgressEmptyColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="stepBarProgressEmptyColorInput"
                    type="color"
                    value={stepBarProgressEmptyColor}
                    onChange={(e) => setStepBarProgressEmptyColor(e.target.value)}
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
                    Progress Bar Empty Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {stepBarProgressEmptyColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        );

      case "stepBarTabs":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Tabs
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: tabsActiveBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("tabsActiveBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="tabsActiveBgColorInput"
                    type="color"
                    value={tabsActiveBgColor}
                    onChange={(e) => setTabsActiveBgColor(e.target.value)}
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
                    Tabs Active Background Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {tabsActiveBgColor}
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
                    backgroundColor: tabsActiveTextColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("tabsActiveTextColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="tabsActiveTextColorInput"
                    type="color"
                    value={tabsActiveTextColor}
                    onChange={(e) => setTabsActiveTextColor(e.target.value)}
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
                    Tabs Active Text Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {tabsActiveTextColor}
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
                    backgroundColor: tabsInactiveBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("tabsInactiveBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="tabsInactiveBgColorInput"
                    type="color"
                    value={tabsInactiveBgColor}
                    onChange={(e) => setTabsInactiveBgColor(e.target.value)}
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
                    Tabs Inactive Background Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {tabsInactiveBgColor}
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
                    backgroundColor: tabsInactiveTextColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("tabsInactiveTextColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="tabsInactiveTextColorInput"
                    type="color"
                    value={tabsInactiveTextColor}
                    onChange={(e) => setTabsInactiveTextColor(e.target.value)}
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
                    Tabs Inactive Text Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {tabsInactiveTextColor}
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
                    backgroundColor: tabsBorderColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("tabsBorderColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="tabsBorderColorInput"
                    type="color"
                    value={tabsBorderColor}
                    onChange={(e) => setTabsBorderColor(e.target.value)}
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
                    Tabs Border Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {tabsBorderColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <RangeSlider
              label="Border Radius"
              value={tabsBorderRadius}
              onChange={(value) => setTabsBorderRadius(value as number)}
              min={0}
              max={24}
              output
            />
          </BlockStack>
        );

      // ========== GENERAL SECTION ==========
      case "emptyState":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Empty State
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: emptyStateCardBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("emptyStateCardBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="emptyStateCardBgColorInput"
                    type="color"
                    value={emptyStateCardBgColor}
                    onChange={(e) => setEmptyStateCardBgColor(e.target.value)}
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
                    Card Background Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {emptyStateCardBgColor}
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
                    backgroundColor: emptyStateCardBorderColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("emptyStateCardBorderColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="emptyStateCardBorderColorInput"
                    type="color"
                    value={emptyStateCardBorderColor}
                    onChange={(e) => setEmptyStateCardBorderColor(e.target.value)}
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
                    Card Border Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {emptyStateCardBorderColor}
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
                    backgroundColor: emptyStateTextColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("emptyStateTextColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="emptyStateTextColorInput"
                    type="color"
                    value={emptyStateTextColor}
                    onChange={(e) => setEmptyStateTextColor(e.target.value)}
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
                    {emptyStateTextColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <BlockStack gap="200">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Border Style
              </Text>
              <ButtonGroup variant="segmented">
                <Button
                  pressed={emptyStateBorderStyle === "solid"}
                  onClick={() => setEmptyStateBorderStyle("solid")}
                >
                  Solid
                </Button>
                <Button
                  pressed={emptyStateBorderStyle === "dashed"}
                  onClick={() => setEmptyStateBorderStyle("dashed")}
                >
                  Dashed
                </Button>
              </ButtonGroup>
            </BlockStack>
          </BlockStack>
        );

      case "addToCartButton":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Add to Cart Button
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: addToCartButtonBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("addToCartButtonBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="addToCartButtonBgColorInput"
                    type="color"
                    value={addToCartButtonBgColor}
                    onChange={(e) => setAddToCartButtonBgColor(e.target.value)}
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
                    {addToCartButtonBgColor}
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
                    backgroundColor: addToCartButtonTextColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("addToCartButtonTextColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="addToCartButtonTextColorInput"
                    type="color"
                    value={addToCartButtonTextColor}
                    onChange={(e) => setAddToCartButtonTextColor(e.target.value)}
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
                    {addToCartButtonTextColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <BlockStack gap="200">
              <TextField
                label="Button Corner Radius"
                type="number"
                value={String(addToCartButtonBorderRadius)}
                onChange={(value) => setAddToCartButtonBorderRadius(Number(value))}
                autoComplete="off"
                suffix="px"
              />
            </BlockStack>

            <BlockStack gap="200">
              <TextField
                label="Button Text"
                value={buttonAddToCartText}
                onChange={setButtonAddToCartText}
                autoComplete="off"
                placeholder="Add to Cart"
              />
            </BlockStack>
          </BlockStack>
        );

      case "toasts":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Toasts
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: toastBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("toastBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="toastBgColorInput"
                    type="color"
                    value={toastBgColor}
                    onChange={(e) => setToastBgColor(e.target.value)}
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
                    {toastBgColor}
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
                    backgroundColor: toastTextColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("toastTextColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="toastTextColorInput"
                    type="color"
                    value={toastTextColor}
                    onChange={(e) => setToastTextColor(e.target.value)}
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
                    {toastTextColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
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
                  {renderPreviewContent()}
                  {renderArrows()}
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
                {renderSettingsPanel()}
              </div>
            </div>
          </div>
        </Modal>

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
