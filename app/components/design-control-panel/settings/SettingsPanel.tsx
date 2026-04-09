import { useState } from "react";
import { Banner, Text, Divider } from "@shopify/polaris";
import type { SettingsPanelProps } from "./types";
import type { DesignSettings } from "../../../types/state.types";
import { GlobalColorsSettings } from "./GlobalColorsSettings";
import { ProductCardSettings } from "./ProductCardSettings";
import { ProductCardTypographySettings } from "./ProductCardTypographySettings";
import { ButtonSettings } from "./ButtonSettings";
import { AddedButtonStateSettings } from "./AddedButtonStateSettings";
import { QuantityVariantSettings } from "./QuantityVariantSettings";
import { FooterSettings } from "./FooterSettings";
import { FooterPriceSettings } from "./FooterPriceSettings";
import { FooterButtonSettings } from "./FooterButtonSettings";
import { FooterDiscountProgressSettings } from "./FooterDiscountProgressSettings";
import { HeaderTabsSettings } from "./HeaderTabsSettings";
import { HeaderTextSettings } from "./HeaderTextSettings";
import { EmptyStateSettings } from "./EmptyStateSettings";
import { AddToCartButtonSettings } from "./AddToCartButtonSettings";
import { ToastsSettings } from "./ToastsSettings";
import { CustomCssSettings } from "./CustomCssSettings";
import { PromoBannerSettings } from "./PromoBannerSettings";
import { SearchInputSettings } from "./SearchInputSettings";
import { SkeletonSettings } from "./SkeletonSettings";
import { QuantityBadgeSettings } from "./QuantityBadgeSettings";
import { TypographySettings } from "./TypographySettings";
import { AccessibilitySettings } from "./AccessibilitySettings";
import { WidgetStyleSettings } from "./WidgetStyleSettings";
import { TierPillSettings } from "./TierPillSettings";
import { ModalCloseButtonSettings } from "./ModalCloseButtonSettings";
import { FPBBadgesSettings } from "./FPBBadgesSettings";
import { PDPBadgeSettings } from "./PDPBadgeSettings";

/**
 * Maps each section key to the DesignSettings keys it controls.
 * Used to scope the "Reset to defaults" action to the current section only.
 */
