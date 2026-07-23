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


export const fullPageSearchCategoryMethods = {
createSearchInput() {
  const searchContainer = document.createElement('div');
  searchContainer.className = 'step-search-container';

  searchContainer.innerHTML = `
    <div class="step-search-input-wrapper">
      <svg class="step-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        type="text"
        class="step-search-input"
        placeholder="Search products..."
        value="${this.searchQuery}"
        autocomplete="off"
      />
      <button class="step-search-clear" type="button" style="display: ${this.searchQuery ? 'flex' : 'none'}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `;

  const input = searchContainer.querySelector('.step-search-input');
  const clearBtn = searchContainer.querySelector('.step-search-clear');

  // Handle input with debounce
  input.addEventListener('input', (e) => {
    const value = e.target.value;

    // Show/hide clear button
    clearBtn.style.display = value ? 'flex' : 'none';

    // Debounce the search
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.searchQuery = value;
      this.updateProductGridWithSearch();
    }, 300);
  });

  // Handle clear button
  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    this.searchQuery = '';
    this.updateProductGridWithSearch();
    input.focus();
  });

  // Handle escape key to clear
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      clearBtn.style.display = 'none';
      this.searchQuery = '';
      this.updateProductGridWithSearch();
    }
  });

  return searchContainer;
},

// Update product grid when search query changes (without full re-render)
updateProductGridWithSearch() {
  const gridContainer = this.container.querySelector('.full-page-product-grid-container');
  if (!gridContainer) return;

  const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
  gridContainer.innerHTML = '';
  gridContainer.appendChild(productGrid);
},

// Hide the page title element from the theme template
// This prevents showing the page name (e.g., "StrangeObjectsinmirror") above the bundle
hidePageTitle() {
  const configName = (() => {
    if (this.selectedBundle?.name) return this.selectedBundle.name;
    try {
      const rawConfig = this.container?.dataset?.bundleConfig;
      if (!rawConfig) return '';
      return JSON.parse(rawConfig)?.name || '';
    } catch (e) {
      return '';
    }
  })();
  const normalizedConfigName = String(configName || '').trim().toLowerCase();

  // Try multiple selectors to find the page title element
  const selectors = [
    '.main-page-title',
    '.page-title',
    'h1.page-title',
    '.page-width h1',
    '.section-template--*__main-padding h1',
    '[class*="main-padding"] h1.h0'
  ];

  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // Check if this is a page title element (not our promo banner)
        if (el.closest('.promo-banner')) return;

        // Remove the element entirely so the host page title is not left in the DOM.
        el.remove();
      });
    } catch (e) {
      // Selector might be invalid, continue to next
    }
  }

  // Also hide any parent containers that only contain the title
  const pageTitleContainers = document.querySelectorAll('.page-width--narrow');
  pageTitleContainers.forEach(container => {
    // Only hide if the container has a page title and not much else
    const hasPageTitle = container.querySelector('.main-page-title, .page-title, h1.h0');
    const hasOtherContent = container.querySelector('.rte:not(:empty), .bundle-widget, #bundle-builder-app');

    if (hasPageTitle && !hasOtherContent) {
      container.remove();
    }
  });

  document.querySelectorAll('.shopify-section, [id^="shopify-section"], section').forEach(section => {
    if (!section.querySelector?.('.bundle-widget-container, #bundle-builder-app')) return;

    section.querySelectorAll?.('h1').forEach(el => {
      if (el.closest('.bundle-widget-container, #bundle-builder-app, .promo-banner')) return;

      const titleBlock = el.closest('.text-block, .page-width--narrow') || el.parentElement;
      if (titleBlock && !titleBlock.querySelector('.bundle-widget-container, #bundle-builder-app')) {
        titleBlock.remove();
        return;
      }

      el.remove();
    });
  });

  if (!normalizedConfigName) return;

  document.querySelectorAll('h1').forEach(el => {
    if (el.closest('.bundle-widget-container, .promo-banner')) return;
    const normalizedTitle = String(el.textContent || '').trim().toLowerCase();
    if (normalizedTitle !== normalizedConfigName) return;

    const titleSection = el.closest('.shopify-section, [id^="shopify-section"], section');
    if (titleSection && !titleSection.querySelector('.bundle-widget-container')) {
      titleSection.remove();
      return;
    }

    const titleBlock = el.closest('.text-block, .page-width--narrow') || el.parentElement;
    if (titleBlock && !titleBlock.querySelector('.bundle-widget-container')) {
      titleBlock.remove();
    } else {
      el.remove();
    }
  });
},

