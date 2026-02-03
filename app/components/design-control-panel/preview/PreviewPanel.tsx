import type { DesignSettings } from "../../../types/state.types";
import { ProductCardPreview } from "./ProductCardPreview";
import { BundleFooterPreview } from "./BundleFooterPreview";
import { BundleHeaderPreview } from "./BundleHeaderPreview";
import { GeneralPreview } from "./GeneralPreview";
import { StepBarPreview } from "./StepBarPreview";
import { PromoBannerPreview } from "./PromoBannerPreview";

interface PreviewPanelProps {
  activeSubSection: string;
  settings: DesignSettings;
}

/**
 * PreviewPanel - Orchestrator component that renders the appropriate
 * preview based on the active subsection.
 */
export function PreviewPanel({ activeSubSection, settings }: PreviewPanelProps) {
  // Global Colors and Custom CSS - No preview needed
  if (activeSubSection === "globalColors" || activeSubSection === "customCss") {
    return null;
  }

  // Promo Banner subsection (Full-page bundles only)
  if (activeSubSection === "promoBanner") {
    return (
      <PromoBannerPreview
        promoBannerEnabled={settings.promoBannerEnabled}
        promoBannerBgColor={settings.promoBannerBgColor}
        promoBannerTitleColor={settings.promoBannerTitleColor}
        promoBannerTitleFontSize={settings.promoBannerTitleFontSize}
        promoBannerTitleFontWeight={settings.promoBannerTitleFontWeight}
        promoBannerSubtitleColor={settings.promoBannerSubtitleColor}
        promoBannerSubtitleFontSize={settings.promoBannerSubtitleFontSize}
        promoBannerNoteColor={settings.promoBannerNoteColor}
        promoBannerNoteFontSize={settings.promoBannerNoteFontSize}
        promoBannerBorderRadius={settings.promoBannerBorderRadius}
        promoBannerPadding={settings.promoBannerPadding}
      />
    );
  }

  // Bundle Footer subsections
  if (["footer", "footerPrice", "footerButton", "footerDiscountProgress"].includes(activeSubSection)) {
    return (
      <BundleFooterPreview
        activeSubSection={activeSubSection}
        footerBgColor={settings.footerBgColor}
        footerBorderRadius={settings.footerBorderRadius}
        footerPadding={settings.footerPadding}
        footerTotalBgColor={settings.footerTotalBgColor}
        footerStrikePriceColor={settings.footerStrikePriceColor}
        footerStrikeFontSize={settings.footerStrikeFontSize}
        footerStrikeFontWeight={settings.footerStrikeFontWeight}
        footerFinalPriceColor={settings.footerFinalPriceColor}
        footerFinalPriceFontSize={settings.footerFinalPriceFontSize}
        footerFinalPriceFontWeight={settings.footerFinalPriceFontWeight}
        footerPriceVisibility={settings.footerPriceVisibility}
        footerBackButtonBgColor={settings.footerBackButtonBgColor}
        footerBackButtonTextColor={settings.footerBackButtonTextColor}
        footerBackButtonBorderColor={settings.footerBackButtonBorderColor}
        footerBackButtonBorderRadius={settings.footerBackButtonBorderRadius}
        footerNextButtonBgColor={settings.footerNextButtonBgColor}
        footerNextButtonTextColor={settings.footerNextButtonTextColor}
        footerNextButtonBorderColor={settings.footerNextButtonBorderColor}
        footerNextButtonBorderRadius={settings.footerNextButtonBorderRadius}
        footerDiscountTextVisibility={settings.footerDiscountTextVisibility}
        footerProgressBarFilledColor={settings.footerProgressBarFilledColor}
        footerProgressBarEmptyColor={settings.footerProgressBarEmptyColor}
        successMessageFontSize={settings.successMessageFontSize}
        successMessageFontWeight={settings.successMessageFontWeight}
        successMessageTextColor={settings.successMessageTextColor}
        successMessageBgColor={settings.successMessageBgColor}
      />
    );
  }

  // Bundle Header subsections
  if (["headerTabs", "headerText"].includes(activeSubSection)) {
    return (
      <BundleHeaderPreview
        activeSubSection={activeSubSection}
        headerTabActiveBgColor={settings.headerTabActiveBgColor}
        headerTabActiveTextColor={settings.headerTabActiveTextColor}
        headerTabInactiveBgColor={settings.headerTabInactiveBgColor}
        headerTabInactiveTextColor={settings.headerTabInactiveTextColor}
        headerTabRadius={settings.headerTabRadius}
        conditionsTextColor={settings.conditionsTextColor}
        conditionsTextFontSize={settings.conditionsTextFontSize}
        discountTextColor={settings.discountTextColor}
        discountTextFontSize={settings.discountTextFontSize}
      />
    );
  }

  // Bundle Step Bar subsections
  if (["stepName", "completedStep", "incompleteStep", "stepBarProgressBar", "stepBarTabs"].includes(activeSubSection)) {
    return <StepBarPreview activeSubSection={activeSubSection} settings={settings} />;
  }

  // General subsections (emptyState, addToCartButton, toasts)
  if (["emptyState", "addToCartButton", "toasts"].includes(activeSubSection)) {
    return (
      <GeneralPreview
        activeSubSection={activeSubSection}
        emptyStateCardBgColor={settings.emptyStateCardBgColor}
        emptyStateBorderStyle={settings.emptyStateBorderStyle}
        emptyStateCardBorderColor={settings.emptyStateCardBorderColor}
        emptyStateTextColor={settings.emptyStateTextColor}
        addToCartButtonBgColor={settings.addToCartButtonBgColor}
        addToCartButtonTextColor={settings.addToCartButtonTextColor}
        addToCartButtonBorderRadius={settings.addToCartButtonBorderRadius}
        buttonAddToCartText={settings.buttonAddToCartText}
        toastBgColor={settings.toastBgColor}
        toastTextColor={settings.toastTextColor}
      />
    );
  }

  // Product Card subsections (default) - productCard, productCardTypography, button, quantityVariantSelector
  return (
    <ProductCardPreview
      productCardBgColor={settings.productCardBgColor}
      productCardFontColor={settings.productCardFontColor}
      productCardFontSize={settings.productCardFontSize}
      productCardFontWeight={settings.productCardFontWeight}
      productCardImageFit={settings.productCardImageFit}
      productTitleVisibility={settings.productTitleVisibility}
      productPriceVisibility={settings.productPriceVisibility}
      productPriceBgColor={settings.productPriceBgColor}
      productStrikePriceColor={settings.productStrikePriceColor}
      productStrikeFontSize={settings.productStrikeFontSize}
      productStrikeFontWeight={settings.productStrikeFontWeight}
      productFinalPriceColor={settings.productFinalPriceColor}
      productFinalPriceFontSize={settings.productFinalPriceFontSize}
      productFinalPriceFontWeight={settings.productFinalPriceFontWeight}
      variantSelectorBgColor={settings.variantSelectorBgColor}
      variantSelectorTextColor={settings.variantSelectorTextColor}
      variantSelectorBorderRadius={settings.variantSelectorBorderRadius}
      quantitySelectorBgColor={settings.quantitySelectorBgColor}
      quantitySelectorTextColor={settings.quantitySelectorTextColor}
      quantitySelectorBorderRadius={settings.quantitySelectorBorderRadius}
      buttonBgColor={settings.buttonBgColor}
      buttonTextColor={settings.buttonTextColor}
      buttonBorderRadius={settings.buttonBorderRadius}
      buttonFontSize={settings.buttonFontSize}
      buttonFontWeight={settings.buttonFontWeight}
      buttonAddToCartText={settings.buttonAddToCartText}
      productCardWidth={settings.productCardWidth}
      productCardHeight={settings.productCardHeight}
      productCardSpacing={settings.productCardSpacing}
      productCardBorderRadius={settings.productCardBorderRadius}
      productCardPadding={settings.productCardPadding}
      productCardBorderWidth={settings.productCardBorderWidth}
      productCardBorderColor={settings.productCardBorderColor}
      productCardShadow={settings.productCardShadow}
      productCardHoverShadow={settings.productCardHoverShadow}
      productImageHeight={settings.productImageHeight}
      productImageBorderRadius={settings.productImageBorderRadius}
      productImageBgColor={settings.productImageBgColor}
      modalBgColor={settings.modalBgColor}
      modalBorderRadius={settings.modalBorderRadius}
      modalTitleFontSize={settings.modalTitleFontSize}
      modalTitleFontWeight={settings.modalTitleFontWeight}
      modalPriceFontSize={settings.modalPriceFontSize}
      modalVariantBorderRadius={settings.modalVariantBorderRadius}
      modalButtonBgColor={settings.modalButtonBgColor}
      modalButtonTextColor={settings.modalButtonTextColor}
      modalButtonBorderRadius={settings.modalButtonBorderRadius}
    />
  );
}
