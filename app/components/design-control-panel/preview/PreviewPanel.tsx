import type { DesignSettings } from "../../../types/state.types";
import { ProductCardPreview } from "./ProductCardPreview";
import { BundleFooterPreview } from "./BundleFooterPreview";
import { BundleHeaderPreview } from "./BundleHeaderPreview";
import { GeneralPreview } from "./GeneralPreview";
import { StepBarPreview } from "./StepBarPreview";
import { PromoBannerPreview } from "./PromoBannerPreview";
import { GlobalColorsPreview } from "./GlobalColorsPreview";
import { PreviewScope } from "./PreviewScope";

interface PreviewPanelProps {
  activeSubSection: string;
  settings: DesignSettings;
}

/**
 * PreviewPanel - Orchestrator component that renders the appropriate
 * preview based on the active subsection.
 *
 * All sub-previews (except GlobalColors which is a colour-swatch palette)
 * are wrapped in PreviewScope, which injects the real widget CSS and sets
 * all --bundle-* CSS variables from the current settings.
 */
export function PreviewPanel({ activeSubSection, settings }: PreviewPanelProps) {
  // Custom CSS - No preview needed
  if (activeSubSection === "customCss") {
    return null;
  }

  // Global Colors - intentional simplified swatch palette, not a widget preview
  if (activeSubSection === "globalColors") {
    return (
      <GlobalColorsPreview
        globalPrimaryButtonColor={settings.globalPrimaryButtonColor}
        globalButtonTextColor={settings.globalButtonTextColor}
        globalPrimaryTextColor={settings.globalPrimaryTextColor}
        globalSecondaryTextColor={settings.globalSecondaryTextColor}
        globalFooterBgColor={settings.globalFooterBgColor}
        globalFooterTextColor={settings.globalFooterTextColor}
      />
    );
  }

  // Promo Banner subsection (Full-page bundles only)
  if (activeSubSection === "promoBanner") {
    return (
      <PreviewScope settings={settings}>
        <PromoBannerPreview
          promoBannerEnabled={settings.promoBannerEnabled}
          promoBannerBgColor={settings.promoBannerBgColor}
        />
      </PreviewScope>
    );
  }

  // Bundle Footer subsections (including quantityBadge from Phase 1)
  if (["footer", "footerPrice", "footerButton", "footerDiscountProgress", "quantityBadge"].includes(activeSubSection)) {
    return (
      <PreviewScope settings={settings}>
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
          successMessageFontSize={settings.successMessageFontSize}
          successMessageFontWeight={settings.successMessageFontWeight}
          successMessageTextColor={settings.successMessageTextColor}
          successMessageBgColor={settings.successMessageBgColor}
        />
      </PreviewScope>
    );
  }

  // Bundle Header subsections
  if (["headerTabs", "headerText"].includes(activeSubSection)) {
    return (
      <PreviewScope settings={settings}>
        <BundleHeaderPreview activeSubSection={activeSubSection} />
      </PreviewScope>
    );
  }

  // Bundle Step Bar subsections
  if (["stepName", "completedStep", "incompleteStep", "stepBarProgressBar", "stepBarTabs"].includes(activeSubSection)) {
    return (
      <PreviewScope settings={settings}>
        <StepBarPreview activeSubSection={activeSubSection} />
      </PreviewScope>
    );
  }

  // General subsections (emptyState, addToCartButton, toasts, and Phase 1 additions)
  if (["emptyState", "addToCartButton", "toasts", "loadingState", "modalCloseButton", "accessibility"].includes(activeSubSection)) {
    return (
      <PreviewScope settings={settings}>
        <GeneralPreview
          activeSubSection={activeSubSection}
          addToCartButtonBgColor={settings.addToCartButtonBgColor}
          addToCartButtonTextColor={settings.addToCartButtonTextColor}
          addToCartButtonBorderRadius={settings.addToCartButtonBorderRadius}
          buttonAddToCartText={settings.buttonAddToCartText}
          toastBgColor={settings.toastBgColor}
          toastTextColor={settings.toastTextColor}
        />
      </PreviewScope>
    );
  }

  // Product Card subsections (default): productCard, productCardTypography, button,
  // quantityVariantSelector, productCardContent (modal)
  return (
    <PreviewScope settings={settings}>
      <ProductCardPreview activeSubSection={activeSubSection} />
    </PreviewScope>
  );
}
