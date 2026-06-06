/**
 * CSS Variables Generator
 *
 * Generates CSS custom properties (:root block) from design settings.
 */

import type { CSSGenerationContext } from "./types";

/**
 * Emits four positional CSS variables for a badge given a position string.
 * position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
 */
function buildBadgePositionVars(name: string, position: string): string {
  const isTop = !position.startsWith('bottom');
  const isLeft = !position.endsWith('right');
  return `--bundle-${name}-badge-top: ${isTop ? '6px' : 'auto'};
  --bundle-${name}-badge-bottom: ${isTop ? 'auto' : '6px'};
  --bundle-${name}-badge-left: ${isLeft ? '6px' : 'auto'};
  --bundle-${name}-badge-right: ${isLeft ? 'auto' : '6px'};`;
}

function readPath(source: unknown, path: string): unknown {
  if (!source || typeof source !== 'object') return undefined;
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

function cssValue(value: unknown, fallback: string): string {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function cssPx(value: unknown, fallback: string): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number') return `${value}px`;
  const raw = String(value).trim();
  if (!raw) return fallback;
  if (raw.toLowerCase().endsWith('px') || raw.startsWith('calc(')) return raw;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? `${parsed}px` : fallback;
}

function cssWeight(value: unknown, fallback: string): string {
  if (value === null || value === undefined || value === '') return fallback;
  const raw = String(value).trim().toLowerCase();
  if (raw === 'bold') return '700';
  if (raw === 'regular') return '400';
  return String(value);
}

function designPath(settings: Record<string, unknown>, path: string, fallback: string): string {
  return cssValue(readPath(settings.pageCustomization, path), fallback);
}

function designPx(settings: Record<string, unknown>, path: string, fallback: string): string {
  return cssPx(readPath(settings.pageCustomization, path), fallback);
}

function designWeight(settings: Record<string, unknown>, path: string, fallback: string): string {
  return cssWeight(readPath(settings.pageCustomization, path), fallback);
}

function generateEBDcpRootAliases(ctx: CSSGenerationContext): string {
  const s = ctx.settings as Record<string, unknown>;
  const productCardBg = designPath(s, 'mixAndMatchConfig.productCard.productCardBgColor', cssValue(s.productCardBgColor, '#FFFFFF'));
  const cardRadius = designPx(s, 'mixAndMatchConfig.productCard.productCardBorderRadius', cssPx(s.productCardBorderRadius, '10px'));
  const imageRadius = designPx(s, 'mixAndMatchConfig.productCard.productCardImageBorderRadius', cssPx(s.productImageBorderRadius, '8px'));
  const imageFit = designPath(s, 'mixAndMatchConfig.productCard.productCardImageFit', cssValue(s.productCardImageFit, 'cover'));
  const titleColor = designPath(s, 'mixAndMatchConfig.productCard.productCardTitleColor', cssValue(s.productCardFontColor, ctx.globalPrimaryText));
  const titleFont = designPx(s, 'mixAndMatchConfig.productCard.productCardTitleFont', cssPx(s.productCardFontSize, '16px'));
  const titleWeight = designWeight(s, 'mixAndMatchConfig.productCard.productCardTitleWeight', cssWeight(s.productCardFontWeight, '700'));
  const priceColor = designPath(s, 'mixAndMatchConfig.productCard.productCardPriceColor', cssValue(s.productFinalPriceColor, ctx.globalPrimaryText));
  const priceFont = designPx(s, 'mixAndMatchConfig.productCard.productCardPriceFont', cssPx(s.productFinalPriceFontSize, '16px'));
  const priceWeight = designWeight(s, 'mixAndMatchConfig.productCard.productCardPriceWeight', cssWeight(s.productFinalPriceFontWeight, '700'));
  const comparedAtPriceColor = designPath(s, 'mixAndMatchConfig.productCard.productCardComparedAtPriceColor', cssValue(s.productStrikePriceColor, ctx.globalPrimaryText));
  const comparedAtPriceFont = designPx(s, 'mixAndMatchConfig.productCard.productCardComparedAtPriceFont', cssPx(s.productStrikeFontSize, '14px'));
  const comparedAtPriceWeight = designWeight(s, 'mixAndMatchConfig.productCard.productCardComparedAtPriceWeight', cssWeight(s.productStrikeFontWeight, '400'));
  const buttonBg = designPath(s, 'mixAndMatchConfig.productCard.productCardButtonBgColor', cssValue(s.buttonBgColor, ctx.globalPrimaryButton));
  const buttonText = designPath(s, 'mixAndMatchConfig.productCard.productCardButtonTextColor', cssValue(s.buttonTextColor, ctx.globalButtonText));
  const buttonRadius = designPx(s, 'mixAndMatchConfig.productCard.productCardButtonBorderRadius', cssPx(s.buttonBorderRadius, '5px'));
  const variantText = designPath(s, 'mixAndMatchConfig.productCard.productCardVariantSelectorTextColor', cssValue(s.variantSelectorTextColor, ctx.globalPrimaryText));
  const variantFontSize = designPx(s, 'mixAndMatchConfig.productCard.productCardVariantSelectorFontSize', '14px');
  const variantFontWeight = designWeight(s, 'mixAndMatchConfig.productCard.productCardVariantSelectorFontWeight', '400');
  const tabsActiveBg = designPath(s, 'mixAndMatchConfig.tabs.tabsActiveBgColor', cssValue(s.tabsActiveBgColor, ctx.globalPrimaryButton));
  const tabsActiveText = designPath(s, 'mixAndMatchConfig.tabs.tabsActiveTextColor', cssValue(s.tabsActiveTextColor, ctx.globalButtonText));
  const tabsInactiveBg = designPath(s, 'mixAndMatchConfig.tabs.tabsInactiveBgColor', cssValue(s.tabsInactiveBgColor, '#F4F9F9'));
  const tabsInactiveText = designPath(s, 'mixAndMatchConfig.tabs.tabsInactiveTextColor', cssValue(s.tabsInactiveTextColor, ctx.globalPrimaryText));
  const tabsRadius = designPx(s, 'mixAndMatchConfig.tabs.tabsBorderRadius', cssPx(s.tabsBorderRadius, buttonRadius));
  const footerBg = designPath(s, 'mixAndMatchConfig.footer.footerBgColor', cssValue(s.footerBgColor, ctx.globalFooterBg));
  const footerText = designPath(s, 'mixAndMatchConfig.footer.footerTextColor', cssValue(s.footerTextColor, ctx.globalFooterText));
  const footerNextBg = designPath(s, 'mixAndMatchConfig.footer.footerNextBtnBgColor', cssValue(s.footerNextButtonBgColor, ctx.globalPrimaryButton));
  const footerNextText = designPath(s, 'mixAndMatchConfig.footer.footerNextBtnTextColor', cssValue(s.footerNextButtonTextColor, ctx.globalButtonText));
  const footerBackBg = designPath(s, 'cartFooter.cartFooterBackButtonColor', cssValue(s.footerBackButtonBgColor, '#6d7175'));
  const footerBackText = designPath(s, 'mixAndMatchConfig.footer.footerBackBtnTextColor', cssValue(s.footerBackButtonTextColor, ctx.globalFooterText));
  const footerFinalPrice = designPath(s, 'mixAndMatchConfig.footer.footerFinalPriceColor', cssValue(s.footerFinalPriceColor, ctx.globalPrimaryText));
  const footerRadius = designPx(s, 'mixAndMatchConfig.footer.footerBorderRadius', cssPx(s.footerBorderRadius, cardRadius));
  const footerButtonRadius = designPx(s, 'mixAndMatchConfig.footer.footerButtonsBorderRadius', cssPx(s.footerNextButtonBorderRadius, buttonRadius));
  const emptyBg = designPath(s, 'mixAndMatchConfig.emptyStateCard.emptyStateCardBgColor', cssValue(s.emptyStateCardBgColor, productCardBg));
  const emptyBorder = designPath(s, 'mixAndMatchConfig.emptyStateCard.emptyStateCardBorderColor', cssValue(s.emptyStateCardBorderColor, buttonBg));
  const emptyText = designPath(s, 'mixAndMatchConfig.emptyStateCard.emptyStateCardTextColor', cssValue(s.emptyStateTextColor, buttonBg));
  const headerConditionFont = designPx(s, 'mixAndMatchConfig.bundleHeader.headerConditionTextFont', titleFont);
  const headerDiscountFont = designPx(s, 'mixAndMatchConfig.bundleHeader.headerDiscountTextFont', comparedAtPriceFont);
  const headerDiscountText = designPath(s, 'mixAndMatchConfig.bundleHeader.headerDiscountTextColor', comparedAtPriceColor);
  const progressEmpty = designPath(s, 'mixAndMatchConfig.footer.footerDiscountProgressBarEmptyColor', '#C1E7C5');
  const progressFilled = designPath(s, 'mixAndMatchConfig.footer.footerDiscountProgressBarFilledColor', buttonBg);

  return `
  /* EB SETTINGS DESIGN ALIASES */
  --product-card-bg-color: ${productCardBg};
  --product-card-border-radius: ${cardRadius};
  --product-card-image-border-radius: ${imageRadius};
  --product-card-image-fit: ${imageFit};
  --product-card-title-color: ${titleColor};
  --product-card-title-font: ${titleFont};
  --product-card-title-weight: ${titleWeight};
  --product-card-price-color: ${priceColor};
  --product-card-price-font: ${priceFont};
  --product-card-price-weight: ${priceWeight};
  --product-card-compared-at-price-color: ${comparedAtPriceColor};
  --product-card-compared-at-price-font: ${comparedAtPriceFont};
  --product-card-compared-at-price-weight: ${comparedAtPriceWeight};
  --product-card-button-bg-color: ${buttonBg};
  --product-card-button-text-color: ${buttonText};
  --product-card-button-border-radius: ${buttonRadius};
  --product-card-variant-selector-text-color: ${variantText};
  --product-card-variant-selector-font-size: ${variantFontSize};
  --product-card-variant-selector-font-weight: ${variantFontWeight};
  --tabs-active-bg-color: ${tabsActiveBg};
  --tabs-active-text-color: ${tabsActiveText};
  --tabs-inactive-bg-color: ${tabsInactiveBg};
  --tabs-inactive-text-color: ${tabsInactiveText};
  --tabs-border-radius: ${tabsRadius};
  --footer-bg-color: ${footerBg};
  --footer-text-color: ${footerText};
  --footer-next-btn-bg-color: ${footerNextBg};
  --footer-next-btn-text-color: ${footerNextText};
  --footer-back-btn-bg-color: ${footerBackBg};
  --footer-back-btn-text-color: ${footerBackText};
  --footer-final-price-color: ${footerFinalPrice};
  --footer-border-radius: ${footerRadius};
  --footer-buttons-border-radius: ${footerButtonRadius};
  --empty-state-card-bg-color: ${emptyBg};
  --empty-state-card-border-color: ${emptyBorder};
  --empty-state-card-text-color: ${emptyText};
  --header-condition-text-font: ${headerConditionFont};
  --header-discount-text-font: ${headerDiscountFont};
  --header-discount-text-color: ${headerDiscountText};
  --footer-discount-progress-bar-empty-color: ${progressEmpty};
  --footer-discount-progress-bar-filled-color: ${progressFilled};`;
}

export function generateEBDcpBridgeCSS(ctx: CSSGenerationContext): string {
  const s = ctx.settings as Record<string, unknown>;
  const primaryColor = designPath(s, 'mixAndMatchConfig.productCard.productCardButtonBgColor', cssValue(s.buttonBgColor, ctx.globalPrimaryButton));
  const buttonText = designPath(s, 'mixAndMatchConfig.productCard.productCardButtonTextColor', cssValue(s.buttonTextColor, ctx.globalButtonText));
  const primaryText = designPath(s, 'mixAndMatchConfig.productCard.productCardTitleColor', cssValue(s.productCardFontColor, ctx.globalPrimaryText));
  const secondaryColor = designPath(s, 'mixAndMatchConfig.tabs.tabsInactiveBgColor', cssValue(s.tabsInactiveBgColor, '#F4F9F9'));
  const cartBg = designPath(s, 'mixAndMatchConfig.footer.footerBgColor', cssValue(s.footerBgColor, ctx.globalFooterBg));
  const cartText = designPath(s, 'mixAndMatchConfig.footer.footerTextColor', cssValue(s.footerTextColor, ctx.globalFooterText));
  const buttonRadius = designPx(s, 'mixAndMatchConfig.productCard.productCardButtonBorderRadius', cssPx(s.buttonBorderRadius, '5px'));
  const cardRadius = designPx(s, 'mixAndMatchConfig.productCard.productCardBorderRadius', cssPx(s.productCardBorderRadius, '10px'));
  const primaryFont = designPx(s, 'mixAndMatchConfig.productCard.productCardTitleFont', cssPx(s.productCardFontSize, '16px'));
  const primaryWeight = designWeight(s, 'mixAndMatchConfig.productCard.productCardTitleWeight', cssWeight(s.productCardFontWeight, '700'));
  const secondaryFont = designPx(s, 'mixAndMatchConfig.bundleHeader.headerDiscountTextFont', cssPx(s.productStrikeFontSize, '14px'));
  const bodyFont = designPx(s, 'mixAndMatchConfig.productCard.productCardVariantSelectorFontSize', '14px');
  const imageFit = designPath(s, 'mixAndMatchConfig.productCard.productCardImageFit', cssValue(s.productCardImageFit, 'cover'));

  return `
body[gbb-mix-consolidated-design="true"] {
  --gbbMix-primary-color: var(--product-card-button-bg-color, ${primaryColor});
  --gbbMix-primary-button-text-color: var(--product-card-button-text-color, ${buttonText});
  --gbbMix-primary-text-color: var(--product-card-title-color, ${primaryText});
  --gbbMix-secondary-color: var(--tabs-inactive-bg-color, ${secondaryColor});
  --gbbMix-cart-bg-color: var(--footer-bg-color, ${cartBg});
  --gbbMix-cart-text-color: var(--footer-text-color, ${cartText});
  --gbbMix-button-border-radius: var(--product-card-button-border-radius, ${buttonRadius});
  --gbbMix-card-border-radius: var(--product-card-border-radius, ${cardRadius});
  --gbbMix-primary-font-size: var(--product-card-title-font, ${primaryFont});
  --gbbMix-primary-font-weight: var(--product-card-title-weight, ${primaryWeight});
  --gbbMix-secondary-font-size: var(--header-discount-text-font, ${secondaryFont});
  --gbbMix-body-font-size: var(--product-card-variant-selector-font-size, ${bodyFont});
  --gbbMix-image-fit: var(--product-card-image-fit, ${imageFit});
}

body[gbb-mix-consolidated-design="true"][gbbmix-template-type="PDP_INPAGE"] {
  --gbbMix-primary-font-size: calc(var(--product-card-title-font, 16px) - 2px);
  --gbbMix-secondary-font-size: calc(var(--header-discount-text-font, 14px) - 2px);
  --gbbMix-body-font-size: calc(var(--product-card-variant-selector-font-size, 14px) - 2px);
}`;
}

/**
 * Generate all CSS custom properties for the :root block
 */
export function generateCSSVariables(ctx: CSSGenerationContext): string {
  const { settings: s, globalPrimaryButton, globalButtonText, globalPrimaryText, globalSecondaryText, globalFooterBg, globalFooterText } = ctx;

  return `
  /* GLOBAL COLORS */
  --bundle-global-primary-button: ${globalPrimaryButton};
  --bundle-global-button-text: ${globalButtonText};
  --bundle-global-primary-text: ${globalPrimaryText};
  --bundle-global-secondary-text: ${globalSecondaryText};
  --bundle-global-footer-bg: ${globalFooterBg};
  --bundle-global-footer-text: ${globalFooterText};

  /* PRODUCT CARD */
  --bundle-product-card-bg: ${s.productCardBgColor || '#F8F8F8'};
  --bundle-product-card-font-color: ${s.productCardFontColor || globalPrimaryText};
  --bundle-product-card-font-size: ${s.productCardFontSize || 20}px;
  --bundle-product-card-font-weight: ${s.productCardFontWeight || 600};
  --bundle-product-card-image-fit: ${s.productCardImageFit || 'cover'};
  --bundle-product-cards-per-row: ${s.productCardsPerRow || 4};
  --bundle-product-title-display: ${s.productTitleVisibility !== false ? 'block' : 'none'};
  --bundle-product-price-bg-color: ${s.productPriceBgColor || '#F0F8F0'};
  --bundle-product-strike-price-color: ${s.productStrikePriceColor || globalSecondaryText};
  --bundle-product-strike-font-size: ${s.productStrikeFontSize || 14}px;
  --bundle-product-strike-font-weight: ${s.productStrikeFontWeight || 400};
  --bundle-product-final-price-color: ${s.productFinalPriceColor || globalPrimaryText};
  --bundle-product-final-price-font-size: ${s.productFinalPriceFontSize || 18}px;
  --bundle-product-final-price-font-weight: ${s.productFinalPriceFontWeight || 700};

  /* BUTTON */
  --bundle-button-bg: ${s.buttonBgColor || '#111111'};
  --bundle-button-text-color: ${s.buttonTextColor || globalButtonText};
  --bundle-button-font-size: ${s.buttonFontSize || 16}px;
  --bundle-button-font-weight: ${s.buttonFontWeight || 600};
  --bundle-button-border-radius: ${s.buttonBorderRadius || 50}px;
  --bundle-button-hover-bg: ${s.buttonHoverBgColor || s.buttonBgColor || globalPrimaryButton};
  --bundle-button-added-bg: ${s.buttonAddedBgColor || '#10B981'};
  --bundle-button-added-text: ${s.buttonAddedTextColor || '#FFFFFF'};

  /* VARIANT SELECTOR */
  --bundle-variant-selector-bg: ${s.variantSelectorBgColor || '#FFFFFF'};
  --bundle-variant-selector-text-color: ${s.variantSelectorTextColor || globalPrimaryText};
  --bundle-variant-selector-border-radius: ${s.variantSelectorBorderRadius || 8}px;

  /* QUANTITY SELECTOR */
  --bundle-quantity-selector-bg: ${s.quantitySelectorBgColor || '#5f5d5d'};
  --bundle-quantity-selector-text-color: ${s.quantitySelectorTextColor || globalButtonText};
  --bundle-quantity-selector-font-size: ${s.quantitySelectorFontSize || 16}px;
  --bundle-quantity-selector-border-radius: ${s.quantitySelectorBorderRadius || 8}px;

  /* PRODUCT CARD LAYOUT & DIMENSIONS (Phase 6) */
  --bundle-product-card-width: ${s.productCardWidth || 280}px;
  --bundle-product-card-height: ${s.productCardHeight || 420}px;
  --bundle-product-card-spacing: ${s.productCardSpacing || 12}px;
  --bundle-product-card-border-radius: ${s.productCardBorderRadius || 16}px;
  --bundle-product-card-padding: ${s.productCardPadding || 12}px;
  --bundle-product-card-border-width: ${s.productCardBorderWidth || 1}px;
  --bundle-product-card-border-color: ${s.productCardBorderColor || '#ECECEC'};
  --bundle-product-card-shadow: ${s.productCardShadow || '0 2px 8px rgba(0,0,0,0.04)'};
  --bundle-product-card-hover-shadow: ${s.productCardHoverShadow || '0 8px 24px rgba(0,0,0,0.12)'};

  /* PRODUCT IMAGE (Phase 6) */
  --bundle-product-image-height: ${s.productImageHeight || 280}px;
  --bundle-product-image-border-radius: ${s.productImageBorderRadius || 6}px;
  --bundle-product-image-bg-color: ${s.productImageBgColor || '#F8F8F8'};

  /* PRODUCT MODAL STYLING (Phase 6) */
  --bundle-modal-bg-color: ${s.modalBgColor || '#FFFFFF'};
  --bundle-modal-border-radius: ${s.modalBorderRadius || 12}px;
  --bundle-modal-title-font-size: ${s.modalTitleFontSize || 28}px;
  --bundle-modal-title-font-weight: ${s.modalTitleFontWeight || 700};
  --bundle-modal-price-font-size: ${s.modalPriceFontSize || 22}px;
  --bundle-modal-variant-border-radius: ${s.modalVariantBorderRadius || 8}px;
  --bundle-modal-button-bg-color: ${s.modalButtonBgColor || '#000000'};
  --bundle-modal-button-text-color: ${s.modalButtonTextColor || '#FFFFFF'};
  --bundle-modal-button-border-radius: ${s.modalButtonBorderRadius || 8}px;

  /* PROMO BANNER (Full-Page Bundles) */
  --bundle-promo-banner-enabled: ${s.promoBannerEnabled !== false ? '1' : '0'};
  --bundle-promo-banner-bg: ${s.promoBannerBgColor || '#F3F4F6'};
  --bundle-promo-banner-title-color: ${s.promoBannerTitleColor || '#111827'};
  --bundle-promo-banner-title-font-size: ${s.promoBannerTitleFontSize || 28}px;
  --bundle-promo-banner-title-font-weight: ${s.promoBannerTitleFontWeight || 700};
  --bundle-promo-banner-subtitle-color: ${s.promoBannerSubtitleColor || '#6B7280'};
  --bundle-promo-banner-subtitle-font-size: ${s.promoBannerSubtitleFontSize || 16}px;
  --bundle-promo-banner-note-color: ${s.promoBannerNoteColor || '#9CA3AF'};
  --bundle-promo-banner-note-font-size: ${s.promoBannerNoteFontSize || 14}px;
  --bundle-promo-banner-radius: ${s.promoBannerBorderRadius || 16}px;
  --bundle-promo-banner-padding: ${s.promoBannerPadding || 32}px;

  /* FOOTER */
  --bundle-footer-bg: ${s.footerBgColor || globalFooterBg};
  --bundle-footer-total-bg: ${s.footerTotalBgColor || '#F6F6F6'};
  --bundle-footer-border-radius: ${s.footerBorderRadius || 8}px;
  --bundle-footer-padding: ${s.footerPadding || 16}px;
  --bundle-footer-final-price-color: ${s.footerFinalPriceColor || globalPrimaryText};
  --bundle-footer-final-price-font-size: ${s.footerFinalPriceFontSize || 18}px;
  --bundle-footer-final-price-font-weight: ${s.footerFinalPriceFontWeight || 700};
  --bundle-footer-strike-price-color: ${s.footerStrikePriceColor || globalSecondaryText};
  --bundle-footer-strike-font-size: ${s.footerStrikeFontSize || 14}px;
  --bundle-footer-strike-font-weight: ${s.footerStrikeFontWeight || 400};
  --bundle-footer-price-display: ${s.footerPriceVisibility !== false ? 'flex' : 'none'};
  --bundle-footer-back-button-bg: ${s.footerBackButtonBgColor || '#FFFFFF'};
  --bundle-footer-back-button-text: ${s.footerBackButtonTextColor || globalFooterText};
  --bundle-footer-back-button-border: ${s.footerBackButtonBorderColor || '#E3E3E3'};
  --bundle-footer-back-button-radius: ${s.footerBackButtonBorderRadius || 8}px;
  --bundle-footer-next-button-bg: ${s.footerNextButtonBgColor || globalPrimaryButton};
  --bundle-footer-next-button-text: ${s.footerNextButtonTextColor || globalButtonText};
  --bundle-footer-next-button-border: ${s.footerNextButtonBorderColor || globalPrimaryButton};
  --bundle-footer-next-button-radius: ${s.footerNextButtonBorderRadius || 8}px;
  --bundle-footer-discount-display: ${s.footerDiscountTextVisibility !== false ? 'block' : 'none'};
  --bundle-sidebar-card-bg: ${s.sidebarCardBgColor || '#FFFFFF'};
  --bundle-sidebar-card-text: ${s.sidebarCardTextColor || globalPrimaryText};
  --bundle-sidebar-card-border-color: ${s.sidebarCardBorderColor || '#E5E7EB'};
  --bundle-sidebar-card-border-width: ${s.sidebarCardBorderWidth ?? 1}px;
  --bundle-sidebar-card-radius: ${s.sidebarCardBorderRadius ?? 10}px;
  --bundle-sidebar-card-padding: ${s.sidebarCardPadding ?? 20}px;
  --bundle-sidebar-card-width: ${s.sidebarCardWidth ?? 360}px;
  --bundle-sidebar-sticky-offset: ${s.sidebarStickyOffset ?? 85}px;
  --bundle-sidebar-products-max-height: ${s.sidebarProductListMaxHeight ?? 320}px;
  --bundle-sidebar-skeleton-row-4-display: ${(s.sidebarSkeletonRowCount ?? 3) >= 4 ? 'flex' : 'none'};
  --bundle-sidebar-skeleton-row-5-display: ${(s.sidebarSkeletonRowCount ?? 3) >= 5 ? 'flex' : 'none'};
  --bundle-sidebar-discount-bg: ${s.sidebarDiscountBgColor || '#F3F7F3'};
  --bundle-sidebar-discount-text: ${s.sidebarDiscountTextColor || '#2E7D32'};
  --bundle-sidebar-button-bg: ${s.sidebarButtonBgColor || s.footerNextButtonBgColor || globalPrimaryButton};
  --bundle-sidebar-button-text: ${s.sidebarButtonTextColor || s.footerNextButtonTextColor || globalButtonText};
  --bundle-sidebar-button-radius: ${s.sidebarButtonBorderRadius ?? s.footerNextButtonBorderRadius ?? 8}px;
  --bundle-success-message-font-size: ${s.successMessageFontSize || 16}px;
  --bundle-success-message-font-weight: ${s.successMessageFontWeight || 600};
  --bundle-success-message-text-color: ${s.successMessageTextColor || '#065F46'};
  --bundle-success-message-bg-color: ${s.successMessageBgColor || '#D1FAE5'};

  /* BUNDLE HEADER */
  --bundle-header-tab-active-bg: ${s.headerTabActiveBgColor || globalPrimaryButton};
  --bundle-header-tab-active-text: ${s.headerTabActiveTextColor || globalButtonText};
  --bundle-header-tab-inactive-bg: ${s.headerTabInactiveBgColor || '#FFFFFF'};
  --bundle-header-tab-inactive-text: ${s.headerTabInactiveTextColor || globalPrimaryText};
  --bundle-header-tab-radius: ${s.headerTabRadius || 67}px;
  --modal-step-title-color: ${s.modalStepTitleColor || globalPrimaryText};

  /* TABS */
  --bundle-tabs-active-bg-color: ${s.tabsActiveBgColor || globalPrimaryButton};
  --bundle-tabs-active-text-color: ${s.tabsActiveTextColor || globalButtonText};
  --bundle-tabs-inactive-bg-color: ${s.tabsInactiveBgColor || '#FFFFFF'};
  --bundle-tabs-inactive-text-color: ${s.tabsInactiveTextColor || globalPrimaryText};
  --bundle-tabs-border-color: ${s.tabsBorderColor || globalPrimaryButton};
  --bundle-tabs-border-radius: ${s.tabsBorderRadius || 8}px;

  /* GENERAL */
  /* Empty State */
  --bundle-empty-state-card-bg: ${s.emptyStateCardBgColor || '#FFFFFF'};
  --bundle-empty-state-card-border: ${s.emptyStateCardBorderColor || '#F6F6F6'};
  --bundle-empty-state-text: ${s.emptyStateTextColor || globalSecondaryText};
  --bundle-empty-state-border-style: ${s.emptyStateBorderStyle || 'dashed'};
  --bundle-empty-slot-border-style: ${s.emptySlotBorderStyle || 'dashed'};
  /* Drawer */
  --bundle-drawer-bg: ${s.drawerBgColor || '#FFFFFF'};
  /* Add to Cart Button */
  --bundle-add-to-cart-button-bg: ${s.addToCartButtonBgColor || globalPrimaryButton};
  --bundle-add-to-cart-button-text: ${s.addToCartButtonTextColor || globalButtonText};
  --bundle-add-to-cart-button-radius: ${s.addToCartButtonBorderRadius || 8}px;
  /* Discount Pill (on Add to Cart button) */
  --bundle-discount-pill-bg: ${s.discountPillBgColor || '#22C55E'};
  --bundle-discount-pill-text: ${s.discountPillTextColor || '#FFFFFF'};
  --bundle-discount-pill-font-size: ${s.discountPillFontSize || 12}px;
  --bundle-discount-pill-font-weight: ${s.discountPillFontWeight || 600};
  --bundle-discount-pill-border-radius: ${s.discountPillBorderRadius || 20}px;
  /* Toasts */
  --bundle-toast-bg: ${s.toastBgColor || globalPrimaryButton};
  --bundle-toast-text: ${s.toastTextColor || globalButtonText};
  --bundle-toast-border-radius: ${s.toastBorderRadius ?? 8}px;
  --bundle-toast-border-color: ${s.toastBorderColor ?? '#FFFFFF'};
  --bundle-toast-border-width: ${s.toastBorderWidth ?? 0}px;
  --bundle-toast-font-size: ${s.toastFontSize ?? 13}px;
  --bundle-toast-font-weight: ${s.toastFontWeight ?? 500};
  --bundle-toast-animation-duration: ${s.toastAnimationDuration ?? 300}ms;
  --bundle-toast-box-shadow: ${s.toastBoxShadow ?? '0 4px 12px rgba(0, 0, 0, 0.15)'};
  --bundle-toast-enter-from-bottom: ${s.toastEnterFromBottom ? '1' : '0'};
  /* Bottom-Sheet */
  --bundle-bottom-sheet-overlay-opacity: ${s.bottomSheetOverlayOpacity ?? 0.5};
  --bundle-bottom-sheet-animation-duration: ${s.bottomSheetAnimationDuration ?? 400}ms;
  /* Bundle Design */
  --bundle-bg-color: ${s.bundleBgColor || 'transparent'};
  --bundle-footer-scrollbar-color: ${s.footerScrollBarColor || globalPrimaryButton};
  /* Product Page Title */
  --bundle-product-page-title-font-color: ${s.productPageTitleFontColor || globalPrimaryText};
  --bundle-product-page-title-font-size: ${s.productPageTitleFontSize || 24}px;
  /* Bundle Upsell */
  --bundle-upsell-button-bg-color: ${s.bundleUpsellButtonBgColor || globalPrimaryButton};
  --bundle-upsell-border-color: ${s.bundleUpsellBorderColor || globalPrimaryButton};
  --bundle-upsell-text-color: ${s.bundleUpsellTextColor || globalButtonText};
  /* Filters */
  --bundle-filter-icon-color: ${s.filterIconColor || globalPrimaryButton};
  --bundle-filter-bg-color: ${s.filterBgColor || '#FFFFFF'};
  --bundle-filter-text-color: ${s.filterTextColor || globalPrimaryText};
  /* Bundle Header - Header Text */
  --bundle-conditions-text-color: ${s.conditionsTextColor || globalPrimaryText};
  --bundle-conditions-text-font-size: ${s.conditionsTextFontSize || 16}px;
  --bundle-discount-text-color: ${s.discountTextColor || globalPrimaryText};
  --bundle-discount-text-font-size: ${s.discountTextFontSize || 14}px;
  /* Free Gift Badge — merchant-uploadable badge image + Settings-controlled position */
  --bundle-free-gift-badge-url: ${s.freeGiftBadgeUrl ? `url("${s.freeGiftBadgeUrl}")` : 'none'};
  ${buildBadgePositionVars('free-gift', s.freeGiftBadgePosition ?? 'top-left')}
  /* Included (Default) Badge — merchant-uploadable badge image + Settings-controlled position */
  --bundle-included-badge-url: ${s.includedBadgeUrl ? `url("${s.includedBadgeUrl}")` : 'none'};
  ${buildBadgePositionVars('included', s.includedBadgePosition ?? 'top-left')}

  /* SEARCH INPUT — names match what bundle-widget-full-page.css references */
  --bundle-search-bg: ${s.searchInputBgColor || '#F8F8F8'};
  --bundle-search-border: ${s.searchInputBorderColor || '#E0E0E0'};
  --bundle-search-focus-border: ${s.searchInputFocusBorderColor || globalPrimaryButton};
  --bundle-search-text-color: ${s.searchInputTextColor || '#333333'};
  --bundle-search-placeholder-color: ${s.searchInputPlaceholderColor || '#999999'};
  --bundle-search-icon-color: ${s.searchClearButtonColor || '#666666'};
  --bundle-search-clear-bg: ${s.searchClearButtonBgColor || 'rgba(0,0,0,0.08)'};
  --bundle-search-clear-color: ${s.searchClearButtonColor || '#666666'};
  --bundle-search-clear-hover-bg: ${s.searchClearButtonBgColor ? s.searchClearButtonBgColor.replace('0.08', '0.15') : 'rgba(0,0,0,0.15)'};
  --bundle-search-clear-hover-color: ${s.searchInputTextColor || '#333333'};

  /* SKELETON LOADING */
  --bundle-skeleton-base-bg: ${s.skeletonBaseBgColor || '#F0F0F0'};
  --bundle-skeleton-shimmer: ${s.skeletonShimmerColor || '#E8E8E8'};
  --bundle-skeleton-highlight: ${s.skeletonHighlightColor || '#FFFFFF'};

  /* CARD HOVER & TRANSITIONS */
  --bundle-card-transition-duration: ${s.productCardTransitionDuration || 200}ms;
  --bundle-card-hover-translate-y: translateY(-${s.productCardHoverTranslateY ?? 2}px);

  /* TILE QUANTITY BADGE */
  --bundle-tile-badge-bg: ${s.tileQuantityBadgeBgColor || globalPrimaryButton};
  --bundle-tile-badge-text: ${s.tileQuantityBadgeTextColor || '#FFFFFF'};

  /* MODAL CLOSE BUTTON */
  --bundle-modal-close-color: ${s.modalCloseButtonColor || '#777777'};
  --bundle-modal-close-bg: ${s.modalCloseButtonBgColor || 'rgba(255,255,255,0.9)'};
  --bundle-modal-close-hover: ${s.modalCloseButtonHoverColor || '#333333'};

  /* TYPOGRAPHY */
  --bundle-button-text-transform: ${s.buttonTextTransform || 'none'};
  --bundle-button-letter-spacing: ${(s.buttonLetterSpacing ?? 0) / 100}em;

  /* FOCUS / ACCESSIBILITY */
  --bundle-focus-outline-color: ${s.focusOutlineColor || globalPrimaryButton};
  --bundle-focus-outline-width: ${s.focusOutlineWidth || 2}px;

  /* PRICING TIER PILLS (Full-Page Bundles) */
  --bundle-tier-pill-active-bg: ${s.tierPillActiveBgColor || globalPrimaryButton};
  --bundle-tier-pill-active-text: ${s.tierPillActiveTextColor || globalButtonText};
  --bundle-tier-pill-inactive-bg: ${s.tierPillInactiveBgColor || 'rgb(242, 250, 238)'};
  --bundle-tier-pill-inactive-text: ${s.tierPillInactiveTextColor || '#333333'};
  --bundle-tier-pill-hover-bg: ${s.tierPillHoverBgColor || 'rgb(220, 245, 210)'};
  --bundle-tier-pill-border: 1px solid ${s.tierPillBorderColor || '#000000'};
  --bundle-tier-pill-border-radius: ${s.tierPillBorderRadius ?? 8}px;
  --bundle-tier-pill-height: ${s.tierPillHeight ?? 52}px;
  --bundle-tier-pill-font-size: ${s.tierPillFontSize ?? 14}px;
  --bundle-tier-pill-font-weight: ${s.tierPillFontWeight ?? 600};
  --bundle-tier-pill-gap: ${s.tierPillGap ?? 12}px;
${generateEBDcpRootAliases(ctx)}`;
}

/**
 * Generate full-page specific CSS variables
 */
export function generateFullPageVariables(ctx: CSSGenerationContext): string {
  const { settings: s, globalPrimaryButton, globalButtonText, globalPrimaryText } = ctx;

  return `
  /* ========================================================================
     FULL-PAGE BUNDLE SPECIFIC VARIABLES
     These control the appearance of full-page standalone bundle pages
     ======================================================================== */

  /* Full-Page Layout Colors */
  --bundle-full-page-bg-color: ${s.fullPageBgColor || '#FFFFFF'};
  --bundle-full-page-footer-bg-color: ${s.fullPageFooterBgColor || '#FFFFFF'};
  --bundle-full-page-footer-border-color: ${s.fullPageFooterBorderColor || 'rgba(0, 0, 0, 0.1)'};

  /* Step Timeline */
  --bundle-step-timeline-circle-size: ${s.stepTimelineCircleSize || 69}px;
  --bundle-step-timeline-circle-bg: ${s.stepTimelineCircleBg || '#FFFFFF'};
  --bundle-step-timeline-circle-border: ${s.stepTimelineCircleBorder || globalPrimaryButton};
  --bundle-step-timeline-circle-border-width: ${s.stepTimelineCircleBorderWidth || 3}px;
  --bundle-step-timeline-circle-text-color: ${s.stepTimelineCircleTextColor || globalPrimaryText};
  --bundle-step-timeline-circle-font-size: ${s.stepTimelineCircleFontSize || 20}px;
  --bundle-step-timeline-completed-bg: ${s.stepTimelineCompletedBg || globalPrimaryButton};
  --bundle-step-timeline-completed-text: ${s.stepTimelineCompletedText || globalButtonText};
  --bundle-step-timeline-locked-border: ${s.stepTimelineLockedBorder || '#808080'};
  --bundle-step-timeline-locked-text: ${s.stepTimelineLockedText || '#808080'};
  --bundle-step-timeline-line-color: ${s.stepTimelineLineColor || '#E5E7EB'};
  --bundle-step-timeline-line-completed: ${s.stepTimelineLineCompleted || globalPrimaryButton};
  --bundle-step-timeline-line-height: ${s.stepTimelineLineHeight || 2}px;
  --bundle-step-timeline-name-font-size: ${s.stepTimelineNameFontSize || 13}px;
  --bundle-step-timeline-name-color: ${s.stepTimelineNameColor || globalPrimaryText};
  --bundle-step-timeline-active-color: ${s.stepTimelineActiveColor || globalPrimaryButton};
  --bundle-step-timeline-inactive-color: ${s.stepTimelineInactiveColor || '#9CA3AF'};
  --bundle-step-timeline-complete-color: ${s.stepTimelineCompleteColor || globalPrimaryButton};

  /* Compact Add Button */
  --bundle-add-btn-color: ${s.addBtnColor || globalPrimaryButton};
  --bundle-add-btn-radius: ${s.addBtnRadius ?? 99}px;

  /* Discount Progress Banner */
  --bundle-discount-banner-bg: ${s.discountBannerBg || '#1a1a1a'};
  --bundle-discount-banner-text: ${s.discountBannerText || '#ffffff'};

  /* Bundle Header (Instructions) */
  --bundle-full-page-title-font-size: ${s.fullPageTitleFontSize || 20}px;
  --bundle-full-page-title-color: ${s.fullPageTitleColor || globalPrimaryText};
  --bundle-full-page-instruction-font-size: ${s.fullPageInstructionFontSize || 20}px;
  --bundle-full-page-instruction-color: ${s.fullPageInstructionColor || globalPrimaryText};

  /* Category Tabs */
  --bundle-category-tab-indicator-size: ${s.categoryTabIndicatorSize || 28}px;
  --bundle-category-tab-label-font-size: ${s.categoryTabLabelFontSize || 20}px;
  --bundle-category-tab-label-color: ${s.categoryTabLabelColor || globalPrimaryText};
  --bundle-category-tab-active-underline-width: ${s.categoryTabActiveUnderlineWidth || 177}px;
  --bundle-category-tab-active-underline-height: ${s.categoryTabActiveUnderlineHeight || 5.5}px;
  --bundle-category-tab-active-underline-color: ${s.categoryTabActiveUnderlineColor || globalPrimaryButton};

  /* Product Grid */
  --bundle-full-page-product-grid-columns: ${s.fullPageProductGridColumns || 3};
  --bundle-full-page-product-image-height: ${s.fullPageProductImageHeight || 200}px;
  --bundle-full-page-product-image-bg: ${s.fullPageProductImageBg || '#FFFFFF'};
  --bundle-full-page-product-image-border-radius: ${s.fullPageProductImageBorderRadius || 8}px;
  --bundle-full-page-product-image-border-color: ${s.fullPageProductImageBorderColor || 'rgba(0, 0, 0, 0.04)'};
  --bundle-full-page-selected-badge-bg: ${s.fullPageSelectedBadgeBg || '#DE4139'};
  --bundle-full-page-selected-badge-color: ${s.fullPageSelectedBadgeColor || '#FFFFFF'};
  --bundle-full-page-price-row-gradient-start: ${s.fullPagePriceRowGradientStart || '#F9FAFB'};
  --bundle-full-page-price-row-gradient-end: ${s.fullPagePriceRowGradientEnd || '#F3F4F6'};
  --bundle-full-page-price-row-border: ${s.fullPagePriceRowBorder || 'rgba(0, 0, 0, 0.06)'};
  --bundle-full-page-variant-border: ${s.fullPageVariantBorder || '#E5E7EB'};
  --bundle-full-page-variant-border-hover: ${s.fullPageVariantBorderHover || '#9CA3AF'};
  --bundle-full-page-added-button-gradient-start: ${s.fullPageAddedButtonGradientStart || '#10B981'};
  --bundle-full-page-added-button-gradient-end: ${s.fullPageAddedButtonGradientEnd || '#059669'};

  /* Bottom Footer */
  --bundle-full-page-footer-header-font-size: ${s.fullPageFooterHeaderFontSize || 20}px;
  --bundle-full-page-footer-header-color: ${s.fullPageFooterHeaderColor || globalPrimaryText};
  --bundle-full-page-footer-scrollbar-color: ${s.fullPageFooterScrollbarColor || globalPrimaryButton};
  --bundle-full-page-footer-product-bg: ${s.fullPageFooterProductBg || '#FFFFFF'};
  --bundle-full-page-footer-product-border: ${s.fullPageFooterProductBorder || globalPrimaryButton};
  --bundle-full-page-footer-product-border-radius: ${s.fullPageFooterProductBorderRadius || 8}px;
  --bundle-full-page-footer-quantity-badge-bg: ${s.fullPageFooterQuantityBadgeBg || globalPrimaryButton};
  --bundle-full-page-footer-quantity-badge-color: ${s.fullPageFooterQuantityBadgeColor || globalButtonText};
  --bundle-full-page-footer-product-title-color: ${s.fullPageFooterProductTitleColor || globalPrimaryText};
  --bundle-full-page-footer-product-price-color: ${s.fullPageFooterProductPriceColor || globalPrimaryText};
  --bundle-full-page-footer-remove-color: ${s.fullPageFooterRemoveColor || '#BD0000'};
  --bundle-full-page-footer-total-label-color: ${s.fullPageFooterTotalLabelColor || globalPrimaryText};
  --bundle-full-page-footer-total-label-font-size: ${s.fullPageFooterTotalLabelFontSize || 16}px;
  --bundle-full-page-footer-total-price-color: ${s.fullPageFooterTotalPriceColor || globalPrimaryText};
  --bundle-full-page-footer-total-price-font-size: ${s.fullPageFooterTotalPriceFontSize || 24}px;
  --bundle-full-page-footer-back-btn-bg: ${s.footerBackButtonBgColor || s.fullPageFooterBackBtnBg || '#FFFFFF'};
  --bundle-full-page-footer-back-btn-color: ${s.footerBackButtonTextColor || s.fullPageFooterBackBtnColor || globalPrimaryText};
  --bundle-full-page-footer-back-btn-border: ${s.footerBackButtonBorderColor || '#E5E7EB'};
  --bundle-full-page-footer-back-btn-hover: ${s.fullPageFooterBackBtnHover || '#F3F4F6'};
  --bundle-full-page-footer-next-btn-bg: ${s.footerNextButtonBgColor || s.fullPageFooterNextBtnBg || '#111111'};
  --bundle-full-page-footer-next-btn-color: ${s.footerNextButtonTextColor || s.fullPageFooterNextBtnColor || '#FFFFFF'};
  --bundle-full-page-footer-next-btn-hover: ${s.fullPageFooterNextBtnHover || '#333333'};
  --bundle-full-page-footer-nav-btn-font-size: ${s.fullPageFooterNavBtnFontSize || 14}px;
  --bundle-full-page-footer-nav-btn-radius: ${s.footerBackButtonBorderRadius || s.footerNextButtonBorderRadius || s.fullPageFooterNavBtnRadius || 50}px;
  --bundle-full-page-footer-no-selections-color: ${s.fullPageFooterNoSelectionsColor || '#808080'};

  /* Loading State */
  --bundle-full-page-loading-spinner-border: ${s.fullPageLoadingSpinnerBorder || '#F0F3EB'};
  --bundle-full-page-loading-spinner-active: ${s.fullPageLoadingSpinnerActive || globalPrimaryButton};`;
}
