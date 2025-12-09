import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData, useNavigation } from "@remix-run/react";
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
  Frame,
  Toast,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState, useCallback, useEffect } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@shopify/polaris-icons";
import { prisma } from "../db.server";

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

  const productPageSettings = await prisma.designSettings.findUnique({
    where: { shopId_bundleType: { shopId, bundleType: "product_page" } }
  });

  const fullPageSettings = await prisma.designSettings.findUnique({
    where: { shopId_bundleType: { shopId, bundleType: "full_page" } }
  });

  const defaultSettings = {
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
      // Bundle Footer
      footerBgColor: "#FFFFFF",
      footerTotalBgColor: "#F6F6F6",
      footerBorderRadius: 8,
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
      // Bundle Design
      bundleBgColor: "#FFFFFF",
      footerScrollBarColor: "#F6F6F6",
      // Product Page Title
      productPageTitleFontColor: "#000000",
      productPageTitleFontSize: 16,
      // Bundle Upsell
      bundleUpsellButtonBgColor: "#F6F6F6",
      bundleUpsellBorderColor: "#F6F6F6",
      bundleUpsellTextColor: "#F6F6F6",
      // Toasts
      toastBgColor: "#000000",
      toastTextColor: "#FFFFFF",
      // Filters
      filterIconColor: "#000000",
      filterBgColor: "#FFFFFF",
      filterTextColor: "#000000",
      // Images & Gifs
      bundleLoadingGifUrl: "",
      checkoutGifUrl: "",
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
      // Bundle Footer
      footerBgColor: "#FFFFFF",
      footerTotalBgColor: "#F9FAFB",
      footerBorderRadius: 12,
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
      // Bundle Design
      bundleBgColor: "#F9FAFB",
      footerScrollBarColor: "#E5E7EB",
      // Product Page Title
      productPageTitleFontColor: "#111827",
      productPageTitleFontSize: 18,
      // Bundle Upsell
      bundleUpsellButtonBgColor: "#E5E7EB",
      bundleUpsellBorderColor: "#E5E7EB",
      bundleUpsellTextColor: "#111827",
      // Toasts
      toastBgColor: "#7132FF",
      toastTextColor: "#FFFFFF",
      // Filters
      filterIconColor: "#111827",
      filterBgColor: "#F9FAFB",
      filterTextColor: "#111827",
      // Images & Gifs
      bundleLoadingGifUrl: "",
      checkoutGifUrl: "",
    },
  };

  const mergeSettings = (dbSettings: any, defaults: any) => {
    if (!dbSettings) return defaults;

    const footerSettings = dbSettings.footerSettings as any || {};
    const stepBarSettings = dbSettings.stepBarSettings as any || {};
    const generalSettings = dbSettings.generalSettings as any || {};
    const imagesSettings = dbSettings.imagesSettings as any || {};

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
      ...footerSettings,
      ...stepBarSettings,
      ...generalSettings,
      ...imagesSettings,
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

    const generalSettings = {
      bundleBgColor: settings.bundleBgColor,
      footerScrollBarColor: settings.footerScrollBarColor,
      productPageTitleFontColor: settings.productPageTitleFontColor,
      productPageTitleFontSize: settings.productPageTitleFontSize,
      bundleUpsellButtonBgColor: settings.bundleUpsellButtonBgColor,
      bundleUpsellBorderColor: settings.bundleUpsellBorderColor,
      bundleUpsellTextColor: settings.bundleUpsellTextColor,
      toastBgColor: settings.toastBgColor,
      toastTextColor: settings.toastTextColor,
      filterIconColor: settings.filterIconColor,
      filterBgColor: settings.filterBgColor,
      filterTextColor: settings.filterTextColor,
    };

    const imagesSettings = {
      bundleLoadingGifUrl: settings.bundleLoadingGifUrl || null,
      checkoutGifUrl: settings.checkoutGifUrl || null,
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
        footerSettings: footerSettings,
        stepBarSettings: stepBarSettings,
        generalSettings: generalSettings,
        imagesSettings: imagesSettings,
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
        footerSettings: footerSettings,
        stepBarSettings: stepBarSettings,
        generalSettings: generalSettings,
        imagesSettings: imagesSettings,
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

  // Bundle Step Bar Section
  // Step Name
  const [stepNameFontColor, setStepNameFontColor] = useState(currentSettings.stepNameFontColor);
  const [stepNameFontSize, setStepNameFontSize] = useState(currentSettings.stepNameFontSize);
  // Completed Step
  const [completedStepCheckMarkColor, setCompletedStepCheckMarkColor] = useState(currentSettings.completedStepCheckMarkColor);
  const [completedStepBgColor, setCompletedStepBgColor] = useState(currentSettings.completedStepBgColor);
  const [completedStepCircleBorderColor, setCompletedStepCircleBorderColor] = useState(currentSettings.completedStepCircleBorderColor);
  const [completedStepCircleBorderRadius, setCompletedStepCircleBorderRadius] = useState(currentSettings.completedStepCircleBorderRadius);
  // Incomplete Step
  const [incompleteStepBgColor, setIncompleteStepBgColor] = useState(currentSettings.incompleteStepBgColor);
  const [incompleteStepCircleStrokeColor, setIncompleteStepCircleStrokeColor] = useState(currentSettings.incompleteStepCircleStrokeColor);
  const [incompleteStepCircleStrokeRadius, setIncompleteStepCircleStrokeRadius] = useState(currentSettings.incompleteStepCircleStrokeRadius);
  // Step Bar Progress Bar
  const [stepBarProgressFilledColor, setStepBarProgressFilledColor] = useState(currentSettings.stepBarProgressFilledColor);
  const [stepBarProgressEmptyColor, setStepBarProgressEmptyColor] = useState(currentSettings.stepBarProgressEmptyColor);
  // Tabs
  const [tabsActiveBgColor, setTabsActiveBgColor] = useState(currentSettings.tabsActiveBgColor);
  const [tabsActiveTextColor, setTabsActiveTextColor] = useState(currentSettings.tabsActiveTextColor);
  const [tabsInactiveBgColor, setTabsInactiveBgColor] = useState(currentSettings.tabsInactiveBgColor);
  const [tabsInactiveTextColor, setTabsInactiveTextColor] = useState(currentSettings.tabsInactiveTextColor);
  const [tabsBorderColor, setTabsBorderColor] = useState(currentSettings.tabsBorderColor);
  const [tabsBorderRadius, setTabsBorderRadius] = useState(currentSettings.tabsBorderRadius);

  // General Section
  // Bundle Design
  const [bundleBgColor, setBundleBgColor] = useState(currentSettings.bundleBgColor);
  const [footerScrollBarColor, setFooterScrollBarColor] = useState(currentSettings.footerScrollBarColor);
  // Product Page Title
  const [productPageTitleFontColor, setProductPageTitleFontColor] = useState(currentSettings.productPageTitleFontColor);
  const [productPageTitleFontSize, setProductPageTitleFontSize] = useState(currentSettings.productPageTitleFontSize);
  // Bundle Upsell
  const [bundleUpsellButtonBgColor, setBundleUpsellButtonBgColor] = useState(currentSettings.bundleUpsellButtonBgColor);
  const [bundleUpsellBorderColor, setBundleUpsellBorderColor] = useState(currentSettings.bundleUpsellBorderColor);
  const [bundleUpsellTextColor, setBundleUpsellTextColor] = useState(currentSettings.bundleUpsellTextColor);
  // Toasts
  const [toastBgColor, setToastBgColor] = useState(currentSettings.toastBgColor);
  const [toastTextColor, setToastTextColor] = useState(currentSettings.toastTextColor);
  // Filters
  const [filterIconColor, setFilterIconColor] = useState(currentSettings.filterIconColor);
  const [filterBgColor, setFilterBgColor] = useState(currentSettings.filterBgColor);
  const [filterTextColor, setFilterTextColor] = useState(currentSettings.filterTextColor);

  // Images & Gifs Section
  const [bundleLoadingGifUrl, setBundleLoadingGifUrl] = useState(currentSettings.bundleLoadingGifUrl || "");
  const [checkoutGifUrl, setCheckoutGifUrl] = useState(currentSettings.checkoutGifUrl || "");

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
    // Images & Gifs
    setBundleLoadingGifUrl(newSettings.bundleLoadingGifUrl || "");
    setCheckoutGifUrl(newSettings.checkoutGifUrl || "");
  }, [selectedBundleType, settings]);

  const handleOpenModal = useCallback(() => setModalActive(true), []);
  const handleCloseModal = useCallback(() => setModalActive(false), []);

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
      // Removed shopify.toast.show() to prevent duplicate toasts
    }
  }, [actionData]);

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
      buttonHoverBgColor: buttonBgColor,
      buttonAddToCartText,
      quantitySelectorBgColor,
      quantitySelectorTextColor,
      quantitySelectorFontSize,
      quantitySelectorBorderRadius,
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
      bundleLoadingGifUrl,
      checkoutGifUrl,
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
    bundleLoadingGifUrl,
    checkoutGifUrl,
    submit,
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

  // Render preview content based on active subsection
  const renderPreviewContent = () => {
    // Bundle Footer subsections
    if (["footer", "footerPrice", "footerButton", "footerDiscountProgress"].includes(activeSubSection)) {
      return (
        <div style={{ maxWidth: "800px", width: "100%" }}>
          {/* Discount Text */}
          {footerDiscountTextVisibility && (
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <Text as="p" variant="bodyMd">
                Add 5 products and get 20% off
              </Text>
            </div>
          )}

          {/* Progress Bar */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: footerProgressBarEmptyColor,
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "24%",
                  height: "100%",
                  backgroundColor: footerProgressBarFilledColor,
                }}
              />
            </div>
          </div>

          {/* Product Item */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginBottom: "24px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                backgroundColor: "#E5E5E5",
                borderRadius: "8px",
              }}
            />
            <div style={{ flex: 1 }}>
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Classic Edition...
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                €11.15 x 4
              </Text>
            </div>
          </div>

          {/* Bundle Footer */}
          <div
            style={{
              backgroundColor: footerBgColor,
              borderRadius: `${footerBorderRadius}px`,
              padding: `${footerPadding}px`,
            }}
          >
            {/* Footer Content */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Back Button */}
              <button
                style={{
                  flex: 1,
                  backgroundColor: footerBackButtonBgColor,
                  color: footerBackButtonTextColor,
                  border: `1px solid ${footerBackButtonBorderColor}`,
                  borderRadius: `${footerBackButtonBorderRadius}px`,
                  padding: "10px 20px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                Back
              </button>

              {/* Total Section */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: footerTotalBgColor,
                  padding: "12px 16px",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <Text as="p" variant="bodySm" tone="subdued">
                  Total
                </Text>
                {footerPriceVisibility && (
                  <div style={{ marginTop: "4px" }}>
                    <span
                      style={{
                        color: footerStrikePriceColor,
                        fontSize: `${footerStrikeFontSize}px`,
                        fontWeight: footerStrikeFontWeight,
                        textDecoration: "line-through",
                        marginRight: "8px",
                      }}
                    >
                      $19.99
                    </span>
                    <span
                      style={{
                        color: footerFinalPriceColor,
                        fontSize: `${footerFinalPriceFontSize}px`,
                        fontWeight: footerFinalPriceFontWeight,
                      }}
                    >
                      $19.99
                    </span>
                  </div>
                )}
              </div>

              {/* Next Button */}
              <button
                style={{
                  flex: 1,
                  backgroundColor: footerNextButtonBgColor,
                  color: footerNextButtonTextColor,
                  border: `1px solid ${footerNextButtonBorderColor}`,
                  borderRadius: `${footerNextButtonBorderRadius}px`,
                  padding: "10px 20px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                Next
              </button>
            </div>
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

    // General Section subsections
    if (["bundleDesign", "productPageTitle", "bundleUpsell", "toasts", "filters"].includes(activeSubSection)) {
      return (
        <div style={{ maxWidth: "800px", width: "100%", backgroundColor: bundleBgColor, padding: "40px", borderRadius: "12px" }}>
          {/* Product Page Title */}
          {activeSubSection === "productPageTitle" && (
            <div style={{ marginBottom: "32px" }}>
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
            </div>
          )}

          {/* Product Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "24px",
              marginBottom: "32px",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: productCardBgColor,
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "140px",
                    backgroundColor: "#E5E5E5",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                />
                <div style={{ color: productCardFontColor, fontSize: `${productCardFontSize}px`, fontWeight: productCardFontWeight, marginBottom: "8px" }}>
                  Product Name
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <span style={{ color: productStrikePriceColor, fontSize: `${productStrikeFontSize}px`, fontWeight: productStrikeFontWeight, textDecoration: "line-through", marginRight: "4px" }}>
                    $19.99
                  </span>
                  <span style={{ color: productFinalPriceColor, fontSize: `${productFinalPriceFontSize}px`, fontWeight: productFinalPriceFontWeight }}>
                    $15.99
                  </span>
                </div>
                <button
                  style={{
                    width: "100%",
                    backgroundColor: buttonBgColor,
                    color: buttonTextColor,
                    padding: "8px 12px",
                    borderRadius: `${buttonBorderRadius}px`,
                    border: "none",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Add to cart
                </button>
              </div>
            ))}
          </div>

          {/* Filters Preview */}
          {activeSubSection === "filters" && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: filterBgColor,
                padding: "8px 16px",
                borderRadius: "8px",
                marginBottom: "24px",
                border: "1px solid #E3E3E3",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 4.99509C3 3.89323 3.89262 3 4.99509 3H19.0049C20.1068 3 21 3.89262 21 4.99509V6.5C21 7.05 20.78 7.58 20.38 7.96L14.5 13.5V21L9.5 19V13.5L3.62 7.96C3.22 7.58 3 7.05 3 6.5V4.99509Z"
                  stroke={filterIconColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ color: filterTextColor, fontSize: "14px", fontWeight: 500 }}>
                Filters
              </span>
            </div>
          )}

          {/* Step Bar */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ position: "relative", marginBottom: "16px" }}>
              {/* Progress Bar */}
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
                <div
                  style={{
                    width: "47%",
                    height: "100%",
                    backgroundColor: stepBarProgressFilledColor,
                    borderRadius: "2px",
                  }}
                />
              </div>

              {/* Steps */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                {/* Step 1 */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                      <path
                        d="M20 6L9 17L4 12"
                        stroke={completedStepCheckMarkColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span style={{ color: stepNameFontColor, fontSize: "11px" }}>Step 1</span>
                </div>

                {/* Step 2 */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                      <path
                        d="M20 6L9 17L4 12"
                        stroke={completedStepCheckMarkColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span style={{ color: stepNameFontColor, fontSize: "11px" }}>Step 2</span>
                </div>

                {/* Step 3 */}
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

          {/* Bundle Upsell Button */}
          {activeSubSection === "bundleUpsell" && (
            <div style={{ marginBottom: "24px" }}>
              <button
                style={{
                  width: "100%",
                  backgroundColor: bundleUpsellButtonBgColor,
                  color: bundleUpsellTextColor,
                  border: `2px solid ${bundleUpsellBorderColor}`,
                  padding: "16px 24px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Add to Cart
              </button>
            </div>
          )}

          {/* Toast Notification */}
          {activeSubSection === "toasts" && (
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  backgroundColor: toastBgColor,
                  color: toastTextColor,
                  padding: "16px 24px",
                  borderRadius: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M20 6L9 17L4 12"
                    stroke={toastTextColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span style={{ fontSize: "14px", fontWeight: 500 }}>
                  Add at least 1 product on this step
                </span>
              </div>
            </div>
          )}

          {/* Footer with Scroll Bar indicator */}
          <div
            style={{
              backgroundColor: footerBgColor,
              borderRadius: `${footerBorderRadius}px`,
              padding: `${footerPadding}px`,
              position: "relative",
            }}
          >
            {/* Scroll Bar Preview (right side) */}
            {activeSubSection === "bundleDesign" && (
              <div
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "20px",
                  bottom: "20px",
                  width: "8px",
                  backgroundColor: "#F0F0F0",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "40%",
                    backgroundColor: footerScrollBarColor,
                    borderRadius: "4px",
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                style={{
                  flex: 1,
                  backgroundColor: footerBackButtonBgColor,
                  color: footerBackButtonTextColor,
                  border: `1px solid ${footerBackButtonBorderColor}`,
                  borderRadius: `${footerBackButtonBorderRadius}px`,
                  padding: "10px 20px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Back
              </button>

              <div
                style={{
                  flex: 1,
                  backgroundColor: footerTotalBgColor,
                  padding: "12px",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Total</div>
                <div>
                  <span
                    style={{
                      color: footerStrikePriceColor,
                      fontSize: `${footerStrikeFontSize}px`,
                      fontWeight: footerStrikeFontWeight,
                      textDecoration: "line-through",
                      marginRight: "6px",
                    }}
                  >
                    $19.99
                  </span>
                  <span
                    style={{
                      color: footerFinalPriceColor,
                      fontSize: `${footerFinalPriceFontSize}px`,
                      fontWeight: footerFinalPriceFontWeight,
                    }}
                  >
                    $15.99
                  </span>
                </div>
              </div>

              <button
                style={{
                  flex: 1,
                  backgroundColor: footerNextButtonBgColor,
                  color: footerNextButtonTextColor,
                  border: `1px solid ${footerNextButtonBorderColor}`,
                  borderRadius: `${footerNextButtonBorderRadius}px`,
                  padding: "10px 20px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Next
              </button>
            </div>
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

    // Images & Gifs subsections
    if (["bundleLoadingGif", "checkoutGif"].includes(activeSubSection)) {
      return (
        <div style={{ maxWidth: "800px", width: "100%", textAlign: "center" }}>
          {/* Bundle context showing where the gifs will appear */}
          <div style={{
            backgroundColor: "#FFFFFF",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            {activeSubSection === "bundleLoadingGif" && (
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Bundle Loading Animation</Text>
                <div style={{
                  width: "200px",
                  height: "200px",
                  margin: "0 auto",
                  backgroundColor: "#F6F6F6",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed #D9D9D9"
                }}>
                  {bundleLoadingGifUrl ? (
                    <img
                      src={bundleLoadingGifUrl}
                      alt="Bundle Loading Gif"
                      style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: "8px" }}
                    />
                  ) : (
                    <Text as="p" variant="bodySm" tone="subdued">
                      Upload a loading animation
                    </Text>
                  )}
                </div>
                <Text as="p" variant="bodyMd" tone="subdued">
                  This animation appears while the bundle is loading
                </Text>
              </BlockStack>
            )}

            {activeSubSection === "checkoutGif" && (
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Checkout Animation</Text>
                <div style={{
                  width: "300px",
                  height: "200px",
                  margin: "0 auto",
                  backgroundColor: "#F6F6F6",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed #D9D9D9"
                }}>
                  {checkoutGifUrl ? (
                    <img
                      src={checkoutGifUrl}
                      alt="Checkout Gif"
                      style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: "8px" }}
                    />
                  ) : (
                    <Text as="p" variant="bodySm" tone="subdued">
                      Upload a checkout animation
                    </Text>
                  )}
                </div>
                <Text as="p" variant="bodyMd" tone="subdued">
                  This animation appears during the checkout process
                </Text>
              </BlockStack>
            )}
          </div>

          {/* Annotation */}
          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <Text as="p" variant="bodySm" tone="subdued">
              Preview updates as you upload images
            </Text>
          </div>
        </div>
      );
    }

    // Product Card subsections (default)
    return (
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

      case "footer":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Footer
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: footerBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("footerBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="footerBgColorInput"
                    type="color"
                    value={footerBgColor}
                    onChange={(e) => setFooterBgColor(e.target.value)}
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
                    {footerBgColor}
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
                    backgroundColor: footerTotalBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("footerTotalBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="footerTotalBgColorInput"
                    type="color"
                    value={footerTotalBgColor}
                    onChange={(e) => setFooterTotalBgColor(e.target.value)}
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
                    Total Background Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {footerTotalBgColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

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
                Prices
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
                <BlockStack gap="300">
                  <InlineStack gap="300" align="start" blockAlign="center">
                    <div
                      style={{
                        width: "41px",
                        height: "41px",
                        borderRadius: "50%",
                        backgroundColor: footerFinalPriceColor,
                        border: "1px solid #E3E3E3",
                        cursor: "pointer",
                        position: "relative",
                      }}
                      onClick={() => {
                        const input = document.getElementById("footerFinalPriceColorInput");
                        if (input) input.click();
                      }}
                    >
                      <input
                        id="footerFinalPriceColorInput"
                        type="color"
                        value={footerFinalPriceColor}
                        onChange={(e) => setFooterFinalPriceColor(e.target.value)}
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
                        {footerFinalPriceColor}
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </BlockStack>

                <RangeSlider
                  label="Final Price Font Size"
                  value={footerFinalPriceFontSize}
                  onChange={(value) => setFooterFinalPriceFontSize(value as number)}
                  min={14}
                  max={28}
                  output
                />

                <RangeSlider
                  label="Final Price Font Weight"
                  value={footerFinalPriceFontWeight}
                  onChange={(value) => setFooterFinalPriceFontWeight(value as number)}
                  min={400}
                  max={900}
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
                        backgroundColor: footerStrikePriceColor,
                        border: "1px solid #E3E3E3",
                        cursor: "pointer",
                        position: "relative",
                      }}
                      onClick={() => {
                        const input = document.getElementById("footerStrikePriceColorInput");
                        if (input) input.click();
                      }}
                    >
                      <input
                        id="footerStrikePriceColorInput"
                        type="color"
                        value={footerStrikePriceColor}
                        onChange={(e) => setFooterStrikePriceColor(e.target.value)}
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
                        {footerStrikePriceColor}
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </BlockStack>

                <RangeSlider
                  label="Strikethrough Font Size"
                  value={footerStrikeFontSize}
                  onChange={(value) => setFooterStrikeFontSize(value as number)}
                  min={10}
                  max={20}
                  output
                />

                <RangeSlider
                  label="Strikethrough Font Weight"
                  value={footerStrikeFontWeight}
                  onChange={(value) => setFooterStrikeFontWeight(value as number)}
                  min={300}
                  max={700}
                  step={100}
                  output
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

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: footerBackButtonBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("footerBackButtonBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="footerBackButtonBgColorInput"
                    type="color"
                    value={footerBackButtonBgColor}
                    onChange={(e) => setFooterBackButtonBgColor(e.target.value)}
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
                    Back Button Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {footerBackButtonBgColor}
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
                    backgroundColor: footerBackButtonTextColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("footerBackButtonTextColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="footerBackButtonTextColorInput"
                    type="color"
                    value={footerBackButtonTextColor}
                    onChange={(e) => setFooterBackButtonTextColor(e.target.value)}
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
                    Back Button Text Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {footerBackButtonTextColor}
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
                    backgroundColor: footerBackButtonBorderColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("footerBackButtonBorderColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="footerBackButtonBorderColorInput"
                    type="color"
                    value={footerBackButtonBorderColor}
                    onChange={(e) => setFooterBackButtonBorderColor(e.target.value)}
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
                    Back Button Border Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {footerBackButtonBorderColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <RangeSlider
              label="Back Button Border Radius"
              value={footerBackButtonBorderRadius}
              onChange={(value) => setFooterBackButtonBorderRadius(value as number)}
              min={0}
              max={24}
              output
            />

            <Divider />

            <Text as="h3" variant="headingSm">
              Next Button
            </Text>

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: footerNextButtonBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("footerNextButtonBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="footerNextButtonBgColorInput"
                    type="color"
                    value={footerNextButtonBgColor}
                    onChange={(e) => setFooterNextButtonBgColor(e.target.value)}
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
                    Next Button Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {footerNextButtonBgColor}
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
                    backgroundColor: footerNextButtonTextColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("footerNextButtonTextColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="footerNextButtonTextColorInput"
                    type="color"
                    value={footerNextButtonTextColor}
                    onChange={(e) => setFooterNextButtonTextColor(e.target.value)}
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
                    Next Button Text Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {footerNextButtonTextColor}
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
                    backgroundColor: footerNextButtonBorderColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("footerNextButtonBorderColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="footerNextButtonBorderColorInput"
                    type="color"
                    value={footerNextButtonBorderColor}
                    onChange={(e) => setFooterNextButtonBorderColor(e.target.value)}
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
                    Next Button Border Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {footerNextButtonBorderColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <RangeSlider
              label="Next Button Border Radius"
              value={footerNextButtonBorderRadius}
              onChange={(value) => setFooterNextButtonBorderRadius(value as number)}
              min={0}
              max={24}
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

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: footerProgressBarFilledColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("footerProgressBarFilledColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="footerProgressBarFilledColorInput"
                    type="color"
                    value={footerProgressBarFilledColor}
                    onChange={(e) => setFooterProgressBarFilledColor(e.target.value)}
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
                    {footerProgressBarFilledColor}
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
                    backgroundColor: footerProgressBarEmptyColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("footerProgressBarEmptyColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="footerProgressBarEmptyColorInput"
                    type="color"
                    value={footerProgressBarEmptyColor}
                    onChange={(e) => setFooterProgressBarEmptyColor(e.target.value)}
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
                    {footerProgressBarEmptyColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        );

      // ========== BUNDLE STEP BAR SECTION ==========
      case "stepName":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Step Name
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: stepNameFontColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("stepNameFontColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="stepNameFontColorInput"
                    type="color"
                    value={stepNameFontColor}
                    onChange={(e) => setStepNameFontColor(e.target.value)}
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
                    Step Name Font Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {stepNameFontColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <RangeSlider
              label="Font Size"
              value={stepNameFontSize}
              onChange={(value) => setStepNameFontSize(value as number)}
              min={12}
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
      case "bundleDesign":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Bundle Design
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: bundleBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("bundleBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="bundleBgColorInput"
                    type="color"
                    value={bundleBgColor}
                    onChange={(e) => setBundleBgColor(e.target.value)}
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
                    Bundle Background Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {bundleBgColor}
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
                    backgroundColor: footerScrollBarColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("footerScrollBarColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="footerScrollBarColorInput"
                    type="color"
                    value={footerScrollBarColor}
                    onChange={(e) => setFooterScrollBarColor(e.target.value)}
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
                    Footer Scroll Bar Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {footerScrollBarColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        );

      case "productPageTitle":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Product Page Title
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: productPageTitleFontColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("productPageTitleFontColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="productPageTitleFontColorInput"
                    type="color"
                    value={productPageTitleFontColor}
                    onChange={(e) => setProductPageTitleFontColor(e.target.value)}
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
                    Font Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {productPageTitleFontColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>

            <RangeSlider
              label="Font Size"
              value={productPageTitleFontSize}
              onChange={(value) => setProductPageTitleFontSize(value as number)}
              min={12}
              max={32}
              output
            />
          </BlockStack>
        );

      case "bundleUpsell":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Bundle Upsell
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: bundleUpsellButtonBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("bundleUpsellButtonBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="bundleUpsellButtonBgColorInput"
                    type="color"
                    value={bundleUpsellButtonBgColor}
                    onChange={(e) => setBundleUpsellButtonBgColor(e.target.value)}
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
                    Button Background
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {bundleUpsellButtonBgColor}
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
                    backgroundColor: bundleUpsellBorderColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("bundleUpsellBorderColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="bundleUpsellBorderColorInput"
                    type="color"
                    value={bundleUpsellBorderColor}
                    onChange={(e) => setBundleUpsellBorderColor(e.target.value)}
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
                    Border Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {bundleUpsellBorderColor}
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
                    backgroundColor: bundleUpsellTextColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("bundleUpsellTextColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="bundleUpsellTextColorInput"
                    type="color"
                    value={bundleUpsellTextColor}
                    onChange={(e) => setBundleUpsellTextColor(e.target.value)}
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
                    {bundleUpsellTextColor}
                  </Text>
                </BlockStack>
              </InlineStack>
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

      case "filters":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Filters
            </Text>
            <Divider />

            <BlockStack gap="300">
              <InlineStack gap="300" align="start" blockAlign="center">
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    borderRadius: "50%",
                    backgroundColor: filterIconColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("filterIconColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="filterIconColorInput"
                    type="color"
                    value={filterIconColor}
                    onChange={(e) => setFilterIconColor(e.target.value)}
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
                    Icon Color
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {filterIconColor}
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
                    backgroundColor: filterBgColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("filterBgColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="filterBgColorInput"
                    type="color"
                    value={filterBgColor}
                    onChange={(e) => setFilterBgColor(e.target.value)}
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
                    {filterBgColor}
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
                    backgroundColor: filterTextColor,
                    border: "1px solid #E3E3E3",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    const input = document.getElementById("filterTextColorInput");
                    if (input) input.click();
                  }}
                >
                  <input
                    id="filterTextColorInput"
                    type="color"
                    value={filterTextColor}
                    onChange={(e) => setFilterTextColor(e.target.value)}
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
                    {filterTextColor}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        );

      case "bundleLoadingGif":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Bundle Loading Gif
            </Text>
            <Divider />

            <BlockStack gap="300">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Upload Loading Animation
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Choose a GIF or image to display while your bundle is loading
              </Text>

              {bundleLoadingGifUrl && (
                <div style={{
                  width: "100%",
                  padding: "16px",
                  backgroundColor: "#F6F6F6",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <img
                    src={bundleLoadingGifUrl}
                    alt="Bundle Loading Gif Preview"
                    style={{
                      maxWidth: "150px",
                      maxHeight: "150px",
                      borderRadius: "8px"
                    }}
                  />
                </div>
              )}

              <TextField
                label="Image URL"
                value={bundleLoadingGifUrl}
                onChange={setBundleLoadingGifUrl}
                placeholder="https://example.com/loading.gif"
                autoComplete="off"
                helpText="Enter the URL of your loading animation"
              />

              <ButtonGroup>
                <Button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*,.gif';
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // In a real implementation, upload to Shopify Files API
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setBundleLoadingGifUrl(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                >
                  Browse Files
                </Button>
                {bundleLoadingGifUrl && (
                  <Button
                    variant="plain"
                    tone="critical"
                    onClick={() => setBundleLoadingGifUrl("")}
                  >
                    Remove
                  </Button>
                )}
              </ButtonGroup>
            </BlockStack>
          </BlockStack>
        );

      case "checkoutGif":
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Checkout Gif
            </Text>
            <Divider />

            <BlockStack gap="300">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Upload Checkout Animation
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Choose a GIF or image to display during the checkout process
              </Text>

              {checkoutGifUrl && (
                <div style={{
                  width: "100%",
                  padding: "16px",
                  backgroundColor: "#F6F6F6",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <img
                    src={checkoutGifUrl}
                    alt="Checkout Gif Preview"
                    style={{
                      maxWidth: "150px",
                      maxHeight: "150px",
                      borderRadius: "8px"
                    }}
                  />
                </div>
              )}

              <TextField
                label="Image URL"
                value={checkoutGifUrl}
                onChange={setCheckoutGifUrl}
                placeholder="https://example.com/checkout.gif"
                autoComplete="off"
                helpText="Enter the URL of your checkout animation"
              />

              <ButtonGroup>
                <Button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*,.gif';
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // In a real implementation, upload to Shopify Files API
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setCheckoutGifUrl(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                >
                  Browse Files
                </Button>
                {checkoutGifUrl && (
                  <Button
                    variant="plain"
                    tone="critical"
                    onClick={() => setCheckoutGifUrl("")}
                  >
                    Remove
                  </Button>
                )}
              </ButtonGroup>
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
        <Modal
          open={modalActive}
          onClose={handleCloseModal}
          title="Customisations"
          size="large"
          primaryAction={{
            content: "Save",
            onAction: handleSaveSettings,
            loading: isLoading,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: handleCloseModal,
            },
          ]}
        >
        <Modal.Section flush>
          <div style={{ display: "flex", height: "80vh", minHeight: "700px", maxWidth: "100%", overflowX: "hidden" }}>
            {/* Left Sidebar - Navigation */}
            <div
              style={{
                width: "269px",
                minWidth: "269px",
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

              {/* Bundle Footer Section */}
              <NavigationItem
                label="Bundle Footer"
                sectionKey="bundleFooter"
                hasChildren
              />
              <Collapsible open={expandedSection === "bundleFooter"} id="bundleFooter-collapsible">
                <NavigationItem
                  label="Footer"
                  sectionKey="footer"
                  isChild
                  onClick={() => handleSubSectionClick("footer")}
                />
                <NavigationItem
                  label="Price"
                  sectionKey="footerPrice"
                  isChild
                  onClick={() => handleSubSectionClick("footerPrice")}
                />
                <NavigationItem
                  label="Button"
                  sectionKey="footerButton"
                  isChild
                  onClick={() => handleSubSectionClick("footerButton")}
                />
                <NavigationItem
                  label="Discount Text & Progress Bar"
                  sectionKey="footerDiscountProgress"
                  isChild
                  onClick={() => handleSubSectionClick("footerDiscountProgress")}
                />
              </Collapsible>

              {/* Bundle Step Bar Section */}
              <NavigationItem
                label="Bundle Step Bar"
                sectionKey="bundleStepBar"
                hasChildren
              />
              <Collapsible open={expandedSection === "bundleStepBar"} id="bundleStepBar-collapsible">
                <NavigationItem
                  label="Step Name"
                  sectionKey="stepName"
                  isChild
                  onClick={() => handleSubSectionClick("stepName")}
                />
                <NavigationItem
                  label="Completed Step"
                  sectionKey="completedStep"
                  isChild
                  onClick={() => handleSubSectionClick("completedStep")}
                />
                <NavigationItem
                  label="Incomplete Step"
                  sectionKey="incompleteStep"
                  isChild
                  onClick={() => handleSubSectionClick("incompleteStep")}
                />
                <NavigationItem
                  label="Progress Bar"
                  sectionKey="stepBarProgressBar"
                  isChild
                  onClick={() => handleSubSectionClick("stepBarProgressBar")}
                />
                <NavigationItem
                  label="Tabs"
                  sectionKey="stepBarTabs"
                  isChild
                  onClick={() => handleSubSectionClick("stepBarTabs")}
                />
              </Collapsible>

              {/* General Section */}
              <NavigationItem
                label="General"
                sectionKey="general"
                hasChildren
              />
              <Collapsible open={expandedSection === "general"} id="general-collapsible">
                <NavigationItem
                  label="Bundle Design"
                  sectionKey="bundleDesign"
                  isChild
                  onClick={() => handleSubSectionClick("bundleDesign")}
                />
                <NavigationItem
                  label="Product Page Title"
                  sectionKey="productPageTitle"
                  isChild
                  onClick={() => handleSubSectionClick("productPageTitle")}
                />
                <NavigationItem
                  label="Bundle Upsell"
                  sectionKey="bundleUpsell"
                  isChild
                  onClick={() => handleSubSectionClick("bundleUpsell")}
                />
                <NavigationItem
                  label="Toasts"
                  sectionKey="toasts"
                  isChild
                  onClick={() => handleSubSectionClick("toasts")}
                />
                <NavigationItem
                  label="Filters"
                  sectionKey="filters"
                  isChild
                  onClick={() => handleSubSectionClick("filters")}
                />
              </Collapsible>

              {/* Images & Gifs Section */}
              <NavigationItem
                label="Images & Gifs"
                sectionKey="imagesGifs"
                hasChildren
              />
              <Collapsible open={expandedSection === "imagesGifs"} id="imagesGifs-collapsible">
                <NavigationItem
                  label="Bundle Loading Gif"
                  sectionKey="bundleLoadingGif"
                  isChild
                  onClick={() => handleSubSectionClick("bundleLoadingGif")}
                />
                <NavigationItem
                  label="Checkout Gif"
                  sectionKey="checkoutGif"
                  isChild
                  onClick={() => handleSubSectionClick("checkoutGif")}
                />
              </Collapsible>
            </div>

            {/* Right Side - Visual Preview + Settings */}
            <div style={{ flex: 1, display: "flex", overflowY: "auto", minWidth: 0 }}>
              {/* Center - Visual Preview */}
              <div
                style={{
                  flex: 1,
                  padding: "40px",
                  backgroundColor: "#F4F4F4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 0,
                  overflowX: "hidden",
                }}
              >
                {renderPreviewContent()}
              </div>

              {/* Right Panel - Settings Controls */}
              <div
                style={{
                  width: "285px",
                  minWidth: "285px",
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
