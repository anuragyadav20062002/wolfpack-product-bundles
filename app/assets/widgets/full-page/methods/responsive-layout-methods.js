import {
  BUNDLE_WIDGET,
  CurrencyManager,
  BundleDataManager,
  PricingCalculator,
  ToastManager,
  TemplateManager,
  ComponentGenerator
} from '../../../bundle-widget-components.js';
import { ConditionValidator } from '../../shared/condition-validator.js';
import { createDefaultLoadingAnimation } from '../../shared/default-loading-animation.js';
import { hideLoadingOverlayElement, markLoadingOverlayVisible } from '../../shared/loading-overlay.js';
import { getDiscountProgressData, getSelectedQuantity, getTimelineEntryState } from '../../shared/engine/bundle-selectors.js';
import { renderDiscountProgress } from '../../shared/components/discount-progress.js';
import { createBundleBannerElement, createStepBannerImageElement } from '../../shared/components/bundle-banners.js';
import { renderSharedProductCard } from '../../shared/components/product-card.js';
import { renderSelectedProductRow } from '../../shared/components/selected-product-row.js';
import { renderSelectedProductSlots } from '../../shared/components/selected-product-slots.js';
import { renderStepTimelineEntry } from '../../shared/components/step-timeline.js';
import {
  buildCartLineDisplayProperties,
  buildCartLineSourceProperties,
} from '../../shared/engine/cart-lines.js';

export function getMobileBottomBarActionState({
  conditionlessMobile,
  hasSelectionMobile,
  isLastStep,
  isComplete,
  boxSelectionValidMobile,
}) {
  const shouldAddToCart = conditionlessMobile || isLastStep;
  const disabled = conditionlessMobile
    ? (!hasSelectionMobile || !boxSelectionValidMobile)
    : (isLastStep ? (!isComplete || !boxSelectionValidMobile) : false);

  return { shouldAddToCart, disabled };
}

