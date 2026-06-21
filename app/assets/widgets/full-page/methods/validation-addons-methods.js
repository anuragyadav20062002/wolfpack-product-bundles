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


export const fullPageValidationAddonsMethods = {
async _sidebarAdvanceToNextStep() {
  const contentSection = this.elements.stepsContainer.querySelector('.sidebar-content');
  if (!contentSection) {
    // Fallback: full re-render if DOM structure is unexpected
    this.renderFullPageLayoutWithSidebar();
    return;
  }

  // 1. Update step timeline tabs in-place (active/completed/locked state + click listeners)
  this.updateStepTimeline();

  // 2. Rebuild search input for the new step (search query was cleared by the caller)
  const existingSearch = contentSection.querySelector('.step-search-container');
  if (existingSearch && this.shouldRenderFullPageSearch()) {
    existingSearch.replaceWith(this.createSearchInput());
  } else if (existingSearch) {
    existingSearch.remove();
  } else if (this.shouldRenderFullPageSearch()) {
    const firstAnchor = contentSection.querySelector('.category-tabs, .fpb-step-category-title, .full-page-product-grid-container');
    if (firstAnchor) contentSection.insertBefore(this.createSearchInput(), firstAnchor);
  }

  // 3. Rebuild category tabs for the new step
  const existingTabs = contentSection.querySelector('.category-tabs');
  if (this.config.showCategoryTabs) {
    const newTabs = this.createCategoryTabs(this.currentStepIndex);
    if (existingTabs && newTabs) {
      existingTabs.replaceWith(newTabs);
    } else if (existingTabs && !newTabs) {
      existingTabs.remove();
    } else if (!existingTabs && newTabs) {
      const gridContainer = contentSection.querySelector('.full-page-product-grid-container');
      if (gridContainer) contentSection.insertBefore(newTabs, gridContainer);
    }
  } else if (existingTabs) {
    existingTabs.remove();
  }

  const existingCategoryTitle = contentSection.querySelector('.fpb-step-category-title');
  const newCategoryTitle = this.createActiveCategoryTitle(this.currentStepIndex);
  if (existingCategoryTitle && newCategoryTitle) {
    existingCategoryTitle.replaceWith(newCategoryTitle);
  } else if (existingCategoryTitle && !newCategoryTitle) {
    existingCategoryTitle.remove();
  } else if (!existingCategoryTitle && newCategoryTitle) {
    const gridContainer = contentSection.querySelector('.full-page-product-grid-container');
    if (gridContainer) contentSection.insertBefore(newCategoryTitle, gridContainer);
  }

  const existingCategoryRows = contentSection.querySelector('.fpb-category-section-rows');
  const newCategoryRows = this.createCategorySectionRows(this.currentStepIndex);
  if (existingCategoryRows && newCategoryRows) {
    existingCategoryRows.replaceWith(newCategoryRows);
  } else if (existingCategoryRows && !newCategoryRows) {
    existingCategoryRows.remove();
  } else if (!existingCategoryRows && newCategoryRows) {
    const gridContainer = contentSection.querySelector('.full-page-product-grid-container');
    if (gridContainer) gridContainer.insertAdjacentElement('afterend', newCategoryRows);
  }

  // 4. Show loading skeleton in product grid
  const productGridContainer = contentSection.querySelector('.full-page-product-grid-container');
  if (!productGridContainer) {
    this.renderFullPageLayoutWithSidebar();
    return;
  }
  productGridContainer.innerHTML = this.createProductGridLoadingState();

  // 5. Immediately update side panel to reflect current selections
  const sidePanel = this.elements.stepsContainer.querySelector('.full-page-side-panel');
  if (sidePanel) this.renderSidePanel(sidePanel);

  // 6. Async: load products for the new step and swap in the grid
  if (this.selectedBundle?.loadingGif) this.showLoadingOverlay(this.selectedBundle.loadingGif);
  try {
    await this.loadStepProducts(this.currentStepIndex);
    const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
    productGridContainer.innerHTML = '';
    productGridContainer.appendChild(productGrid);
    if (sidePanel) this.renderSidePanel(sidePanel);
    this.hideLoadingOverlay();
    this.preloadNextStep();
    this._renderMobileBottomBar();
  } catch (error) {
    this.hideLoadingOverlay();
    productGridContainer.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
    this._renderMobileBottomBar();
  }
},

canProceedToNextStep() {
  if (!this.isStepCompleted(this.currentStepIndex)) return false;
  // If the next step is the free-gift step, also enforce the addon threshold.
  // Otherwise the merchant's `Bundle Product Quantity` / `Bundle Value` rule on
  // the addon tier is ignored when advancing into the free-gift step.
  const steps = this.selectedBundle?.steps || [];
  const nextStep = steps[this.currentStepIndex + 1];
  if (nextStep?.isFreeGift && !this.isFreeGiftUnlocked) return false;
  return true;
},

// Helper: Check if all bundle conditions are met
areBundleConditionsMet() {
  return this.selectedBundle.steps.every((step, index) => {
    if (step.isFreeGift || step.isDefault) return true; // non-blocking steps
    return this.isStepCompleted(index);
  });
},

// Returns true when no step contributes a gating rule.
// A free-gift step contributes a rule when it has an addonEligibilityCondition,
// an addonTier with eligibilityCondition.value > 0, or any selectedAddonProducts —
// otherwise the footer renders "Add to Cart" on the paid step and bypasses the
// merchant-configured addon threshold.
bundleHasNoConditions() {
  if (!this.selectedBundle?.steps?.length) return false;
  return this.selectedBundle.steps.every(step => {
    if (step.isDefault) return true;
    if (step.isFreeGift) {
      const eligibilityValue = Number(step.addonEligibilityCondition?.value) || 0;
      if (eligibilityValue > 0) return false;
      const tier = Array.isArray(step.addonTiers) ? step.addonTiers[0] : null;
      if (tier) {
        const tierValue = Number(tier.eligibilityCondition?.value) || 0;
        if (tierValue > 0) return false;
        if (Array.isArray(tier.selectedAddonProducts) && tier.selectedAddonProducts.length > 0) return false;
      }
      return true;
    }
    return !step.conditionType && !step.conditionOperator && step.conditionValue == null;
  });
},

// Free gift helpers

get freeGiftStep() {
  return (this.selectedBundle?.steps || []).find(s => s.isFreeGift) ?? null;
},

get freeGiftStepIndex() {
  return (this.selectedBundle?.steps || []).findIndex(s => s.isFreeGift);
},

get paidSteps() {
  return (this.selectedBundle?.steps || []).filter(s => !s.isFreeGift && !s.isDefault);
},

get isFreeGiftUnlocked() {
  if (!this.freeGiftStep) return false;
  if (this.freeGiftStep.addonEligibilityCondition || Array.isArray(this.freeGiftStep.addonTiers)) {
    return this.getAddonEligibilityState(this.freeGiftStep).isEligible;
  }
  const steps = this.selectedBundle?.steps || [];
  return this.paidSteps.every(paidStep => {
    const globalIndex = steps.indexOf(paidStep);
    return this.isStepCompleted(globalIndex);
  });
},

canNavigateToStep(targetStepIndex) {
  const targetStep = (this.selectedBundle?.steps || [])[targetStepIndex];
  if (targetStep?.isFreeGift && !this.isFreeGiftUnlocked) return false;
  return true;
},

_getFreeGiftRemainingCount() {
  if (this.freeGiftStep?.addonEligibilityCondition || Array.isArray(this.freeGiftStep?.addonTiers)) {
    return this.getAddonEligibilityState(this.freeGiftStep).remainingQuantity;
  }
  const steps = this.selectedBundle?.steps || [];
  const total = this.paidSteps.reduce((sum, s) =>
    sum + (Number(s.conditionValue) || Number(s.minQuantity) || 1), 0);
  const selected = this.paidSteps.reduce((sum, paidStep) => {
    const globalIndex = steps.indexOf(paidStep);
    const stepSel = this.selectedProducts[globalIndex] ?? {};
    return sum + Object.values(stepSel).reduce((s, p) => s + (typeof p === 'number' ? p : (p.quantity || 1)), 0);
  }, 0);
  return Math.max(0, total - selected);
},

getAddonEligibilityState(step) {
  const tier = Array.isArray(step?.addonTiers) ? step.addonTiers[0] : null;
  const condition = step?.addonEligibilityCondition || tier?.eligibilityCondition || {};
  const discount = step?.addonDiscount || tier?.discount || {};
  const conditionType = String(condition.type || 'QUANTITY').toUpperCase();
  const conditionValue = Number(condition.value || 0);
  const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );
  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const thresholdCents = conditionType === 'AMOUNT' ? Math.round(conditionValue * 100) : conditionValue;
  const currentValue = conditionType === 'AMOUNT' ? totalPrice : totalQuantity;
  const remainingRaw = Math.max(0, thresholdCents - currentValue);
  const remainingQuantity = conditionType === 'AMOUNT' ? 0 : remainingRaw;
  const remainingAmount = conditionType === 'AMOUNT' ? remainingRaw : 0;
  const discountValue = Number(discount.value || 0);
  const discountUnit = discount.type === 'PERCENTAGE' ? '%' : currencyInfo.display.symbol;

  return {
    isEligible: remainingRaw <= 0,
    conditionType,
    remainingQuantity,
    remainingAmount,
    variables: {
      addonsConditionDiff: conditionType === 'AMOUNT'
        ? String(Math.ceil(remainingAmount / 100))
        : String(remainingQuantity),
      currencyUnit: currencyInfo.display.symbol,
      addonsDiscountValue: String(discountValue),
      addonsDiscountValueUnit: discountUnit,
    },
  };
},