// Create promotional banner (Competitor-Inspired with gradient hero style)
// Shows bundle title with optional discount info from Settings -> Design
createPromoBanner() {
  // Check if promo banner is disabled via theme editor settings
  if (this.config.showPromoBanner === false) {
    return null;
  }

  // Check if promo banner is enabled via Settings design CSS variable
  const promoBannerEnabled = getComputedStyle(document.documentElement)
    .getPropertyValue('--bundle-promo-banner-enabled')
    .trim();

  // If explicitly disabled (value is '0'), don't create the banner
  if (promoBannerEnabled === '0') {
    return null;
  }

  const bundleName = this.selectedBundle?.name || 'Build Your Bundle';
  const pricing = this.selectedBundle?.pricing;
  const rules = pricing?.rules || [];
  const currencyInfo = CurrencyManager.getCurrencyInfo();

  // Start with the bundle name as the main title
  let promoTitle = bundleName;
  let promoSubtitle = '';
  let promoNote = '';
  let discountMessage = '';

  if (pricing?.enabled && rules.length > 0) {
    const pricingMethod = pricing.method || 'percentage_off';
    const bestRule = rules.reduce((best, rule) => {
      const dv = rule.discountValue ?? 0;
      const bestDv = best.discountValue ?? 0;
      const isPercent = pricingMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF;
      const discountValue = isPercent ? dv : dv / 100;
      const bestValue = isPercent ? bestDv : bestDv / 100;
      return discountValue > bestValue ? rule : best;
    }, rules[0]);

    const targetQty = bestRule.conditionValue ?? 0;
    const conditionOperator = bestRule.conditionOperator;
    const discountMethod = pricingMethod;
    const discountValue = bestRule.discountValue ?? 0;

    // Build operator-aware quantity text
    const qtyText = TemplateManager.formatOperatorText(conditionOperator, targetQty, 'item');

    if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF && discountValue > 0) {
      discountMessage = `Add ${qtyText} and get ${discountValue}% off!`;
    } else if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF && discountValue > 0) {
      const formattedAmount = CurrencyManager.convertAndFormat(discountValue, currencyInfo);
      discountMessage = `Add ${qtyText} and save ${formattedAmount}!`;
    } else if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE && discountValue > 0) {
      const formattedPrice = CurrencyManager.convertAndFormat(discountValue, currencyInfo);
      discountMessage = `Add ${qtyText} for just ${formattedPrice}!`;
    }
  }

  // Use custom banner message if configured (overrides discount message)
  if (pricing?.messages?.banner) {
    discountMessage = pricing.messages.banner;
  }

  // Determine layout based on whether we have a discount
  if (discountMessage) {
    promoNote = discountMessage;
  }

  const tierBadges = this.createPromoDiscountTierBadges(pricing, currencyInfo);
  const banner = document.createElement('div');
  banner.className = 'promo-banner';
  banner.classList.add(discountMessage ? 'has-discount' : 'no-discount');
  banner.innerHTML = `
    ${promoSubtitle ? `<div class="promo-banner-subtitle">${ComponentGenerator.escapeHtml(promoSubtitle)}</div>` : ''}
    <h2 class="promo-banner-title">${ComponentGenerator.escapeHtml(promoTitle)}</h2>
    ${promoNote ? `<div class="promo-banner-note">${ComponentGenerator.escapeHtml(promoNote)}</div>` : ''}
    ${tierBadges}
  `;

  const bgImageUrl = this.selectedBundle && this.selectedBundle.promoBannerBgImage;
  if (bgImageUrl) {
    banner.style.setProperty('--fpb-promo-banner-bg-image', `url("${String(bgImageUrl).replace(/"/g, '\\"')}")`);
    banner.style.setProperty('--fpb-promo-banner-bg-size', 'cover');
    banner.style.setProperty('--fpb-promo-banner-bg-position', 'center');
  }

  return banner;
},

createPromoDiscountTierBadges(pricing, currencyInfo) {
  const rules = Array.isArray(pricing?.rules) ? pricing.rules : [];
  if (!pricing?.enabled || rules.length === 0) return '';

  const badges = rules
    .filter(rule => rule && (rule.conditionType === 'quantity' || rule.conditionType === 'amount'))
    .sort((a, b) => (Number(a.conditionValue || 0) || 0) - (Number(b.conditionValue || 0) || 0))
    .map(rule => this.formatPromoDiscountTierLabel(rule, pricing, currencyInfo))
    .filter(Boolean)
    .map(label => `<span class="promo-discount-tier-badge">${ComponentGenerator.escapeHtml(label)}</span>`);

  if (badges.length === 0) return '';
  return `<div class="promo-discount-tier-row">${badges.join('')}</div>`;
},

