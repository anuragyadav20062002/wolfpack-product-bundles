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


export const fullPageBoxSelectionSidebarMethods = {
getSidebarTierCtaContent(nextRule) {
  const pricing = this.selectedBundle?.pricing;
  if (!pricing?.enabled) return null;

  const displayOptions = pricing.messages?.displayOptions || {};
  const bundleQuantityOptions = displayOptions.bundleQuantityOptions || {};
  const optionsByRuleId = bundleQuantityOptions.optionsByRuleId || {};
  const tierTextByRuleId = pricing.messages?.tierTextByRuleId || {};
  const rules = Array.isArray(pricing.rules) ? pricing.rules : [];
  const ruleId = bundleQuantityOptions.defaultRuleId || nextRule?.id || rules[0]?.id;
  const rule = ruleId ? rules.find(item => String(item?.id || '') === String(ruleId)) : null;
  const option = ruleId ? (optionsByRuleId[ruleId] || tierTextByRuleId[ruleId]) : null;
  const label = typeof option?.label === 'string' && option.label.trim()
    ? option.label.trim()
    : (typeof option?.tierText === 'string' ? option.tierText.trim() : '');
  let subtext = typeof option?.subtext === 'string' && option.subtext.trim()
    ? option.subtext.trim()
    : (typeof option?.tierSubtext === 'string' ? option.tierSubtext.trim() : '');
  if (pricing.method === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE && rule) {
    const discountValue = Number(rule.discountValue ?? rule.discount?.value ?? 0) || 0;
    if (discountValue > 0) {
      subtext = `Bundle for ${CurrencyManager.convertAndFormat(discountValue, CurrencyManager.getCurrencyInfo())}`;
    }
  }

  if (!label && !subtext) return null;
  return { label, subtext };
},

getBoxSelectionRules() {
  const boxSelection = this.selectedBundle?.boxSelection;
  if (!boxSelection || boxSelection.isEnabled !== true || !Array.isArray(boxSelection.rules)) {
    return [];
  }

  return boxSelection.rules
    .map(rule => ({
      ruleId: String(rule.ruleId || ''),
      boxQuantity: Number(rule.boxQuantity || 0),
      boxLabel: String(rule.boxLabel || ''),
      boxSubtext: String(rule.boxSubtext || ''),
      isDefaultSelected: rule.isDefaultSelected === true,
    }))
    .filter(rule => rule.ruleId && rule.boxQuantity > 0)
    .sort((a, b) => a.boxQuantity - b.boxQuantity);
},

getActiveBoxSelectionRule(rules, totalQuantity) {
  if (!Array.isArray(rules) || rules.length === 0) return null;

  const selected = this.selectedBoxSelectionRuleId
    ? rules.find(rule => rule.ruleId === this.selectedBoxSelectionRuleId)
    : null;
  if (selected) return selected;

  const reachedRule = rules
    .filter(rule => Number(totalQuantity || 0) >= rule.boxQuantity)
    .sort((a, b) => b.boxQuantity - a.boxQuantity)[0];
  if (reachedRule) return reachedRule;

  return rules.find(rule => rule.isDefaultSelected) || rules[0];
},

getSelectedBoxSelectionQuantity() {
  return this.getAllSelectedProductsData().reduce((total, item) => {
    if (item.isDefault === true || item.isFreeGift === true) return total;
    return total + (Number(item.quantity || 0) || 0);
  }, 0);
},

getBoxSelectionValidationState(totalQuantity = this.getSelectedBoxSelectionQuantity()) {
  const boxSelection = this.selectedBundle?.boxSelection;
  const rules = this.getBoxSelectionRules();
  const activeRule = this.getActiveBoxSelectionRule(rules, totalQuantity);
  const isEnabled = boxSelection?.isEnabled === true
    && boxSelection?.validateBoxSelectionQuantity === true
    && !!activeRule;

  if (!isEnabled) {
    return {
      isEnabled: false,
      isValid: true,
      activeRule,
      totalQuantity: Number(totalQuantity || 0),
    };
  }

  return {
    isEnabled: true,
    isValid: Number(totalQuantity || 0) === Number(activeRule.boxQuantity || 0),
    activeRule,
    totalQuantity: Number(totalQuantity || 0),
  };
},

canCheckoutWithBoxSelection() {
  return this.getBoxSelectionValidationState().isValid;
},

showBoxSelectionValidationMessage() {
  const state = this.getBoxSelectionValidationState();
  if (!state.isEnabled || state.isValid) return;

  ToastManager.show(`Select exactly ${state.activeRule.boxQuantity} item(s) for ${state.activeRule.boxLabel || 'this box'} before adding to cart.`);
},

renderBoxSelectionOptions(totalQuantity = 0) {
  const rules = this.getBoxSelectionRules();
  if (rules.length === 0) return null;

  const activeRule = this.getActiveBoxSelectionRule(rules, totalQuantity);
  const wrapper = document.createElement('div');
  wrapper.className = 'fpb-box-selection-wrapper';

  rules.forEach(rule => {
    const option = document.createElement('button');
    const isActive = activeRule?.ruleId === rule.ruleId;
    option.type = 'button';
    option.className = 'fpb-box-selection-option' + (isActive ? ' fpb-box-selection-option-active' : '');
    option.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    option.dataset.ruleId = rule.ruleId;

    const title = document.createElement('span');
    title.className = 'fpb-box-selection-title';
    title.textContent = rule.boxLabel;
    option.appendChild(title);

    if (rule.boxSubtext) {
      const subtext = document.createElement('span');
      subtext.className = 'fpb-box-selection-subtext';
      subtext.textContent = rule.boxSubtext;
      option.appendChild(subtext);
    }

    option.addEventListener('click', () => {
      this.selectedBoxSelectionRuleId = rule.ruleId;
      this.reRenderFullPage();
    });

    wrapper.appendChild(option);
  });

  return wrapper;
},

getClassicSidebarSlotCount(allSelectedProducts = [], activeStep = null) {
  const selectedBoxSelectionQuantity = this.getSelectedBoxSelectionQuantity();
  const boxRules = this.getBoxSelectionRules();
  const activeBoxRule = this.getActiveBoxSelectionRule(
    boxRules,
    selectedBoxSelectionQuantity
  );

  const activeBoxQuantity = Number(activeBoxRule?.boxQuantity || 0);
  const stepQuantity = Number(activeStep?.maxQuantity || activeStep?.minQuantity || 0);
  const selectedCount = Array.isArray(allSelectedProducts) ? allSelectedProducts.length : 0;

  if (activeBoxQuantity > 0) {
    return Math.max(activeBoxQuantity, selectedCount);
  }

  return Math.max(stepQuantity, selectedCount + 1, 2);
},

renderClassicSidebarSlots(allSelectedProducts = [], slotCount = 0) {
  const safeSlotCount = Math.max(0, Number(slotCount || 0));
  const slotData = [];

  for (let slotIndex = 0; slotIndex < safeSlotCount; slotIndex += 1) {
    const item = allSelectedProducts[slotIndex];

    if (item) {
      const summaryTitle = this.getSummaryProductDisplayTitle(item);
      const productId = item.variantId || item.productId || item.id;
      slotData.push({
        id: `classic-slot-${slotIndex}`,
        label: summaryTitle,
        product: {
          id: productId,
          title: summaryTitle,
          variantTitle: this.getSummaryProductVariantDisplay(item),
          imageUrl: this._getSelectedProductImageSrc(item) || BUNDLE_WIDGET.PLACEHOLDER_IMAGE,
          quantity: item.quantity,
          isDefault: item.isDefault === true,
          stepIndex: item.stepIndex,
        },
      });
    } else {
      slotData.push({
        id: `classic-slot-${slotIndex}`,
        label: 'Empty bundle slot',
      });
    }
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderSelectedProductSlots(slotData, {
    className: 'classic-sidebar-slots bw-selected-slots--classic-sidebar',
    emptySlotIconUrl: this._shouldRenderProductSlots()
      ? this.selectedBundle?.productSlotIconUrl || ''
      : '',
  }).trim();
  const slots = wrapper.firstElementChild;

  slots?.querySelectorAll('[data-action="remove-selected-product"]').forEach(removeBtn => {
    removeBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const productId = removeBtn.dataset.variantId;
      const item = allSelectedProducts.find(selectedItem =>
        String(selectedItem.variantId || selectedItem.productId || selectedItem.id) === String(productId)
      );
      if (!item || !productId) return;

      const summaryTitle = this.getSummaryProductDisplayTitle(item);
      const removedItem = {
        stepIndex: item.stepIndex,
        variantId: productId,
        quantity: item.quantity,
        title: summaryTitle,
      };

      this.updateProductSelection(item.stepIndex, productId, 0);

      const truncated = summaryTitle && summaryTitle.length > 25
        ? summaryTitle.substring(0, 25) + '...'
        : (summaryTitle || 'Product');

      ToastManager.showWithUndo(
        `Removed "${truncated}"`,
        () => {
          this.updateProductSelection(
            removedItem.stepIndex,
            removedItem.variantId,
            removedItem.quantity
          );
        },
        5000
      );
    });
  });

  return slots;
},