export const fullPageResponsiveLayoutMethods = {
renderProductPageLayout() {
  this.selectedBundle.steps.forEach((step, index) => {
    const stepElement = this.createStepElement(step, index);
    this.elements.stepsContainer.appendChild(stepElement);
  });
},

// Full-page bundle layout (horizontal tabs)
async renderFullPageLayout() {

  // Hide the page-title element from the theme (shows page name like "StrangeObjectsinmirror")
  this.hidePageTitle();

  // Clear existing content
  this.elements.stepsContainer.innerHTML = '';
  this.elements.stepsContainer.classList.add('full-page-layout');
  this.applyFullPageDesignPresetMarker();
  await this.ensureFullPageTemplateStylesheet(this.getFullPageDesignPreset());
  this.ensureBundleBannerRuntimeStyles();

  // Wrap content in full-page-content-section for proper padding
  const contentSection = document.createElement('div');
  contentSection.className = 'full-page-content-section';

  // OPTIMISTIC RENDERING: Render non-product UI immediately
  const bundleBanners = this.createBundleBanners();
  if (bundleBanners) {
    contentSection.appendChild(bundleBanners);
  }

  // 0. Render promo banner at the very top (before step timeline)
  const promoBanner = this.createPromoBanner();
  if (promoBanner) {
    contentSection.appendChild(promoBanner);
  }

  // 1. Render step timeline at top (if enabled in theme settings)
  if (this.config.showStepTimeline) {
    const stepTimeline = this.createStepTimeline();
    contentSection.appendChild(stepTimeline);
  }

  const contentHeader = this.createStepContentHeader(this.currentStepIndex);
  if (contentHeader) contentSection.appendChild(contentHeader);

  // 2. Render per-step banner image (if configured for this step)
  const stepBanner = this.createStepBannerImage(this.currentStepIndex);
  if (stepBanner) contentSection.appendChild(stepBanner);

  // 3. Render search input for filtering products
  if (this.shouldRenderFullPageSearch()) {
    const searchInput = this.createSearchInput();
    contentSection.appendChild(searchInput);
  }

  // 4. Render category/collection tabs if step has collections (and enabled in theme settings)
  if (this.config.showCategoryTabs) {
    const categoryTabs = this.createCategoryTabs(this.currentStepIndex);
    if (categoryTabs) {
      contentSection.appendChild(categoryTabs);
    }
  }

  const categoryRowsBefore = this.createCategorySectionRows(this.currentStepIndex, 'before');
  if (categoryRowsBefore) contentSection.appendChild(categoryRowsBefore);

  const activeCategoryTitle = this.createActiveCategoryTitle(this.currentStepIndex);
  if (activeCategoryTitle) contentSection.appendChild(activeCategoryTitle);

  // 5. Create product grid container with loading state
  const productGridContainer = document.createElement('div');
  productGridContainer.className = 'full-page-product-grid-container';
  this.renderProductGridLoadingState(productGridContainer);
  contentSection.appendChild(productGridContainer);
  const categoryRowsAfter = this.createCategorySectionRows(this.currentStepIndex, 'after');
  if (categoryRowsAfter) contentSection.appendChild(categoryRowsAfter);

  this.elements.stepsContainer.appendChild(contentSection);

  // 6. Render fixed footer (will be updated after products load)
  this.renderFullPageFooter();

  // Load products asynchronously and update grid.
  try {
    await this.loadStepProducts(this.currentStepIndex);

    // Replace loading state with actual products
    const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
    productGridContainer.innerHTML = '';
    productGridContainer.appendChild(productGrid);

    // Update footer with correct product data
    this.renderFullPageFooter();

    this.hideLoadingOverlay();

    // PRELOAD NEXT STEP: Load next step's products in the background
    this.preloadNextStep();
  } catch (error) {
    this.hideLoadingOverlay();
    productGridContainer.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
  }
},

// Full-page bundle layout with sidebar panel (footer_side)
async renderFullPageLayoutWithSidebar() {
  this.hidePageTitle();

  this.elements.stepsContainer.innerHTML = '';
  this.elements.stepsContainer.classList.add('full-page-layout', 'layout-sidebar');
  this.applyFullPageDesignPresetMarker();
  await this.ensureFullPageTemplateStylesheet(this.getFullPageDesignPreset());
  this.ensureBundleBannerRuntimeStyles();

  // Hide the bottom footer — sidebar replaces it
  if (this.elements.footer) {
    this.elements.footer.style.display = 'none';
  }

  const bundleBanners = this.createBundleBanners();
  if (bundleBanners) {
    this.elements.stepsContainer.appendChild(bundleBanners);
  }

  // ABOVE: Step timeline sits above the two-column area (same horizontal position as
  // the floating footer layout) so tabs always appear at the top, not as a left column.
  if (this.config.showStepTimeline) {
    this.elements.stepsContainer.appendChild(this.createStepTimeline());
  }

  const contentHeader = this.createStepContentHeader(this.currentStepIndex);
  if (contentHeader) this.elements.stepsContainer.appendChild(contentHeader);

  if (this.config.showCategoryTabs) {
    const categoryTabs = this.createCategoryTabs(this.currentStepIndex);
    if (categoryTabs) this.elements.stepsContainer.appendChild(categoryTabs);
  }

  // Two-column wrapper: content (center) | sidebar (right)
  const twoColWrapper = document.createElement('div');
  twoColWrapper.className = 'sidebar-layout-wrapper';

  // CENTER: Main content (same as footer_bottom minus the footer)
  const contentSection = document.createElement('div');
  contentSection.className = 'full-page-content-section sidebar-content';

  const promoBanner = this.createPromoBanner();
  if (promoBanner) contentSection.appendChild(promoBanner);

  const stepBanner = this.createStepBannerImage(this.currentStepIndex);
  if (stepBanner) contentSection.appendChild(stepBanner);

  if (this.shouldRenderFullPageSearch()) {
    contentSection.appendChild(this.createSearchInput());
  }

  const categoryRowsBefore = this.createCategorySectionRows(this.currentStepIndex, 'before');
  if (categoryRowsBefore) contentSection.appendChild(categoryRowsBefore);

  const activeCategoryTitle = this.createActiveCategoryTitle(this.currentStepIndex);
  if (activeCategoryTitle) contentSection.appendChild(activeCategoryTitle);

  // Add-on step custom heading — only shown when merchant explicitly sets addonTitle
  const currentStep = (this.selectedBundle?.steps || [])[this.currentStepIndex];
  if (currentStep?.isFreeGift && currentStep?.addonTitle) {
    const freeHeading = document.createElement('div');
    freeHeading.className = 'fpb-step-free-heading';
    freeHeading.textContent = currentStep.addonTitle;
    contentSection.appendChild(freeHeading);
  }

  const productGridContainer = document.createElement('div');
  productGridContainer.className = 'full-page-product-grid-container';
  this.renderProductGridLoadingState(productGridContainer);
  contentSection.appendChild(productGridContainer);
  const categoryRowsAfter = this.createCategorySectionRows(this.currentStepIndex, 'after');
  if (categoryRowsAfter) contentSection.appendChild(categoryRowsAfter);

  twoColWrapper.appendChild(contentSection);

  // RIGHT: Side panel
  const sidePanel = document.createElement('div');
  sidePanel.className = 'full-page-side-panel';
  this.renderSidePanel(sidePanel);
  twoColWrapper.appendChild(sidePanel);

  this.elements.stepsContainer.appendChild(twoColWrapper);

  // Load products.
  try {
    await this.loadStepProducts(this.currentStepIndex);
    const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
    productGridContainer.innerHTML = '';
    productGridContainer.appendChild(productGrid);
    this.renderSidePanel(sidePanel);
    this.hideLoadingOverlay();
    this.preloadNextStep();
    this._renderMobileBottomBar();
  } catch (error) {
    this.hideLoadingOverlay();
    productGridContainer.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
    this._renderMobileBottomBar();
  }
},

// Mobile sticky bottom bar + slide-up sheet (replaces sidebar on < 768px)
_renderMobileBottomBar({ preserveOpen = false } = {}) {
  const previousSheet = document.querySelector('.fpb-mobile-bottom-sheet');
  const wasOpen = preserveOpen && previousSheet?.classList.contains('is-open');
  const wasCompactSummaryExpanded = preserveOpen
    && previousSheet?.classList.contains('fpb-mobile-summary-tray-expanded');

  document.querySelector('.fpb-mobile-bottom-bar')?.remove();
  document.querySelector('.fpb-mobile-bottom-sheet')?.remove();
  document.querySelector('.fpb-mobile-backdrop')?.remove();
  document.body.classList.remove('fpb-compact-mobile-summary-active');
  document.body.classList.remove('fpb-mobile-summary-scroll-locked');

  const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );
  const discountInfo = PricingCalculator.calculateDiscount(this.selectedBundle, totalPrice, totalQuantity, unitPrices);
  const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const finalPrice = combinedDiscountInfo.hasDiscount ? combinedDiscountInfo.finalPrice : totalPrice;
  const selectedCount = this.getAllSelectedProductsData().filter(p => !p.isDefault).length;
  const isLastStep = this.currentStepIndex === (this.selectedBundle?.steps?.length || 1) - 1;
  const isComplete = this.areBundleConditionsMet();

  const backdrop = document.createElement('div');
  backdrop.className = 'fpb-mobile-backdrop';

  const sheet = document.createElement('div');
  sheet.className = 'fpb-mobile-bottom-sheet';
  this._syncMobilePortalThemeVars(sheet);
  const usesCompactMobileSummaryTray = this.usesCompactMobileSummaryTray();
  if (usesCompactMobileSummaryTray) {
    const preset = this.getFullPageDesignPreset();
    if (preset) {
      sheet.classList.add(`fpb-preset-${preset.toLowerCase()}`);
    }
    sheet.classList.add('fpb-mobile-summary-tray');
    if (preset === 'CLASSIC') {
      sheet.classList.add('fpb-mobile-classic-footer');
    }
    this.compactMobileSummaryTrayExpanded = wasCompactSummaryExpanded || this.compactMobileSummaryTrayExpanded === true;
    this._populateCompactMobileSummaryTray(sheet);
    sheet.classList.add('is-open');
    document.body.classList.add('fpb-compact-mobile-summary-active');
    this._mountCompactMobileSummaryTray(sheet);
    return;
  }

  this._populateMobileSheet(sheet);

  const bar = document.createElement('div');
  bar.className = 'fpb-mobile-bottom-bar';
  this._syncMobilePortalThemeVars(bar);

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'fpb-mobile-toggle-btn';
  toggleBtn.setAttribute('aria-label', 'View bundle summary');
  toggleBtn.innerHTML = `<span class="fpb-caret">&#9650;</span><span class="fpb-mobile-toggle-count">${selectedCount}</span>`;
  toggleBtn.addEventListener('click', () => {
    const open = sheet.classList.toggle('is-open');
    backdrop.classList.toggle('is-open', open);
    toggleBtn.querySelector('.fpb-caret').innerHTML = open ? '&#9660;' : '&#9650;';
  });
  backdrop.addEventListener('click', () => {
    sheet.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    toggleBtn.querySelector('.fpb-caret').innerHTML = '&#9650;';
  });

  const totalEl = document.createElement('div');
  totalEl.className = 'fpb-mobile-total';
  totalEl.textContent = CurrencyManager.convertAndFormat(finalPrice, currencyInfo);

  const conditionlessMobile = this.bundleHasNoConditions();
  const hasSelectionMobile = conditionlessMobile && this.getAllSelectedProductsData().filter(p => !p.isDefault).length > 0;
  const boxSelectionValidMobile = this.canCheckoutWithBoxSelection();
  const mobileActionState = getMobileBottomBarActionState({
    conditionlessMobile,
    hasSelectionMobile,
    isLastStep,
    isComplete,
    boxSelectionValidMobile,
  });
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'fpb-mobile-cta-btn';
  ctaBtn.textContent = mobileActionState.shouldAddToCart ? this._resolveText('addToCartButton', 'Add to Cart') : this._resolveText('nextButton', 'Next');
  if (mobileActionState.disabled) ctaBtn.disabled = true;
  ctaBtn.addEventListener('click', async () => {
    if (this._isWidgetActionBusy) return;

    if (mobileActionState.shouldAddToCart) {
      if (!this.canCheckoutWithBoxSelection()) {
        this.showBoxSelectionValidationMessage();
        return;
      }
      await this.addBundleToCart(ctaBtn);
    } else if (!isLastStep && this.canNavigateToStep(this.currentStepIndex + 1) && this.canProceedToNextStep()) {
      await this._withWidgetActionBusy(async () => {
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex++;
        await this.renderFullPageLayoutWithSidebar();
      }, { actionButton: ctaBtn });
    } else if (!isLastStep && !this.canNavigateToStep(this.currentStepIndex + 1)) {
      ToastManager.show(this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName ? `Complete all steps to unlock the free ${this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName}!` : 'Complete all steps first.');
    } else {
      ToastManager.show(this.getStepConditionValidationMessage?.() || 'Please meet the quantity conditions for the current step before proceeding.');
    }
  });

  bar.appendChild(toggleBtn);
  bar.appendChild(totalEl);
  bar.appendChild(ctaBtn);

  document.body.appendChild(backdrop);
  document.body.appendChild(sheet);
  document.body.appendChild(bar);

  if (wasOpen) {
    sheet.classList.add('is-open');
    backdrop.classList.add('is-open');
    toggleBtn.querySelector('.fpb-caret').innerHTML = '&#9660;';
  }
},