const SECTION_KEYS: Partial<Record<string, Array<keyof DesignSettings>>> = {
  globalColors: [
    "globalPrimaryButtonColor", "globalButtonTextColor", "globalPrimaryTextColor",
    "globalSecondaryTextColor", "globalFooterBgColor", "globalFooterTextColor",
  ],
  productCard: [
    "productCardBgColor", "productCardFontColor", "productCardFontSize", "productCardFontWeight",
    "productCardImageFit", "productCardsPerRow", "productTitleVisibility", "productPriceVisibility",
    "productPriceBgColor", "productCardWidth", "productCardHeight", "productCardSpacing",
    "productCardBorderRadius", "productCardPadding", "productCardMargin", "productCardBorderWidth",
    "productCardBorderColor", "productCardShadow", "productCardHoverShadow",
    "productCardHoverTranslateY", "productCardTransitionDuration",
    "productImageHeight", "productImageBorderRadius", "productImageBgColor",
    // Merged from productCardTypography
    "productStrikePriceColor", "productStrikeFontSize", "productStrikeFontWeight",
    "productFinalPriceColor", "productFinalPriceFontSize", "productFinalPriceFontWeight",
  ],
  button: [
    "buttonBgColor", "buttonTextColor", "buttonFontSize", "buttonFontWeight",
    "buttonBorderRadius", "buttonHoverBgColor", "buttonAddToCartText",
    // Merged from addedButtonState
    "buttonAddedBgColor", "buttonAddedTextColor",
  ],
  quantityVariantSelector: [
    "quantitySelectorBgColor", "quantitySelectorTextColor", "quantitySelectorFontSize",
    "quantitySelectorBorderRadius", "variantSelectorBgColor", "variantSelectorTextColor",
    "variantSelectorBorderRadius",
  ],
  footer: ["footerBgColor", "footerTotalBgColor", "footerBorderRadius", "footerPadding"],
  footerPrice: [
    "footerFinalPriceColor", "footerFinalPriceFontSize", "footerFinalPriceFontWeight",
    "footerStrikePriceColor", "footerStrikeFontSize", "footerStrikeFontWeight",
    "footerPriceVisibility",
  ],
  footerButton: [
    "footerBackButtonBgColor", "footerBackButtonTextColor", "footerBackButtonBorderColor",
    "footerBackButtonBorderRadius", "footerNextButtonBgColor", "footerNextButtonTextColor",
    "footerNextButtonBorderColor", "footerNextButtonBorderRadius", "footerDiscountTextVisibility",
  ],
  footerDiscountProgress: [
    "successMessageFontSize", "successMessageFontWeight",
    "successMessageTextColor", "successMessageBgColor",
  ],
  headerTabs: [
    "headerTabActiveBgColor", "headerTabActiveTextColor", "headerTabInactiveBgColor",
    "headerTabInactiveTextColor", "headerTabRadius", "conditionsTextColor", "conditionsTextFontSize",
    "discountTextColor", "discountTextFontSize", "stepNameFontColor", "stepNameFontSize",
    "completedStepCheckMarkColor", "completedStepBgColor", "completedStepCircleBorderColor",
    "completedStepCircleBorderRadius", "incompleteStepBgColor", "incompleteStepCircleStrokeColor",
    "incompleteStepCircleStrokeRadius", "stepBarProgressFilledColor", "stepBarProgressEmptyColor",
  ],
  headerText: [
    "tabsActiveBgColor", "tabsActiveTextColor", "tabsInactiveBgColor",
    "tabsInactiveTextColor", "tabsBorderColor", "tabsBorderRadius",
  ],
  emptyState: [
    "emptyStateCardBgColor", "emptyStateCardBorderColor",
    "emptyStateTextColor", "emptyStateBorderStyle",
  ],
  addToCartButton: [
    "addToCartButtonBgColor", "addToCartButtonTextColor", "addToCartButtonBorderRadius",
    "discountPillBgColor", "discountPillTextColor", "discountPillFontSize",
    "discountPillFontWeight", "discountPillBorderRadius",
  ],
  toasts: [
    "toastBgColor", "toastTextColor", "toastBorderRadius", "toastBorderColor",
    "toastBorderWidth", "toastFontSize", "toastFontWeight", "toastAnimationDuration",
    "toastBoxShadow", "toastEnterFromBottom",
  ],
  typography: [
    "buttonTextTransform", "buttonLetterSpacing",
    "productPageTitleFontColor", "productPageTitleFontSize",
  ],
  accessibility: ["focusOutlineColor", "focusOutlineWidth"],
  widgetStyle: [
    "widgetStyle", "bottomSheetOverlayOpacity", "bottomSheetAnimationDuration",
    "bundleBgColor", "drawerBgColor", "footerScrollBarColor",
  ],
  searchInput: [
    "searchInputBgColor", "searchInputBorderColor", "searchInputFocusBorderColor",
    "searchInputTextColor", "searchInputPlaceholderColor",
    "searchClearButtonBgColor", "searchClearButtonColor",
  ],
  skeletonLoading: ["skeletonBaseBgColor", "skeletonShimmerColor", "skeletonHighlightColor"],
  quantityBadge: ["tileQuantityBadgeBgColor", "tileQuantityBadgeTextColor"],
  modalCloseButton: ["modalCloseButtonColor", "modalCloseButtonBgColor", "modalCloseButtonHoverColor"],
  promoBanner: [
    "promoBannerEnabled", "promoBannerBgColor", "promoBannerTitleColor",
    "promoBannerTitleFontSize", "promoBannerTitleFontWeight", "promoBannerSubtitleColor",
    "promoBannerSubtitleFontSize", "promoBannerNoteColor", "promoBannerNoteFontSize",
    "promoBannerBorderRadius", "promoBannerPadding",
  ],
  tierPills: [
    "tierPillActiveBgColor", "tierPillActiveTextColor", "tierPillInactiveBgColor",
    "tierPillInactiveTextColor", "tierPillHoverBgColor", "tierPillBorderColor",
    "tierPillBorderRadius", "tierPillHeight", "tierPillGap", "tierPillFontSize",
    "tierPillFontWeight",
  ],
  fpbBadges: [
    "freeGiftBadgeUrl", "freeGiftBadgePosition",
    "includedBadgeUrl", "includedBadgePosition",
  ],
  pdpBadge: ["freeGiftBadgeUrl", "freeGiftBadgePosition"],
};

/**
 * SettingsPanel - Orchestrator component that renders the appropriate
 * settings panel based on the active subsection.
 * Includes a "Reset to defaults" button scoped to the current section's keys.
 */
