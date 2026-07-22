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

export function getEnabledFullPageSteps(steps) {
  if (!Array.isArray(steps)) return [];
  return steps.filter(step => step?.enabled !== false);
}

export const fullPageInitialRenderMethods = {
shouldRenderFullPageStepChrome() {
  return Array.isArray(this.selectedBundle?.steps)
    && this.selectedBundle.steps.length > 1;
},

updateMessagesFromBundle() {
  // Product-page bundles (metafield path) expose a top-level `messaging` object with
  // camelCase keys (progressTemplate / successTemplate).
  // Full-page bundles (API path) expose messages inside `pricing.messages` with
  // snake-style keys (progress / qualified). Try both shapes.
  const messaging = this.selectedBundle?.messaging;
  const pricingMessages = this.selectedBundle?.pricing?.messages;
  const pricingDisplay = this.selectedBundle?.pricing?.display;
  const displayOptions = messaging?.displayOptions || pricingMessages?.displayOptions || {};
  const progressBarOptions = displayOptions?.progressBar || {};

  if (messaging) {
    if (messaging.progressTemplate) {
      this.config.discountTextTemplate = messaging.progressTemplate;
    }
    if (messaging.successTemplate) {
      this.config.successMessageTemplate = messaging.successTemplate;
    }

    this.config.showDiscountMessaging = messaging.showDiscountMessaging !== false;
    this.config.showDiscountProgressBar = progressBarOptions.enabled === true || messaging.showDiscountProgressBar === true;

  } else if (pricingMessages) {
    // Full-page bundle API path: templates live in ruleMessages (first rule = global template).
    // When ruleMessagesByLocale is present, prefer the locale-specific messages.
    const shopLocale = window.Shopify?.locale;
    const byLocale = pricingMessages.ruleMessagesByLocale;
    const localeRuleMessages = shopLocale && byLocale?.[shopLocale];
    const ruleMessages = localeRuleMessages || pricingMessages.ruleMessages;
    const firstRuleMsg = ruleMessages && Object.values(ruleMessages)[0];
    if (firstRuleMsg?.discountText) {
      this.config.discountTextTemplate = firstRuleMsg.discountText;
    }
    if (firstRuleMsg?.successMessage) {
      this.config.successMessageTemplate = firstRuleMsg.successMessage;
    }

    this.config.showDiscountMessaging = pricingMessages.showDiscountMessaging === false
      ? false
      : this.selectedBundle?.pricing?.enabled || false;
    this.config.showDiscountProgressBar =
      progressBarOptions.enabled === true ||
      pricingMessages.showDiscountProgressBar === true ||
      pricingDisplay?.showDiscountProgressBar === true;

  } else {
    this.config.showDiscountMessaging = this.selectedBundle?.pricing?.enabled || false;
    this.config.showDiscountProgressBar = pricingDisplay?.showDiscountProgressBar === true;
  }

  this.config.discountProgressBarType = progressBarOptions.type === 'simple' ? 'simple' : 'step_based';
  this.config.discountProgressTextTemplate = progressBarOptions.progressText || this.config.discountTextTemplate;
  this.config.discountProgressSuccessTemplate = progressBarOptions.successText || this.config.successMessageTemplate;
},

applyPersonalizationAddonProducts() {
  const addonStep = this.buildAddonStepFromPersonalization();
  this.selectedBundle.steps = getEnabledFullPageSteps(this.selectedBundle.steps)
    .filter(step => !step.isFreeGift);
  if (addonStep) {
    this.selectedBundle.steps = [...this.selectedBundle.steps, addonStep];
  }
},

buildAddonStepFromPersonalization() {
  const personalizationData = this.selectedBundle?.personalizationData;
  const addonProducts = personalizationData?.addonProducts;
  if (personalizationData?.isPersonalizationEnabled !== true) {
    return null;
  }

  const addonProductsEnabled = addonProducts?.isEnabled === true;
  const tiers = addonProductsEnabled && Array.isArray(addonProducts.tiers) ? addonProducts.tiers : [];
  const selectedAddonProducts = tiers.flatMap(tier =>
    Array.isArray(tier?.selectedAddonProducts)
      ? tier.selectedAddonProducts.map(product => this.normalizePersonalizationAddonProduct(product))
      : []
  );

  return {
    id: 'personalization-addons',
    name: personalizationData.personalizeStepText || addonProducts?.title || '',
    position: (this.selectedBundle?.steps?.length || 0) + 1,
    minQuantity: 0,
    maxQuantity: selectedAddonProducts.length,
    enabled: true,
    isFreeGift: true,
    addonLabel: personalizationData.personalizeStepText || addonProducts?.title || '',
    freeGiftName: addonProducts?.title || personalizationData.personalizeStepText || '',
    addonTitle: personalizationData.personalizePageSubtext || addonProducts?.title || '',
    addonIconUrl: personalizationData.stepImage || null,
    addonDisplayFree: false,
    addonProductsEnabled,
    addonUnlockAfterCompletion: true,
    addonTiers: addonProductsEnabled ? tiers : undefined,
    addonEligibilityCondition: null,
    addonDiscount: null,
    addonMessaging: addonProductsEnabled ? (addonProducts.addonsMessaging || null) : null,
    displayVariantsAsIndividual: false,
    StepProduct: selectedAddonProducts,
    products: selectedAddonProducts,
    collections: [],
  };
},

normalizePersonalizationAddonProduct(product) {
  const productGid = product?.graphqlId || product?.id || (product?.productId ? `gid://shopify/Product/${product.productId}` : '');
  const imageUrl = product?.images?.[0]?.originalSrc
    || product?.images?.[0]?.url
    || product?.image?.src
    || product?.imageUrl
    || '';
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  return {
    productId: productGid,
    id: productGid,
    title: product?.title || '',
    handle: product?.handle || '',
    imageUrl,
    price: variants[0]?.price || product?.price || '0',
    compareAtPrice: variants[0]?.compareAtPrice || null,
    variants: variants.map(variant => {
      const variantGid = variant.variantGraphqlId || variant.id || (variant.variantId ? `gid://shopify/ProductVariant/${variant.variantId}` : productGid);
      return {
        id: variantGid,
        title: variant.variantTitle || variant.title || 'Default Title',
        price: variant.price || '0',
        compareAtPrice: variant.compareAtPrice || null,
        available: variant.available !== false,
        quantityAvailable: typeof variant.inventoryQuantity === 'number' ? variant.inventoryQuantity : null,
        currentlyNotInStock: false,
        image: imageUrl ? { src: imageUrl } : null,
      };
    }),
  };
},

initializeDataStructures() {
  const stepsCount = this.selectedBundle.steps.length;

  // Initialize selected products array (one object per step)
  this.selectedProducts = Array(stepsCount).fill(null).map(() => ({}));

  // Pre-populate default products (mandatory items like Gift Box)
  this._initDefaultProducts();
  this._initDirectDefaultProducts();

  // Initialize step product data cache
  this.stepProductData = Array(stepsCount).fill(null).map(() => ([]));
},

/**
 * Show a helpful preview in theme editor when testing on non-bundle products
 */
showThemeEditorPreview(bundleId) {

  this.container.innerHTML = `
    <div style="
      padding: 32px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 2px dashed #667eea;
      border-radius: 12px;
      text-align: center;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    ">
      <div style="
        font-size: 48px;
        margin-bottom: 16px;
      ">📦</div>
      <h3 style="
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
      ">Bundle Widget Preview</h3>
      <p style="
        margin: 0 0 8px 0;
        font-size: 14px;
        opacity: 0.9;
      ">
        Bundle ID: <code style="
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
        ">${bundleId}</code>
      </p>
      <div style="
        margin: 20px auto 0;
        padding: 16px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        max-width: 400px;
        text-align: left;
        font-size: 13px;
        line-height: 1.6;
      ">
        <div style="
          font-weight: 600;
          margin-bottom: 8px;
        ">✅ Widget Configured Successfully</div>
        <div style="
          opacity: 0.9;
        ">
          This widget will automatically display on <strong>bundle container products</strong>.
          <br><br>
          <strong>To see it in action:</strong>
          <ol style="
            margin: 8px 0;
            padding-left: 20px;
          ">
            <li>Save your theme</li>
            <li>Navigate to a bundle product page</li>
            <li>The widget will appear with product selection steps</li>
          </ol>
        </div>
      </div>
      <div style="
        margin-top: 20px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        font-size: 12px;
        opacity: 0.8;
      ">
        💡 <strong>Tip:</strong> You're currently previewing on a regular product. The widget only activates on products configured as bundle containers.
      </div>
    </div>
  `;
},

// ========================================================================
// DOM SETUP
// ========================================================================

setupDOMElements() {
  // Get or create main UI elements
  this.elements = {
    header: this.container.querySelector('.bundle-header') || this.createHeader(),
    stepsContainer: this.container.querySelector('.bundle-steps') || this.createStepsContainer(),
    footer: this.container.querySelector('.bundle-footer-messaging') || this.createFooter(),
    modal: this.ensureModal()
  };

  // Append elements if they were created
  if (!this.container.querySelector('.bundle-header')) {
    this.container.appendChild(this.elements.header);
  }
  if (!this.container.querySelector('.bundle-steps')) {
    this.container.appendChild(this.elements.stepsContainer);
  }
  if (!this.container.querySelector('.bundle-footer-messaging')) {
    this.container.appendChild(this.elements.footer);
  }
},

createHeader() {
  const header = document.createElement('div');
  header.className = 'bundle-header';

  if (this.selectedBundle?.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
    header.style.display = 'none';
    return header;
  }

  // Use custom title if provided, otherwise use bundle name
  const title = this.config.customTitle || this.selectedBundle.name;

  // Use custom description if provided, otherwise use bundle description
  const description = this.config.customDescription || this.selectedBundle.description;

  // Build header HTML (escape user-provided content)
  const titleHTML = `<h2 class="bundle-title">${ComponentGenerator.escapeHtml(title)}</h2>`;
  const descriptionHTML = (description && this.config.showDescription)
    ? `<p class="bundle-description">${ComponentGenerator.escapeHtml(description)}</p>`
    : '';

  header.innerHTML = `
    ${titleHTML}
    ${descriptionHTML}
  `;
  return header;
},

createStepsContainer() {
  const container = document.createElement('div');
  container.className = 'bundle-steps';
  return container;
},

createFooter() {
  const footer = document.createElement('div');
  footer.className = 'bundle-footer-messaging';
  footer.style.display = 'none';
  footer.innerHTML = `
    <div class="footer-discount-text"></div>
  `;
  return footer;
},

ensureModal() {
  let modal = document.getElementById('bundle-builder-modal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'bundle-builder-modal';
    modal.className = 'bundle-builder-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-step-title"></div>
          <div class="modal-tabs-wrapper">
            <button class="tab-arrow tab-arrow-left" aria-label="Scroll tabs left">&lsaquo;</button>
            <div class="modal-tabs"></div>
            <button class="tab-arrow tab-arrow-right" aria-label="Scroll tabs right">&rsaquo;</button>
          </div>
          <span class="close-button">&times;</span>
        </div>
        <div class="modal-body">
          <div class="product-grid"></div>
        </div>
        <div class="modal-footer">
          <!-- Centered Grouped Content Container -->
          <div class="modal-footer-grouped-content">
            <!-- Total Pill - Sits Above Buttons -->
            <div class="modal-footer-total-pill">
              <span class="total-price-strike"></span>
              <span class="total-price-final"></span>
              <span class="price-cart-separator">|</span>
              <span class="cart-badge-wrapper">
                <span class="cart-badge-count">0</span>
                <svg class="cart-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none"/>
                  <circle cx="20" cy="21" r="1" fill="currentColor" stroke="none"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </span>
            </div>

            <!-- Buttons Row - Below Pill -->
            <div class="modal-footer-buttons-row">
              <button class="modal-nav-button prev-button">BACK</button>
              <button class="modal-nav-button next-button">NEXT</button>
            </div>

            <!-- Discount Messaging Section -->
            <div class="modal-footer-discount-messaging">
              <div class="footer-discount-text"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup tab scroll arrows
    this.setupTabScrollArrows(modal);
  }

  return modal;
},

setupTabScrollArrows(modal) {
  const tabsContainer = modal.querySelector('.modal-tabs');
  const leftArrow = modal.querySelector('.tab-arrow-left');
  const rightArrow = modal.querySelector('.tab-arrow-right');

  if (!tabsContainer || !leftArrow || !rightArrow) return;

  const scrollAmount = 200;

  // Left arrow click
  leftArrow.addEventListener('click', () => {
    tabsContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  // Right arrow click
  rightArrow.addEventListener('click', () => {
    tabsContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  // Update arrow visibility based on scroll position
  const updateArrowVisibility = () => {
    const { scrollLeft, scrollWidth, clientWidth } = tabsContainer;

    leftArrow.style.display = scrollLeft > 0 ? 'flex' : 'none';
    rightArrow.style.display = scrollLeft + clientWidth < scrollWidth - 1 ? 'flex' : 'none';
  };

  // Listen to scroll events
  tabsContainer.addEventListener('scroll', updateArrowVisibility);

  // Initial check
  setTimeout(updateArrowVisibility, 100);

  // Store for later updates
  this.updateTabArrows = updateArrowVisibility;
},
//========================================================================
// UI RENDERING
// ========================================================================

async renderUI() {
  this.renderHeader();
  await this.renderSteps();
  this.renderFooter();
},

renderHeader() {
  // For full-page bundles, always hide the main header (promo banner handles the display)
  const bundleType = this.selectedBundle?.bundleType || BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE;
  if (bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
    this.elements.header.style.display = 'none';
    return;
  }

  if (!this.config.showTitle) {
    this.elements.header.style.display = 'none';
    return;
  }

  this.elements.header.style.display = 'block';
},

async renderSteps() {
  // Clear existing steps
  this.elements.stepsContainer.innerHTML = '';

  if (!this.selectedBundle || !this.selectedBundle.steps) {
    return;
  }

  // Check bundle type and render accordingly
  const bundleType = this.selectedBundle.bundleType || BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE;

  if (bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
    // Wire the preset + template data attributes so the preset-scoped CSS
    // rules in bundle-widget-full-page.css activate.
    FullPagePreset.markContainer(this.container, this.selectedBundle);
    await this.renderFullPageLayoutWithSidebar();
    return;
  }
},

// Product-page bundle layout (original vertical step boxes)
};