getAddonLineDiscount(step) {
  const tier = Array.isArray(step?.addonTiers) ? step.addonTiers[0] : null;
  const discount = step?.addonDiscount || tier?.discount || {};
  const type = String(discount.type || '').toUpperCase();
  const value = Number(discount.value || 0);
  if (type !== 'PERCENTAGE' || !Number.isFinite(value) || value <= 0) return null;
  return { type, value: Math.min(100, value) };
},

getAddonProductSelectionKeys(step) {
  const keys = new Set();
  const addKey = (value) => {
    if (value === null || value === undefined || value === '') return;
    const normalized = this.extractId(value) || value;
    keys.add(String(normalized));
  };
  const products = [
    ...(Array.isArray(step?.StepProduct) ? step.StepProduct : []),
    ...(Array.isArray(step?.products) ? step.products : []),
  ];

  products.forEach(product => {
    addKey(product.id);
    addKey(product.productId);
    addKey(product.graphqlId);
    addKey(product.variantId);
    addKey(product.variantGraphqlId);
    addKey(product.title);
    (Array.isArray(product.variants) ? product.variants : []).forEach(variant => {
      addKey(variant.id);
      addKey(variant.variantId);
      addKey(variant.variantGraphqlId);
      addKey(variant.admin_graphql_api_id);
      addKey(variant.title);
    });
  });

  return keys;
},