export function SettingsPanel({
  activeSubSection,
  settings,
  onUpdate,
  onBatchUpdate,
  customCssHelpOpen,
  setCustomCssHelpOpen,
  defaultSettings,
}: SettingsPanelProps) {
  const sectionKeys = SECTION_KEYS[activeSubSection];
  const canReset = !!(defaultSettings && sectionKeys && sectionKeys.length > 0);
  const [pendingReset, setPendingReset] = useState(false);

  function handleResetSection() {
    if (!defaultSettings || !sectionKeys) return;
    const patch: Partial<DesignSettings> = {};
    for (const key of sectionKeys) {
      (patch as Record<string, unknown>)[key] = defaultSettings[key];
    }
    onBatchUpdate(patch);
    setPendingReset(false);
  }

  function wrapWithReset(content: React.ReactNode) {
    if (!canReset) return <>{content}</>;
    return (
      <>
        {pendingReset ? (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "10px",
            padding: "14px 16px",
            marginBottom: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#991B1B" }}>
                Reset this section to defaults?
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#B91C1C" }}>
                All changes in this section will be lost.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setPendingReset(false)}
                style={{
                  background: "#fff",
                  color: "#374151",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  lineHeight: "1.4",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetSection}
                style={{
                  background: "#DC2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  lineHeight: "1.4",
                }}
              >
                Yes, reset
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
            <button
              onClick={() => setPendingReset(true)}
              style={{
                background: "transparent",
                color: "#B91C1C",
                border: "1px solid #FECACA",
                borderRadius: "6px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                lineHeight: "1.4",
                transition: "background 0.12s, color 0.12s, border-color 0.12s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "#DC2626";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#DC2626";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#B91C1C";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#FECACA";
              }}
            >
              Reset to defaults
            </button>
          </div>
        )}
        <Divider />
        {content}
      </>
    );
  }

  function renderSection() {
    switch (activeSubSection) {
      case "globalColors":
        return <GlobalColorsSettings settings={settings} onUpdate={onUpdate} />;
      case "productCard":
        return (
          <>
            <ProductCardSettings settings={settings} onUpdate={onUpdate} />
            <Divider />
            <ProductCardTypographySettings settings={settings} onUpdate={onUpdate} />
          </>
        );
      case "button":
        return (
          <>
            <ButtonSettings settings={settings} onUpdate={onUpdate} />
            <Divider />
            <AddedButtonStateSettings settings={settings} onUpdate={onUpdate} />
          </>
        );
      case "quantityVariantSelector":
        return <QuantityVariantSettings settings={settings} onUpdate={onUpdate} />;
      case "footer":
        return <FooterSettings settings={settings} onUpdate={onUpdate} />;
      case "footerPrice":
        return <FooterPriceSettings settings={settings} onUpdate={onUpdate} />;
      case "footerButton":
        return <FooterButtonSettings settings={settings} onUpdate={onUpdate} onBatchUpdate={onBatchUpdate} />;
      case "footerDiscountProgress":
        return <FooterDiscountProgressSettings settings={settings} onUpdate={onUpdate} />;
      case "headerTabs":
        return <HeaderTabsSettings settings={settings} onUpdate={onUpdate} />;
      case "headerText":
        return <HeaderTextSettings settings={settings} onUpdate={onUpdate} />;
      case "emptyState":
        return <EmptyStateSettings settings={settings} onUpdate={onUpdate} />;
      case "addToCartButton":
        return <AddToCartButtonSettings settings={settings} onUpdate={onUpdate} />;
      case "toasts":
        return <ToastsSettings settings={settings} onUpdate={onUpdate} />;
      case "promoBanner":
        return <PromoBannerSettings settings={settings} onUpdate={onUpdate} />;
      case "searchInput":
        return <SearchInputSettings settings={settings} onUpdate={onUpdate} />;
      case "skeletonLoading":
        return <SkeletonSettings settings={settings} onUpdate={onUpdate} />;
      case "quantityBadge":
        return <QuantityBadgeSettings settings={settings} onUpdate={onUpdate} />;
      case "typography":
        return <TypographySettings settings={settings} onUpdate={onUpdate} />;
      case "accessibility":
        return <AccessibilitySettings settings={settings} onUpdate={onUpdate} />;
      case "widgetStyle":
        return <WidgetStyleSettings settings={settings} onUpdate={onUpdate} />;
      case "tierPills":
        return <TierPillSettings settings={settings} onUpdate={onUpdate} />;
      case "modalCloseButton":
        return <ModalCloseButtonSettings settings={settings} onUpdate={onUpdate} />;
      case "fpbBadges":
        return <FPBBadgesSettings settings={settings} onUpdate={onUpdate} />;
      case "pdpBadge":
        return <PDPBadgeSettings settings={settings} onUpdate={onUpdate} />;
      case "customCss":
        return (
          <CustomCssSettings
            settings={settings}
            onUpdate={onUpdate}
            customCssHelpOpen={customCssHelpOpen}
            setCustomCssHelpOpen={setCustomCssHelpOpen}
          />
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
  }

  return wrapWithReset(renderSection());
}
