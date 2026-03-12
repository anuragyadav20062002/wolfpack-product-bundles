import { Banner, Text } from "@shopify/polaris";
import type { SettingsPanelProps } from "./types";

// Import all settings components
import { GlobalColorsSettings } from "./GlobalColorsSettings";
import { ProductCardSettings } from "./ProductCardSettings";
import { ProductCardTypographySettings } from "./ProductCardTypographySettings";
import { ButtonSettings } from "./ButtonSettings";
import { QuantityVariantSettings } from "./QuantityVariantSettings";
import { FooterSettings } from "./FooterSettings";
import { FooterPriceSettings } from "./FooterPriceSettings";
import { FooterButtonSettings } from "./FooterButtonSettings";
import { FooterDiscountProgressSettings } from "./FooterDiscountProgressSettings";
import { HeaderTabsSettings } from "./HeaderTabsSettings";
import { HeaderTextSettings } from "./HeaderTextSettings";
import { CompletedStepSettings } from "./CompletedStepSettings";
import { IncompleteStepSettings } from "./IncompleteStepSettings";
import { StepBarProgressBarSettings } from "./StepBarProgressBarSettings";
import { StepBarTabsSettings } from "./StepBarTabsSettings";
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
import { ModalCloseButtonSettings } from "./ModalCloseButtonSettings";
import { AddedButtonStateSettings } from "./AddedButtonStateSettings";

/**
 * SettingsPanel - Orchestrator component that renders the appropriate
 * settings panel based on the active subsection.
 */
export function SettingsPanel({
  activeSubSection,
  settings,
  onUpdate,
  onBatchUpdate,
  customCssHelpOpen,
  setCustomCssHelpOpen,
}: SettingsPanelProps) {
  switch (activeSubSection) {
    case "globalColors":
      return <GlobalColorsSettings settings={settings} onUpdate={onUpdate} />;

    case "productCard":
      return <ProductCardSettings settings={settings} onUpdate={onUpdate} />;

    case "productCardTypography":
      return <ProductCardTypographySettings settings={settings} onUpdate={onUpdate} />;

    case "button":
      return <ButtonSettings settings={settings} onUpdate={onUpdate} />;

    case "addedButtonState":
      return <AddedButtonStateSettings settings={settings} onUpdate={onUpdate} />;

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

    case "completedStep":
      return <CompletedStepSettings settings={settings} onUpdate={onUpdate} />;

    case "incompleteStep":
      return <IncompleteStepSettings settings={settings} onUpdate={onUpdate} />;

    case "stepBarProgressBar":
      return <StepBarProgressBarSettings settings={settings} onUpdate={onUpdate} />;

    case "stepBarTabs":
      return <StepBarTabsSettings settings={settings} onUpdate={onUpdate} />;

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

    case "modalCloseButton":
      return <ModalCloseButtonSettings settings={settings} onUpdate={onUpdate} />;

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