calculateSelectedAddonDiscountAmount() {
  const steps = this.selectedBundle?.steps || [];
  const chargeableAddonStep = steps.find(candidate => candidate?.isFreeGift === true && candidate?.addonDisplayFree !== true && this.getAddonLineDiscount(candidate));
  const chargeableAddonStepIndex = steps.indexOf(chargeableAddonStep);
  const chargeableAddonProductKeys = this.getAddonProductSelectionKeys(chargeableAddonStep);
  return this.getAllSelectedProductsData().reduce((total, item) => {
    const isChargeableAddonItem = Number(item.stepIndex) === chargeableAddonStepIndex || (item.isFreeGift === true && item.addonDisplayFree !== true);
    const isChargeableAddonProduct = chargeableAddonProductKeys.has(String(this.extractId(item.variantId) || item.variantId))
      || chargeableAddonProductKeys.has(String(this.extractId(item.productId) || item.productId))
      || chargeableAddonProductKeys.has(String(item.title || ''))
      || chargeableAddonProductKeys.has(String(item.parentTitle || ''));
    if (!isChargeableAddonItem && !isChargeableAddonProduct) return total;
    const step = steps[item.stepIndex];
    const addonDiscount = this.getAddonLineDiscount(step) || this.getAddonLineDiscount(chargeableAddonStep);
    if (!addonDiscount) return total;

    const selectedQuantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    if (!selectedQuantity || selectedQuantity <= 0 || !Number.isFinite(price) || price <= 0) return total;
    return total + (price * selectedQuantity * addonDiscount.value / 100);
  }, 0);
},

getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice) {
  const baseDiscountAmount = Math.max(0, Number(discountInfo?.discountAmount || 0));
  const addonDiscountAmount = this.calculateSelectedAddonDiscountAmount();
  const combinedDiscountAmount = Math.min(totalPrice, baseDiscountAmount + addonDiscountAmount);
  const finalPrice = Math.max(0, totalPrice - combinedDiscountAmount);

  return {
    ...discountInfo,
    hasDiscount: combinedDiscountAmount > 0,
    qualifiesForDiscount: combinedDiscountAmount > 0,
    discountAmount: combinedDiscountAmount,
    addonDiscountAmount,
    finalPrice,
    discountPercentage: totalPrice > 0 ? (combinedDiscountAmount / totalPrice) * 100 : 0,
  };
},