// Escape HTML special characters to prevent innerHTML injection
_escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
},

_getSelectedProductImageSrc(item = {}) {
  const getImageSrc = (image) => {
    if (!image) return '';
    if (typeof image === 'string') return image;
    return image.src
      || image.url
      || image.originalSrc
      || image.transformedSrc
      || '';
  };

  return getImageSrc(item.variantImage)
    || getImageSrc(item.variantImage?.src)
    || getImageSrc(item.variant?.image)
    || (typeof item.image === 'string' ? item.image : '')
    || item.image?.src
    || item.image?.url
    || item.image?.originalSrc
    || getImageSrc(item.imageUrl)
    || item.featuredImage?.url
    || item.featuredImage?.src
    || getImageSrc(item.featuredImage)
    || getImageSrc(item.images?.[0])
    || getImageSrc(item.productImageUrl);
},

_formatSidebarDiscountMessage(discountMessage) {
  const message = typeof discountMessage === 'string' ? discountMessage.trim() : '';
  return message.replace(/!+\s*$/, '');
},

// Returns default SVG icon markup for a step based on its type
_getDefaultTimelineIcon(step) {
  if (step.isDefault) {
    // Included/locked step — lock icon
    return `<svg class="timeline-step-icon--svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
  if (step.isFreeGift) {
    // Free gift step — gift box icon
    return `<svg class="timeline-step-icon--svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="20 12 20 22 4 22 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="2" y="7" width="20" height="5" rx="1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="12" y1="22" x2="12" y2="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
  // Regular step — shopping bag icon
  return `<svg class="timeline-step-icon--svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
},

_getStepSelectedQuantity(stepIndex) {
  const stepSelections = this.selectedProducts?.[stepIndex] || {};
  return Object.values(stepSelections).reduce((total, qty) => total + (Number(qty) || 0), 0);
},

_getStepRequiredQuantity(step) {
  if (!step) return 1;

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const primaryValue = toNumber(step.conditionValue);
  const secondaryValue = toNumber(step.conditionValue2);
  const minQuantity = toNumber(step.minQuantity);
  const maxQuantity = toNumber(step.maxQuantity);
  const OPERATORS = ConditionValidator.OPERATORS;

  const targetForOperator = (operator, value) => {
    if (value == null) return null;
    switch (operator) {
      case OPERATORS.GREATER_THAN:
        return value + 1;
      case OPERATORS.LESS_THAN:
        return Math.max(1, value - 1);
      case OPERATORS.LESS_THAN_OR_EQUAL_TO:
      case OPERATORS.EQUAL_TO:
      case OPERATORS.GREATER_THAN_OR_EQUAL_TO:
        return value;
      default:
        return null;
    }
  };

  const targets = [
    targetForOperator(step.conditionOperator, primaryValue),
    targetForOperator(step.conditionOperator2, secondaryValue),
    minQuantity,
    maxQuantity,
  ].filter((value) => value != null && value > 0);

  return targets.length > 0 ? Math.max(...targets) : 1;
},

_getStepProgressRatio(stepIndex) {
  const step = this.selectedBundle?.steps?.[stepIndex];
  if (!step) return 0;
  if (this.isStepCompleted(stepIndex)) return 1;

  const requiredQuantity = this._getStepRequiredQuantity(step);
  const selectedQuantity = this._getStepSelectedQuantity(stepIndex);
  return Math.max(0, Math.min(1, selectedQuantity / requiredQuantity));
},

_getDefaultTimelineIconDataUri(step) {
  const svg = this._getDefaultTimelineIcon(step)
    .replace('class="timeline-step-icon--svg"', 'xmlns="http://www.w3.org/2000/svg"')
    .replace(' xmlns="http://www.w3.org/2000/svg"', '');
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
},

_isStandardSideFooterTimeline() {
  return this.resolveFullPageLayout() === 'footer_side' && this.getFullPageDesignPreset() === 'DEFAULT';
},

buildStepTimelineEntries() {
  const steps = Array.isArray(this.selectedBundle?.steps) ? this.selectedBundle.steps : [];
  const entries = [];

  steps.forEach((step, index) => {
    const stepLabel = (step.isFreeGift && step.addonLabel) ? step.addonLabel : step.name;
    entries.push({
      type: 'step',
      step,
      stepIndex: index,
      label: stepLabel,
    });

    if (this.shouldRenderMultipleCategoryTimelineEntry(step)) {
      entries.push({
        type: 'multiple_categories',
        step,
        stepIndex: index,
        label: 'Multiple Categories',
      });
    }
  });

  return entries;
},

getStandardTimelinePageSize() {
  return window.innerWidth < 768 ? 4 : 5;
},
};
