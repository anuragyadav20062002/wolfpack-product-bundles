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


export const fullPageRuntimeCartSettingsMethods = {
updateModalHeaderText(totalPrice, totalQuantity, discountInfo, currencyInfo) {
  const modalStepTitle = this.elements.modal.querySelector('.modal-step-title');
  if (!modalStepTitle) return;

  // If discount is not enabled, show step name (escaped)
  if (!this.selectedBundle?.pricing?.enabled) {
    const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
    modalStepTitle.innerHTML = this._escapeHTML(currentStep?.name) || `Step ${this.currentStepIndex + 1}`;
    return;
  }

  const variables = TemplateManager.createDiscountVariables(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    discountInfo,
    currencyInfo
  );

  const headerText = TemplateManager.replaceVariables(
    this.config.discountTextTemplate,
    variables
  );

  modalStepTitle.innerHTML = headerText;
},

updateModalDiscountMessaging(totalPrice, totalQuantity, discountInfo, currencyInfo) {
  const footerDiscountText = this.elements.modal.querySelector('.footer-discount-text');
  const discountSection = this.elements.modal.querySelector('.modal-footer-discount-messaging');

  if (!footerDiscountText) return;

  const variables = TemplateManager.createDiscountVariables(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    discountInfo,
    currencyInfo
  );

  if (discountInfo.qualifiesForDiscount) {
    // Success message
    const successMessage = TemplateManager.replaceVariables(
      this.config.successMessageTemplate,
      variables
    );
    footerDiscountText.innerHTML = successMessage;
    if (discountSection) discountSection.classList.add('qualified');
  } else {
    // Progress message
    const progressMessage = TemplateManager.replaceVariables(
      this.config.discountTextTemplate,
      variables
    );
    footerDiscountText.innerHTML = progressMessage;
    if (discountSection) discountSection.classList.remove('qualified');
  }

  // Show/hide discount section based on config
  if (discountSection) {
    discountSection.style.display = this.config.showDiscountMessaging ? 'block' : 'none';
  }
},

updateFooterTotalPrices(totalPrice, discountInfo, currencyInfo) {
  const strikePriceEl = this.elements.modal.querySelector('.total-price-strike');
  const finalPriceEl = this.elements.modal.querySelector('.total-price-final');

  if (!strikePriceEl || !finalPriceEl) return;

  if (discountInfo.qualifiesForDiscount && discountInfo.finalPrice < totalPrice) {
    // Show strike-through original price and discounted price
    strikePriceEl.textContent = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
    strikePriceEl.style.display = 'inline';
    finalPriceEl.textContent = CurrencyManager.convertAndFormat(discountInfo.finalPrice, currencyInfo);
  } else {
    // Show only regular price
    strikePriceEl.style.display = 'none';
    finalPriceEl.textContent = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
  }
},

// ========================================================================
// LOADING OVERLAY
// ========================================================================

showLoadingOverlay(gifUrl) {
  if (!this.container) return;
  // Ensure container is positioned so absolute overlay works
  const pos = getComputedStyle(this.container).position;
  if (pos !== 'relative' && pos !== 'absolute' && pos !== 'fixed' && pos !== 'sticky') {
    this.container.style.position = 'relative';
  }
  // Remove any existing overlay (idempotent)
  this.container.querySelector('.bundle-loading-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'bundle-loading-overlay';

  if (gifUrl) {
    const img = document.createElement('img');
    img.className = 'bundle-loading-overlay__gif';
    img.src = gifUrl;
    img.alt = '';
    overlay.appendChild(img);
  } else {
    const animation = createDefaultLoadingAnimation();
    overlay.appendChild(animation);
  }

  this.container.appendChild(overlay);
  requestAnimationFrame(() => markLoadingOverlayVisible(overlay));
},

hideLoadingOverlay() {
  const overlay = this.container?.querySelector('.bundle-loading-overlay');
  hideLoadingOverlayElement(overlay);
},

// ========================================================================
// CART OPERATIONS
// ========================================================================

generateBundleInstanceId() {
  // Generate unique bundle instance ID using UUID (recommended by Shopify)
  // This prevents hash collisions and ensures each bundle instance is truly unique
  // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID

  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    const uuid = crypto.randomUUID();
    const bundleInstanceId = `${this.selectedBundle.id}_${uuid}`;

    return bundleInstanceId;
  }

  // Fallback for older browsers: use timestamp + random number
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  const bundleInstanceId = `${this.selectedBundle.id}_${timestamp}_${random}`;

  return bundleInstanceId;
},

resolveFullPageOfferId() {
  const rawOfferId = this.selectedBundle?.offerId
    || this.selectedBundle?.bundleOfferId
    || this.selectedBundle?.id
    || 'UNKNOWN';
  const offerId = String(rawOfferId);
  return offerId.startsWith('FBP-') ? offerId : `FBP-${offerId}`;
},

async syncBundleDetailsCartMetafield(bundleDetailsKey, sourceProperties) {
  try {
    const displayProperties = this.buildBundleDetailsDisplayProperties(sourceProperties);
    if (!bundleDetailsKey || Object.keys(displayProperties).length === 0) return;

    const cartToken = await this.getBundleDetailsCartToken();
    if (!cartToken) return;

    const response = await fetch('/apps/product-bundles/api/cart-bundle-details', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cartToken,
        bundleDetailsKey,
        displayProperties
      })
    });

    if (!response.ok) {
      throw new Error(`bundle_details sync failed (${response.status})`);
    }

    const data = await response.json().catch(() => null);
    if (data?.ok !== true) {
      throw new Error(data?.error || 'bundle_details sync failed');
    }
  } catch (error) {
    console.warn('[Wolfpack Bundles] Failed to sync bundle_details cart metafield', error);
  }
},