renderAddonEligibilityMessage(step, eligibilityState) {
  const messages = step?.addonMessaging || {};
  const tierMessages = messages.tier1 || {};
  const template = eligibilityState.isEligible
    ? tierMessages.eligibleState
    : tierMessages.ineligibleState;
  if (!template) return '';

  return Object.entries(eligibilityState.variables).reduce((message, [key, value]) => {
    return message
      .replaceAll(`##${key}##`, value)
      .replaceAll(`{{${key}}}`, value);
  }, template);
},

renderAddonSectionTitle(step) {
  const title = step?.freeGiftName || step?.addonTitle || step?.addonLabel;
  if (typeof title !== 'string' || !title.trim()) return null;

  const titleEl = document.createElement('div');
  titleEl.className = 'side-panel-item-count side-panel-addon-title';
  titleEl.textContent = title.trim();
  return titleEl;
},

_initDefaultProducts() {
  const steps = this.selectedBundle?.steps || [];
  steps.forEach((step, stepIndex) => {
    if (!step.isDefault || !step.defaultVariantId) return;
    // Canonicalize variant identifiers before matching and storing selection state.
    const targetId = this.extractId(step.defaultVariantId);
    if (!targetId) return;
    const allProducts = [...(step.products || []), ...(step.StepProduct || [])];
    const product = allProducts.find(p =>
      this.extractId(p.variantId) === targetId ||
      this.extractId(p.id) === targetId ||
      this.extractId(p.gid) === targetId ||
      (p.variants || []).some(v =>
        this.extractId(v.id) === targetId || this.extractId(v.gid) === targetId
      )
    );
    if (product) {
      if (!this.selectedProducts[stepIndex]) this.selectedProducts[stepIndex] = {};
      this.selectedProducts[stepIndex][targetId] = 1;
    }
  });
},

// Re-lock free gift if paid items no longer satisfy the unlock condition
_syncFreeGiftLock() {
  if (!this.freeGiftStep || this.freeGiftStepIndex < 0) return;
  if (!this.isFreeGiftUnlocked) {
    this.selectedProducts[this.freeGiftStepIndex] = {};
  }
},

// Render the free gift locked/unlocked section in a given container
_renderFreeGiftSection(container) {
  const step = this.freeGiftStep;
  if (!step) return;

  const section = document.createElement('div');
  const giftName = this._escapeHTML(step.freeGiftName || 'gift');
  const hasDirectAddonTiers = step.addonEligibilityCondition || Array.isArray(step.addonTiers);

  if (hasDirectAddonTiers) {
    const eligibilityState = this.getAddonEligibilityState(step);
    const message = this.renderAddonEligibilityMessage(step, eligibilityState);
    if (!message) return;

    const title = this.renderAddonSectionTitle(step);
    if (title) container.appendChild(title);

    section.className = eligibilityState.isEligible
      ? 'side-panel-addon-message side-panel-free-gift unlocked'
      : 'side-panel-addon-message side-panel-free-gift';
    section.innerHTML = `
      <span class="side-panel-free-gift-icon">${eligibilityState.isEligible ? '✓' : '!'}</span>
      <span class="side-panel-free-gift-text">${this._escapeHTML(message)}</span>
    `;
    container.appendChild(section);
    return;
  }

  if (this.isFreeGiftUnlocked) {
    section.className = 'side-panel-free-gift unlocked';
    section.innerHTML = `
      <span class="side-panel-free-gift-icon">✅</span>
      <span class="side-panel-free-gift-text">Congrats! You're eligible for a FREE ${giftName}!</span>
    `;
  } else {
    const remaining = this._getFreeGiftRemainingCount();
    section.className = 'side-panel-free-gift';
    section.innerHTML = `
      <span class="side-panel-free-gift-icon">🔒</span>
      <span class="side-panel-free-gift-text">Add ${remaining} more product${remaining !== 1 ? 's' : ''} to claim a FREE ${giftName}!</span>
    `;
  }
  container.appendChild(section);
},

