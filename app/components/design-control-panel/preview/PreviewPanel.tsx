import type { DesignSettings } from "../../../types/state.types";
import { BundleType } from "../../../constants/bundle";
import { ProductCardPreview } from "./ProductCardPreview";
import { BundleFooterPreview } from "./BundleFooterPreview";
import { BundleHeaderPreview } from "./BundleHeaderPreview";
import { GeneralPreview } from "./GeneralPreview";
import { PromoBannerPreview } from "./PromoBannerPreview";
import { GlobalColorsPreview } from "./GlobalColorsPreview";
import { TierPillPreview } from "./TierPillPreview";
import { PreviewScope } from "./PreviewScope";
import { StorefrontIframePreview } from "./StorefrontIframePreview";

interface PreviewPanelProps {
  activeSubSection: string;
  settings: DesignSettings;
  bundleType: BundleType;
  /** True when the merchant has unsaved changes — switches to CSS component preview mode. */
  isDirty: boolean;
  /**
   * Storefront URL to load in the iframe preview.
   * When null/undefined, the iframe mode is skipped and the CSS preview is always shown.
   */
  previewUrl?: string | null;
  /** Increments on each successful save to trigger an iframe reload. */
  saveCount: number;
}

/**
 * PreviewPanel — dual-mode preview orchestrator.
 *
 * SAVED mode   (!isDirty && previewUrl): scaled storefront iframe — shows the full page
 *              exactly as a shopper sees it, after the latest save is persisted.
 *
 * EDITING mode (isDirty || !previewUrl): CSS-variable component previews — update on
 *              every keystroke with zero network round-trips.
 *
 * All component-mode sub-previews (except GlobalColors) are wrapped in PreviewScope,
 * which injects the real widget CSS and sets --bundle-* CSS variables from settings.
 */
export function PreviewPanel({ activeSubSection, settings, bundleType, isDirty, previewUrl, saveCount }: PreviewPanelProps) {
  // ── Saved mode: show the live storefront in a scaled, read-only iframe ────────
  if (!isDirty && previewUrl) {
    return <StorefrontIframePreview url={previewUrl} saveCount={saveCount} />;
  }

  // ── Editing mode: CSS-variable component previews (unchanged below) ───────────

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

  // Tier Pills subsection (Full-page bundles only)
  if (activeSubSection === "tierPills") {
    return (
      <PreviewScope settings={settings}>
        <TierPillPreview />
      </PreviewScope>
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
          bundleType={bundleType}
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

  // General subsections (emptyState, addToCartButton, toasts, and Phase 1 additions)
  if (["emptyState", "addToCartButton", "toasts", "modalCloseButton", "accessibility"].includes(activeSubSection)) {
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
          toastBorderRadius={settings.toastBorderRadius}
          toastBorderColor={settings.toastBorderColor}
          toastBorderWidth={settings.toastBorderWidth}
          toastFontSize={settings.toastFontSize}
          toastFontWeight={settings.toastFontWeight}
          toastAnimationDuration={settings.toastAnimationDuration}
          toastBoxShadow={settings.toastBoxShadow}
          toastEnterFromBottom={settings.toastEnterFromBottom}
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