formatPromoDiscountTierLabel(rule, pricing, currencyInfo) {
  const ruleId = String(rule?.id || '');
  const tierText = pricing?.messages?.tierTextByRuleId?.[ruleId];
  if (tierText?.tierText && tierText?.tierSubtext) {
    return `${tierText.tierText} / ${tierText.tierSubtext}`;
  }
  if (tierText?.tierText) return tierText.tierText;
  if (tierText?.tierSubtext) return tierText.tierSubtext;

  const threshold = Number(rule?.conditionValue || 0) || 0;
  const discountValue = Number(rule?.discountValue || 0) || 0;
  if (!threshold || !discountValue) return '';

  const thresholdText = rule.conditionType === 'amount'
    ? CurrencyManager.convertAndFormat(threshold, currencyInfo)
    : String(threshold);
  let discountText = '';
  const discountMethod = pricing?.method || 'percentage_off';
  if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF) {
    discountText = `${discountValue}%`;
  } else if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF || discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE) {
    discountText = CurrencyManager.convertAndFormat(discountValue, currencyInfo);
  }

  return discountText ? `${thresholdText} / ${discountText}` : thresholdText;
},

collectStepProductIds(step) {
  const productIds = [];
  const addProductId = (product) => {
    const id = product?.id || product?.graphqlId || product?.productId;
    if (id && !productIds.includes(id)) productIds.push(id);
  };

  (step.products || []).forEach(addProductId);
  (step.categories || []).forEach(category => {
    (category.products || []).forEach(addProductId);
    (category.selectedProducts || []).forEach(addProductId);
  });

  return productIds;
},

collectStepCollectionHandles(step) {
  const handles = [];
  const addCollectionHandle = (collection) => {
    const handle = collection?.handle;
    if (handle && !handles.includes(handle)) handles.push(handle);
  };

  (step.collections || []).forEach(addCollectionHandle);
  (step.categories || []).forEach(category => {
    (category.collections || []).forEach(addCollectionHandle);
    (category.collectionsData || []).forEach(addCollectionHandle);
    (category.collectionsSelectedData || []).forEach(addCollectionHandle);
  });

  return handles;
},

getStepCategoryTabEntries(step) {
  if (!Array.isArray(step.categories)) return [];

  return step.categories
    .map((category, index) => {
      const id = category.categoryId || category.id || `category-${index}`;
      const title = category.title || category.name;
      if (!id || !title) return null;

      const handles = [];
      const productIds = [];
      const addHandle = (collection) => {
        const handle = collection?.handle;
        if (handle && !handles.includes(handle)) handles.push(handle);
      };
      const addProductId = (product) => {
        const productId = product?.id || product?.graphqlId || product?.productId;
        if (productId && !productIds.includes(productId)) productIds.push(productId);
      };

      (category.collections || []).forEach(addHandle);
      (category.collectionsData || []).forEach(addHandle);
      (category.collectionsSelectedData || []).forEach(addHandle);
      (category.products || []).forEach(addProductId);
      (category.selectedProducts || []).forEach(addProductId);

      return {
        id,
        title,
        handles,
        productIds,
        displayVariantsAsIndividualProducts: category.displayVariantsAsIndividualProducts === true,
        displayVariantsAsSwatches: category.displayVariantsAsSwatches === true,
      };
    })
    .filter(Boolean);
},

getActiveStepCategoryId(step) {
  const categoryEntries = this.getStepCategoryTabEntries(step);
  if (categoryEntries.length === 0) return this.activeCollectionId;
  if (this.activeCollectionId && categoryEntries.some(entry => entry.id === this.activeCollectionId)) {
    return this.activeCollectionId;
  }
  return categoryEntries[0].id;
},

getActiveStepCategoryEntry(step) {
  const categoryEntries = this.getStepCategoryTabEntries(step);
  const activeCategoryId = this.getActiveStepCategoryId(step);
  return categoryEntries.find(entry => entry.id === activeCategoryId) || null;
},

shouldDisplayVariantsAsIndividualForProductGrid(step, activeCategory) {
  const stepDisplaysVariantsAsIndividual =
    step?.displayVariantsAsIndividualProducts === true || step?.displayVariantsAsIndividual === true;

  if (activeCategory) {
    return activeCategory.displayVariantsAsIndividualProducts === true || stepDisplaysVariantsAsIndividual;
  }

  const hasCategoryEntries = this.getStepCategoryTabEntries(step).length > 0;
  if (hasCategoryEntries) {
    return false;
  }

  return stepDisplaysVariantsAsIndividual;
},

createActiveCategoryTitle(stepIndex) {
  if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
    return null;
  }

  const activeCategory = this.getActiveStepCategoryEntry(this.selectedBundle.steps[stepIndex]);
  if (!activeCategory?.title) return null;

  const title = document.createElement('div');
  title.className = 'fpb-step-category-title';
  title.textContent = activeCategory.title;
  return title;
},
};