_renderStandardSidebarEmptySlots(container, options = {}) {
  const slotCount = this.getSummarySidebarMaxItemCount();
  const filledCount = Math.max(0, Number(options.filledCount || 0));
  const emptySlotCount = Math.max(0, slotCount - filledCount);
  const mode = options.mode || this.getSummarySidebarEmptyStateMode();

  if (mode === 'slots') {
    const emptyStateIconUrl = this._escapeHTML(this.selectedBundle?.productSlotIconUrl || '');
    const slots = document.createElement('div');
    slots.className = 'side-panel-inline-slots';

    for (let i = 0; i < emptySlotCount; i += 1) {
      const slot = document.createElement('div');
      slot.className = 'side-panel-inline-slot';
      slot.innerHTML = emptyStateIconUrl
        ? `<img class="side-panel-inline-slot-icon" src="${emptyStateIconUrl}" alt="" loading="lazy">`
        : '<span class="side-panel-inline-slot-placeholder">+</span>';
      slots.appendChild(slot);
    }

    if (slots.children.length > 0) {
      container.appendChild(slots);
    }
    return;
  }

  const emptyStateIconUrl = this._shouldRenderProductSlots()
    ? this._escapeHTML(this.selectedBundle?.productSlotIconUrl || '')
    : '';
  const thumbnailMarkup = emptyStateIconUrl
    ? `<img class="side-panel-product-img side-panel-product-slot-icon" src="${emptyStateIconUrl}" alt="" loading="lazy">`
    : '<div class="side-panel-product-img-placeholder side-panel-skeleton-thumb"></div>';

  for (let i = 0; i < slotCount; i += 1) {
    const slot = document.createElement('div');
    slot.className = 'side-panel-product-row side-panel-skeleton-slot side-panel-skeleton-slot--standard-empty';
    slot.innerHTML = `
      <div class="side-panel-product-img-wrap">
        ${thumbnailMarkup}
      </div>
      <div class="side-panel-product-info side-panel-skeleton-lines">
        <span class="side-panel-product-title side-panel-skeleton-line line-name"></span>
        <span class="side-panel-product-variant side-panel-skeleton-line line-variant"></span>
        <span class="side-panel-product-price side-panel-skeleton-line line-price"></span>
      </div>
      <span class="side-panel-product-remove side-panel-skeleton-remove"></span>
    `;
    container.appendChild(slot);
  }
},

// Render empty-summary skeleton rows that match selected product rows.
_renderSidebarProductSkeletons(container) {
  const slotCount = this.getSummarySidebarMaxItemCount();
  for (let i = 0; i < slotCount; i++) {
    const slot = document.createElement('div');
    slot.className = 'side-panel-product-row side-panel-skeleton-slot';
    slot.innerHTML = `
      <div class="side-panel-product-img-wrap">
        <div class="side-panel-product-img-placeholder side-panel-skeleton-thumb"></div>
      </div>
      <div class="side-panel-product-info side-panel-skeleton-lines">
        <span class="side-panel-product-title side-panel-skeleton-line line-name"></span>
        <span class="side-panel-product-variant side-panel-skeleton-line line-variant"></span>
      </div>
      <span class="side-panel-product-price side-panel-skeleton-line line-price"></span>
      <span class="side-panel-product-remove side-panel-skeleton-remove"></span>
    `;
    container.appendChild(slot);
  }
},

_getSummarySidebarRequiredQuantity(step) {
  if (!step || step.enabled === false || step.isDefault || step.isFreeGift) return null;
  if (ConditionValidator.isCategoryRuleMode(step)) return null;

  let requiredQuantity = null;

  const pushLowerBound = (operator, value) => {
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    if (operator === ConditionValidator.OPERATORS.EQUAL_TO) {
      requiredQuantity = Math.max(requiredQuantity ?? 0, value);
      return;
    }
    if (operator === ConditionValidator.OPERATORS.GREATER_THAN_OR_EQUAL_TO) {
      requiredQuantity = Math.max(requiredQuantity ?? 0, value);
    }
  };

  if (step.conditionOperator != null && step.conditionValue != null) {
    const primary = Number(step.conditionValue);
    pushLowerBound(step.conditionOperator, primary);
  }

  if (step.conditionOperator2 != null && step.conditionValue2 != null) {
    const secondary = Number(step.conditionValue2);
    pushLowerBound(step.conditionOperator2, secondary);
  }

  if (requiredQuantity != null && requiredQuantity > 0) {
    return requiredQuantity;
  }

  return null;
},

getSummarySidebarMaxItemCount(selectedCount = 0) {
  const steps = Array.isArray(this.selectedBundle?.steps) ? this.selectedBundle.steps : [];
  let totalRequired = 0;

  for (const step of steps) {
    const required = this._getSummarySidebarRequiredQuantity(step);
    if (Number.isFinite(required) && required > 0) {
      totalRequired += required;
    }
  }

  const selected = Number(selectedCount || 0);
  return Math.max(totalRequired, selected, 1);
},

getSummarySidebarEmptyStateMode() {
  return this._shouldRenderProductSlots?.() === true ? 'slots' : 'skeletons';
},
};