buildBundleDetailsDisplayProperties(sourceProperties) {
  const displayProperties = {};
  const raw = sourceProperties?._bundle_display_properties;
  const cartLineLabels = this.getCartLineLabels();

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.box) displayProperties.Box = String(parsed.box);
      if (parsed?.items) displayProperties[cartLineLabels.items] = String(parsed.items);
      if (parsed?.retailPrice) displayProperties[cartLineLabels.retailPrice] = String(parsed.retailPrice);
      if (parsed?.youSave?.amountPercentage) displayProperties[cartLineLabels.youSave] = String(parsed.youSave.amountPercentage);
    } catch {
      // Ignore malformed display metadata; cart add must remain non-blocking.
    }
  }

  ['Box', cartLineLabels.items, cartLineLabels.retailPrice, cartLineLabels.youSave, 'Items', 'Retail Price', 'You Save'].forEach((key) => {
    if (sourceProperties?.[key] && !displayProperties[key]) {
      displayProperties[key] = String(sourceProperties[key]);
    }
  });

  return displayProperties;
},

getCartLineLabels() {
  const labels = this.config?.sharedCartLabels || {};
  return {
    items: labels.bundleContainsLabel || 'Items',
    retailPrice: labels.bundleOriginalPriceLabel || 'Retail Price',
    youSave: labels.bundleDiscountDisplayLabel || 'You Save',
  };
},

async getBundleDetailsCartToken() {
  const response = await fetch('/cart.js?app=wolfpackProductBundles', {
    credentials: 'same-origin'
  });
  if (!response.ok) return null;
  const cart = await response.json();
  return cart?.token || null;
},

generateBundleSessionKey() {
  return Math.random().toString(36).slice(2, 5).toUpperCase();
},
// ========================================================================
// EVENT HANDLERS
// ========================================================================

// ========================================================================
// TIER PILL SELECTION
// ========================================================================

/**
 * Parses the JSON string from data-tier-config into a TierConfig array.
 * Returns [] on any error — pill bar is simply not shown.
 */
parseTierConfig(rawJson) {
  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(t => typeof t?.label === 'string' && typeof t?.bundleId === 'string')
      .map(t => ({ label: t.label.trim(), bundleId: t.bundleId.trim() }))
      .filter(t => t.label !== '' && t.bundleId !== '')
      .slice(0, 4);
  } catch {
    return [];
  }
},

/**
 * Resolves which tier config array to use for pill rendering.
 *
 * Preference order:
 *  1. apiTierConfig (from DB via bundle API) — used when the merchant has saved
 *     tiers in the admin UI (>= 2 valid entries after mapping).
 *  2. dataTierConfig (from data-tier-config HTML attribute) — legacy Theme Editor
 *     source, used as fallback when apiTierConfig is null/undefined.
 *
 * apiTierConfig entries use { label, linkedBundleId } (DB schema).
 * Widget pill entries use { label, bundleId } — this method performs the mapping.
 *
 * Returns [] when fewer than 2 valid tiers exist after filtering.
 */
resolveTierConfig(apiTierConfig, dataTierConfig) {
  if (apiTierConfig == null) return dataTierConfig;

  const mapped = (Array.isArray(apiTierConfig) ? apiTierConfig : [])
    .filter(
      t =>
        typeof t?.label === 'string' &&
        typeof t?.linkedBundleId === 'string' &&
        t.label.trim() !== '' &&
        t.linkedBundleId.trim() !== ''
    )
    .map(t => ({ label: t.label.trim(), bundleId: t.linkedBundleId.trim() }))
    .slice(0, 4);

  return mapped.length >= 2 ? mapped : [];
},

/**
 * Resolves whether to show the step timeline.
 * Admin UI (API) value takes precedence over the theme editor data attribute when non-null.
 *
 * @param {boolean|null} apiValue - From selectedBundle.showStepTimeline (DB, nullable)
 * @param {boolean} dataAttrValue - From data-show-step-timeline attribute (theme editor)
 * @returns {boolean}
 */
