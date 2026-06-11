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


export const fullPageDiscountModalMethods = {
_renderDiscountProgress(options = {}) {
  const placement = options.placement || "default";
  const providedCombinedDiscountInfo = options.combinedDiscountInfo;
  const providedTotalPrice = options.totalPrice;
  const providedTotalQuantity = options.totalQuantity;
  const providedUnitPrices = options.unitPrices;

  if (!this.selectedBundle?.pricing?.enabled) return null;

  const { totalPrice, totalQuantity, unitPrices } = typeof providedTotalPrice === 'number' && typeof providedTotalQuantity === 'number'
    ? {
        totalPrice: providedTotalPrice,
        totalQuantity: providedTotalQuantity,
        unitPrices: providedUnitPrices || []
      }
    : PricingCalculator.calculateBundleTotal(
        this.selectedProducts,
        this.stepProductData,
        this.selectedBundle?.steps
      );
  const discountInfo = providedCombinedDiscountInfo ?? this.getDiscountInfoWithSelectedAddonDiscount(
    PricingCalculator.calculateDiscount(
      this.selectedBundle, totalPrice, totalQuantity, unitPrices
    ),
    totalPrice
  );
  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const variables = TemplateManager.createDiscountVariables(
    this.selectedBundle, totalPrice, totalQuantity, discountInfo, currencyInfo
  );

  const isReached = discountInfo.hasDiscount;
  const progressPct = isReached ? 100 : Math.min(100, Math.max(0, parseInt(variables.progressPercentage, 10) || 0));

  const progressBarType = this.config.discountProgressBarType === 'simple' ? 'simple' : 'step_based';
  const milestones = progressBarType === 'step_based'
    ? this.getDiscountProgressMilestones(totalPrice, totalQuantity)
    : [];

  let message = '';
  if (progressBarType === 'step_based' && milestones.length > 0) {
    message = '';
  } else if (isReached) {
    message = TemplateManager.replaceVariables(
      this.config.discountProgressSuccessTemplate || this.config.successMessageTemplate || '🎉 You\'ve unlocked {{discountText}}!',
      variables
    );
  } else {
    const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity);
    if (!nextRule) return null;
    message = TemplateManager.replaceVariables(
      this.config.discountProgressTextTemplate || this.config.discountTextTemplate || 'Add {{conditionText}} to get {{discountText}}',
      variables
    );
  }

  const progressData = getDiscountProgressData({
    currentValue: progressPct,
    targetValue: 100,
    message,
  });
  progressData.success = isReached;
  progressData.milestones = progressBarType === 'step_based' ? milestones : [];

  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderDiscountProgress(progressData, {
    mode: progressBarType === 'simple' ? 'bar' : 'stepped',
    className: progressBarType === 'simple'
      ? `fpb-discount-progress fpb-dp-simple${isReached ? ' reached' : ''}`
      : `fpb-discount-progress fpb-dp-step_based${isReached ? ' reached' : ''}`,
    messageClassName: 'fpb-dp-row fpb-dp-message',
    trackClassName: 'fpb-dp-track',
    fillClassName: 'fpb-dp-fill',
    milestoneListClassName: 'fpb-discount-step-list',
    milestoneClassName: 'fpb-discount-step',
    milestoneReachedClassName: 'fpb-discount-step-reached',
    milestoneTitleClassName: 'fpb-discount-step-title',
    milestoneSubtitleClassName: 'fpb-discount-step-subtitle',
    renderInlineSubtitles: placement !== 'sidebar',
    renderSubtitleList: placement === 'sidebar' && milestones.some(milestone => milestone.subTitle),
    subtitleListClassName: placement === 'sidebar' ? 'fpb-discount-step-subtitle-list' : '',
  }).trim();
  const bar = wrapper.firstElementChild;
  bar?.style?.setProperty('--fpb-discount-progress-width', progressPct + '%');
  return bar;
},