_mountCompactMobileSummaryTray(sheet) {
  if (this.container?.parentNode) {
    this.container.insertAdjacentElement('afterend', sheet);
    return;
  }

  document.body.appendChild(sheet);
},

_populateMobileSheet(sheet) {
  sheet.innerHTML = '';
  this._syncMobilePortalThemeVars(sheet);
  this.renderSidePanel(sheet);
},

_syncMobilePortalThemeVars(...elements) {
  const source = this.container || document.documentElement;
  const sourceStyles = getComputedStyle(source);
  const fallbackStyles = source === document.documentElement
    ? sourceStyles
    : getComputedStyle(document.documentElement);
  const themeVars = [
    '--bundle-add-btn-color',
    '--bundle-button-bg',
    '--bundle-button-text-color',
    '--bundle-global-button-text',
    '--bundle-global-primary-button',
    '--bundle-sidebar-button-bg',
    '--bundle-sidebar-button-text',
  ];

  elements.filter(Boolean).forEach((element) => {
    themeVars.forEach((property) => {
      const value = sourceStyles.getPropertyValue(property).trim()
        || fallbackStyles.getPropertyValue(property).trim();
      if (value) {
        element.style.setProperty(property, value);
      }
    });
  });
},

usesCompactMobileSummaryTray() {
  const preset = this.getFullPageDesignPreset();
  return this.resolveFullPageLayout() === 'footer_side' && (preset === 'STANDARD' || preset === 'CLASSIC' || preset === 'COMPACT' || preset === 'HORIZONTAL');
},
};