resolveShowStepTimeline(apiValue, dataAttrValue) {
  if (apiValue !== null && apiValue !== undefined) return apiValue;
  return dataAttrValue;
},

resolveFullPageLayout(bundle = this.selectedBundle) {
  return 'footer_side';
},

getFullPageTemplate(bundle = this.selectedBundle) {
  return 'FBP_SIDE_FOOTER';
},

getFullPageDesignPreset(bundle = this.selectedBundle) {
  const rawPresetId =
    bundle?.bundleDesignPresetId
    || bundle?.bundleDesignPreset
    || bundle?.templateId
    || 'DEFAULT';
  if (typeof rawPresetId !== 'string') return 'DEFAULT';

  const preset = rawPresetId.trim().toUpperCase();
  if (preset === 'STANDARD') return 'DEFAULT';
  if (preset === 'DEFAULT_FBP') return 'DEFAULT';
  return preset || 'DEFAULT';
},

resolveFullPageCardCtaMode(bundle = this.selectedBundle) {
  const showTextOnAddButton =
  bundle?.showTextOnAddButton === true
  || bundle?.showTextOnPlusEnabled === true;

  if (this.resolveFullPageLayout(bundle) === 'footer_side' && this.getFullPageDesignPreset(bundle) === 'CLASSIC') {
    return showTextOnAddButton ? 'text' : 'icon';
  }

  return showTextOnAddButton ? 'text' : 'icon';
},

ensureFullPageTemplateStylesheet(preset) {
  const presetKey = String(preset || 'DEFAULT').trim().toUpperCase() || 'DEFAULT';
  const templateKey = presetKey === 'DEFAULT' ? 'STANDARD' : presetKey;
  const urls = window.__WOLFPACK_FPB_TEMPLATE_CSS_URLS__ || {};
  const href = urls[presetKey] || urls[templateKey] || urls.DEFAULT || urls.STANDARD;

  if (!href || typeof document === 'undefined') return;

  const alreadyLoaded = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((link) =>
    link.getAttribute('href') === href
    || link.href === href
    || link.dataset.wpbFpbTemplateCss === templateKey
  );

  if (alreadyLoaded) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.wpbFpbTemplateCss = templateKey;
  document.head.appendChild(link);
},

getProductAddButtonText() {
  return this.resolveFullPageCardCtaMode() === 'text'
    ? this._resolveText('productAddButton', 'Add +')
    : '+';
},

applyFullPageDesignPresetMarker() {
  if (!this.container || !this.elements?.stepsContainer) return;

  const fullPageTemplate = this.getFullPageTemplate();
  const fullPageDesignPreset = this.getFullPageDesignPreset();
  const fullPageTabStyle = fullPageDesignPreset === 'DEFAULT' || fullPageDesignPreset === 'HORIZONTAL' ? 'underline' : 'pill';
  const presetClass = `fpb-preset-${fullPageDesignPreset.toLowerCase()}`;

  this.container.dataset.fpbTemplateType = fullPageTemplate;
  this.elements.stepsContainer.dataset.fpbTemplateType = fullPageTemplate;

  this.container.dataset.fpbDesignPreset = fullPageDesignPreset;
  this.elements.stepsContainer.dataset.fpbDesignPreset = fullPageDesignPreset;
  this.container.dataset.fpbTabStyle = fullPageTabStyle;
  this.elements.stepsContainer.dataset.fpbTabStyle = fullPageTabStyle;
  const cardCtaMode = this.resolveFullPageCardCtaMode();
  this.elements.stepsContainer.dataset.fpbCardCtaMode = cardCtaMode;
  this.container.classList.remove('fpb-preset-default', 'fpb-preset-classic', 'fpb-preset-compact', 'fpb-preset-horizontal');
  this.container.classList.add(presetClass);
  this.container.classList.toggle('fpb-h', fullPageDesignPreset === 'HORIZONTAL');
  this.container.classList.toggle('fpb-d', fullPageDesignPreset === 'DEFAULT');
  this.elements.stepsContainer.classList.remove('fpb-preset-default', 'fpb-preset-classic', 'fpb-preset-compact', 'fpb-preset-horizontal');
  this.elements.stepsContainer.classList.add(presetClass);
  this.elements.stepsContainer.classList.toggle('fpb-h', fullPageDesignPreset === 'HORIZONTAL');
  this.elements.stepsContainer.classList.toggle('fpb-d', fullPageDesignPreset === 'DEFAULT');
  this.elements.stepsContainer.classList.toggle('fpb-i', cardCtaMode === 'icon');
  this.ensureFullPageTemplateStylesheet(fullPageDesignPreset);
},

/** Returns true if the given tier index is the currently active one. */
isTierActive(tierIndex) {
  return tierIndex === this.activeTierIndex;
},

/**
 * Inserts the tier pill bar as the first child of the container.
 * No-op when fewer than 2 tiers are configured (backward-compatible).
 */
};