// Returns a new .discount-progress-banner DOM element, or null when no discount is configured.
// Used by both the footer and the sidebar panel.
_renderDiscountProgressBanner() {
  if (!this.selectedBundle?.pricing?.enabled) return null;

  const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );
  const discountInfo = this.getDiscountInfoWithSelectedAddonDiscount(
    PricingCalculator.calculateDiscount(
      this.selectedBundle, totalPrice, totalQuantity, unitPrices
    ),
    totalPrice
  );
  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const variables = TemplateManager.createDiscountVariables(
    this.selectedBundle, totalPrice, totalQuantity, discountInfo, currencyInfo
  );

  let message = '';
  let isReached = false;

  if (discountInfo.hasDiscount) {
    isReached = true;
    message = TemplateManager.replaceVariables(
      this.config.successMessageTemplate || '🎉 You\'ve unlocked {{discountText}}!',
      variables
    );
  } else {
    const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity);
    if (!nextRule) return null;
    message = TemplateManager.replaceVariables(
      this.config.discountTextTemplate || 'Add {{conditionText}} to get {{discountText}}',
      variables
    );
  }

  const banner = document.createElement('div');
  banner.className = 'discount-progress-banner' + (isReached ? ' reached' : '');
  banner.innerHTML = message;
  return banner;
},

// Updates the .discount-progress-banner already in the footer in-place (avoids full footer re-render).
_updateDiscountProgressBanner() {
  if (!this.elements.footer) return;
  const existing = this.elements.footer.querySelector('.discount-progress-banner');
  const fresh = this._renderDiscountProgressBanner();

  if (fresh && existing) {
    existing.className = fresh.className;
    existing.innerHTML = fresh.innerHTML;
  } else if (fresh && !existing) {
    // Insert as first child (full-width slim banner before footer-inner)
    this.elements.footer.insertBefore(fresh, this.elements.footer.firstChild);
  } else if (!fresh && existing) {
    existing.remove();
  }
},

// ========================================================================
// MODAL FUNCTIONALITY
// ========================================================================

// Helper method to get formatted header text
getFormattedHeaderText() {
  // If discount is not enabled, show step name (escaped)
  if (!this.selectedBundle?.pricing?.enabled) {
    const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
    return this._escapeHTML(currentStep?.name) || `Step ${this.currentStepIndex + 1}`;
  }

  const { totalQuantity, totalPrice, unitPrices } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );
  const discountInfo = PricingCalculator.calculateDiscount(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    unitPrices
  );
  const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const variables = TemplateManager.createDiscountVariables(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    combinedDiscountInfo,
    currencyInfo
  );

  return TemplateManager.replaceVariables(
    this.config.discountTextTemplate,
    variables
  );
},

openModal(stepIndex) {
  this.currentStepIndex = stepIndex;

  // Update modal header
  const modal = this.elements.modal;
  const headerText = this.getFormattedHeaderText();

  modal.querySelector('.modal-step-title').innerHTML = headerText;

  // Load and render products for this step
  this.loadStepProducts(stepIndex).then(() => {
    this.renderModalTabs();
    this.renderModalProducts(stepIndex);
    this.updateModalNavigation();
    this.updateModalFooterMessaging();

    // Show modal
    modal.style.display = 'block';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }).catch(error => {
    ToastManager.show('Failed to load products for this step');
  });
},

closeModal() {
  this.elements.modal.style.display = 'none';
  this.elements.modal.classList.remove('active');
  document.body.style.overflow = '';

  // Update main UI
  this.renderSteps();
  this.updateFooterMessaging();
},

resolveStorefrontApiBase() {
  const appProxyPrefix = '/apps/product-bundles';
  if (window.location?.pathname?.startsWith(`${appProxyPrefix}/`)) {
    return appProxyPrefix;
  }

  const configuredAppUrl = window.__BUNDLE_APP_URL__ || '';
  const currentHost = window.location.host;
  const shopDomain = window.Shopify?.shop || this.container?.dataset.shop || '';

  let configuredAppHost = '';
  if (configuredAppUrl) {
    try {
      configuredAppHost = new URL(configuredAppUrl).host;
    } catch (_error) {
      configuredAppHost = '';
    }
  }

  if (shopDomain && configuredAppHost !== currentHost) {
    return appProxyPrefix;
  }

  return configuredAppUrl || window.location.origin;
},
};
