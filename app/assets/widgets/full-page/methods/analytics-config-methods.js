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

const buildSharedCartLineDisplayProperties = buildCartLineDisplayProperties;
const buildSharedCartLineSourceProperties = buildCartLineSourceProperties;

export const fullPageAnalyticsConfigMethods = {
_ensureWpbSessionId() {
  if (this._wpbSessionId) return this._wpbSessionId;
  try {
    const bundleId = this.selectedBundle?.id || this.container?.dataset?.bundleId || 'unknown';
    const storageKey = `wpb_session_${bundleId}`;
    const existing = sessionStorage.getItem(storageKey);
    if (existing) { this._wpbSessionId = existing; return existing; }
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `wpb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(storageKey, id);
    this._wpbSessionId = id;
    return id;
  } catch (_e) {
    this._wpbSessionId = `wpb-${Date.now()}`;
    return this._wpbSessionId;
  }
},

_emitStorefrontEvent(name, detail = {}) {
  try {
    const fullDetail = Object.assign({
      bundleId: this.selectedBundle?.id || null,
      bundleType: this.container?.dataset?.bundleType || 'full_page',
      presetId: this.getFullPageDesignPreset?.() || null,
      sessionId: this._ensureWpbSessionId(),
      timestamp: new Date().toISOString(),
    }, detail);
    window.dispatchEvent(new CustomEvent(`wpb:${name}`, { detail: fullDetail, bubbles: true }));
  } catch (_e) {
    // Listener errors must never break the widget.
  }
},

_sendEngagementBeacon(eventName) {
  try {
    const bundleId = this.selectedBundle?.id || this.container?.dataset?.bundleId;
    if (!bundleId) return;
    const guardKey = `wpb_engaged_${bundleId}`;
    if (sessionStorage.getItem(guardKey) === '1') return;
    const sessionId = this._ensureWpbSessionId();
    const shopId = window.Shopify?.shop || this.container?.dataset?.shop || window.location.hostname;
    const payload = {
      shopId,
      bundleId,
      sessionId,
      presetId: this.getFullPageDesignPreset?.() || null,
      bundleType: this.container?.dataset?.bundleType || 'full_page',
      eventName: `wpb:${eventName}`,
      landingPage: window.location.pathname + window.location.search,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
    sessionStorage.setItem(guardKey, '1');
    fetch('/apps/product-bundles/api/attribution/engagement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => { /* fire-and-forget */ });
  } catch (_e) {
    // Beacon failures must never break the widget.
  }
},

/**
 * Hide the page body loading content
 * This hides the "Loading bundle builder..." text that was added to the Shopify page body
 */
hidePageLoadingContent() {
  try {
    // Find the parent page element that contains the loading text
    const pageContent = this.container.parentElement;

    if (pageContent) {
      // Hide all sibling divs that contain loading text
      const siblings = Array.from(pageContent.children);
      siblings.forEach(sibling => {
        // Check if this is not the widget container and contains "Loading" text
        if (sibling !== this.container &&
            (sibling.textContent.includes('Loading bundle builder') ||
             sibling.textContent.includes('Loading...'))) {
          sibling.style.display = 'none';
        }
      });
    }

  } catch (error) {
    // Don't throw - this is not critical
  }
},

/**
 * Load Settings design CSS
 * Injects custom CSS from Settings -> Design into the page
 */
loadDesignSettingsCSS() {
  try {
    // The Liquid template injects a <link> pointing to the design-settings app proxy URL.
    // On non-production environments the app proxy may not be configured and Shopify
    // returns an HTML error page instead of CSS, causing a MIME-type console error.
    // Register an error listener: if the proxy link fails, fall back to the direct
    // app server URL via window.__BUNDLE_APP_URL__.
    const existingLink = document.querySelector('link[href*="design-settings"]');
    if (!existingLink) return;

    const appUrl = window.__BUNDLE_APP_URL__;
    if (!appUrl) return;

    const shop = window.Shopify?.shop || this.container.dataset.shop;
    if (!shop) return;

    existingLink.addEventListener('error', () => {
      const directUrl = `${appUrl}/api/design-settings/${encodeURIComponent(shop)}?bundleType=full_page`;
      const fallback = document.createElement('link');
      fallback.rel = 'stylesheet';
      fallback.type = 'text/css';
      fallback.href = directUrl;
      document.head.appendChild(fallback);
      existingLink.remove();
    }, { once: true });

  } catch (_e) {
    // Non-critical — widget works without design settings CSS
  }
},

async loadLanguageSettings() {
  try {
    const shop = window.Shopify?.shop || this.container.dataset.shop;
    if (!shop) return;

    const locale = window.Shopify?.locale || 'en';
    const endpoint = `/apps/product-bundles/api/language-settings/${encodeURIComponent(shop)}?bundleType=full_page&locale=${encodeURIComponent(locale)}`;
    const response = await fetch(endpoint, { credentials: 'same-origin' });
    if (!response.ok) return;

    const languageSettings = await response.json();
    this.config.languageSettings = languageSettings;
    this.config.languageData = languageSettings.activeLanguageData || null;
    this.config.sharedCartLabels = languageSettings.sharedCartLabels || null;
    this.config.textOverrides = {
      ...(this.config.textOverrides || {}),
      ...(languageSettings.textOverrides || {})
    };
  } catch (_) {
    // Non-critical: default and bundle-level text still render.
  }
},

async loadControlsSettings() {
  try {
    const shop = window.Shopify?.shop || this.container.dataset.shop;
    if (!shop) return;

    const endpoint = `/apps/product-bundles/api/controls-settings/${encodeURIComponent(shop)}?bundleType=full_page`;
    const response = await fetch(endpoint, { credentials: 'same-origin' });
    if (!response.ok) return;

    this.config.controlsSettings = await response.json();
  } catch (_) {
    // Non-critical: the widget keeps its current default behavior.
  }
},

_getLandingPageControls() {
  return this.config.controlsSettings?.activeControls
    || this.config.controlsSettings?.settingsControls?.landingPage
    || null;
},

_runControlsScript(script) {
  if (!script || typeof script !== 'string') return;
  try {
    new Function(script).call(window);
  } catch (_) {
    // Merchant-authored integration script should not block bundle checkout.
  }
},

_getCheckoutIntegrationProvider(providerId) {
  const providers = {
    native: { id: 'native', callbackMode: 'native', requiresDiscountCode: false },
    theme_cart_drawer: { id: 'theme_cart_drawer', callbackMode: 'side_cart', requiresDiscountCode: false },
    gokwik: { id: 'gokwik', callbackMode: 'checkout', requiresDiscountCode: true },
    shopflo: { id: 'shopflo', callbackMode: 'checkout', requiresDiscountCode: true },
    zecpay: { id: 'zecpay', callbackMode: 'checkout', requiresDiscountCode: true },
    rebuy: { id: 'rebuy', callbackMode: 'cart_refresh', requiresDiscountCode: false },
    shiprocket_fastrr: { id: 'shiprocket_fastrr', callbackMode: 'checkout', requiresDiscountCode: true },
    monster_cart: { id: 'monster_cart', callbackMode: 'side_cart', requiresDiscountCode: false },
    upcart: { id: 'upcart', callbackMode: 'side_cart', requiresDiscountCode: false },
    kaching_cart: { id: 'kaching_cart', callbackMode: 'side_cart', requiresDiscountCode: false },
  };
  return providers[providerId] || providers.native;
},

_isCheckoutIntegrationProvider(providerId) {
  return this._getCheckoutIntegrationProvider(providerId).id !== 'native';
},

_getCheckoutIntegrationFallbackTarget(provider) {
  return provider.callbackMode === 'checkout' ? '/checkout' : '/cart';
},

async _openThemeCartDrawer() {
  let cart = null;
  try {
    const response = await fetch('/cart.js', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (response.ok) {
      cart = await response.json();
    }
  } catch (_) {
    // Cart drawer refresh is best-effort.
  }

  const detail = { cart };
  [
    'cart:refresh',
    'cart:updated',
    'cart:open',
    'theme:cart:open',
  ].forEach((eventName) => {
    try {
      document.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    } catch (_) {
      // Keep trying the remaining event contracts.
    }
  });

  const drawer = document.querySelector('cart-drawer, cart-notification');
  if (drawer && typeof drawer.open === 'function') {
    drawer.open();
    return true;
  }

  const trigger = document.querySelector(
    '[aria-controls="CartDrawer"], [data-cart-drawer-open], [data-cart-open], [href="/cart"]',
  );
  if (trigger && typeof trigger.click === 'function') {
    trigger.click();
    return true;
  }

  return cart !== null;
},

_setCheckoutIntegrationDiscountState(code) {
  if (!code) return;
  try {
    sessionStorage.setItem('wpbDiscountCode', code);
  } catch (_) {
    // Non-critical persistence.
  }
  try {
    document.cookie = `discount_code=${encodeURIComponent(code)}; path=/; Secure; SameSite=Lax`;
  } catch (_) {
    // Non-critical persistence.
  }
},

async _createCheckoutIntegrationDiscountCode(providerId) {
  const response = await fetch('/apps/product-bundles/api/checkout-integration-discount-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({ providerId }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok || !payload?.code) {
    throw new Error(payload?.error || 'Checkout integration discount code could not be created');
  }
  return payload;
},

async _applyCheckoutIntegrationDiscountCode(code) {
  if (!code) return false;
  const discountUrl = `/discount/${encodeURIComponent(code)}?redirect=/cart`;
  const response = await fetch(discountUrl, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'follow',
  });
  return response.ok;
},

async _invokeCheckoutIntegrationProvider(providerId) {
  if (providerId === 'theme_cart_drawer' || providerId === 'monster_cart') {
    return await this._openThemeCartDrawer();
  }

  if (providerId === 'gokwik') {
    const sdk = window.gokwikSdk;
    if (sdk && typeof sdk.initCheckout === 'function') {
      sdk.initCheckout(window.merchantInfo || window.gokwikMerchantInfo || undefined);
      return true;
    }
  }

  if (providerId === 'shopflo') {
    const shopflo = window.Shopflo;
    if (shopflo && typeof shopflo.openCheckout === 'function') {
      shopflo.openCheckout();
      return true;
    }
  }

  if (providerId === 'zecpay') {
    if (typeof window.zecpeCheckFunctionAndCall === 'function') {
      window.zecpeCheckFunctionAndCall('handleOcc');
      return true;
    }
  }

  if (providerId === 'rebuy') {
    const cart = window.Cart;
    if (cart && typeof cart.getCart === 'function') {
      cart.getCart();
      window.location.reload();
      return true;
    }
  }

  if (providerId === 'shiprocket_fastrr') {
    if (typeof window.shiprocketCheckoutBuyCartHandler === 'function') {
      window.shiprocketCheckoutBuyCartHandler();
      return true;
    }
  }

  if (providerId === 'upcart') {
    if (typeof window.upcartOpenCart === 'function') {
      window.upcartOpenCart();
      return true;
    }
  }

  if (providerId === 'kaching_cart') {
    const cart = window.kachingCartApi;
    if (!cart) return false;
    let invoked = false;
    if (typeof cart.openCart === 'function') {
      cart.openCart();
      invoked = true;
    }
    if (typeof cart.refreshCart === 'function') {
      cart.refreshCart();
      invoked = true;
    }
    return invoked;
  }

  return false;
},

async _handleCheckoutIntegrationProvider(checkout) {
  const provider = this._getCheckoutIntegrationProvider(checkout?.providerId || 'native');
  const providerId = provider.id;
  let payload = null;

  if (provider.requiresDiscountCode) {
    payload = await this._createCheckoutIntegrationDiscountCode(providerId);
    this._setCheckoutIntegrationDiscountState(payload.code);
    const applied = await this._applyCheckoutIntegrationDiscountCode(payload.code);

    if (!applied) {
      window.location.href = `/discount/${encodeURIComponent(payload.code)}?redirect=/checkout`;
      return;
    }

    this._emitStorefrontEvent('checkout-integration-discount-code-created', {
      providerId,
      expiresAt: payload.expiresAt || null,
    });
  }

  if (await this._invokeCheckoutIntegrationProvider(providerId)) {
    this._emitStorefrontEvent('checkout-integration-provider-invoked', { providerId });
    return;
  }

  this._emitStorefrontEvent('checkout-integration-provider-fallback', { providerId, reason: 'sdk-missing' });
  if (payload?.code) {
    window.location.href = `/discount/${encodeURIComponent(payload.code)}?redirect=/checkout`;
    return;
  }
  window.location.href = this._getCheckoutIntegrationFallbackTarget(provider);
},

async _handlePostAddToCartAction(actionConfig) {
  const checkout = actionConfig || this._getLandingPageControls()?.checkout || {};

  const target = checkout.action === 'checkout' ? '/checkout' : '/cart';
  const providerId = checkout.providerId || 'native';
  this._emitStorefrontEvent('checkout-clicked', { target, providerId });

  if (this._isCheckoutIntegrationProvider(providerId)) {
    try {
      await this._handleCheckoutIntegrationProvider(checkout);
      return;
    } catch (error) {
      this._emitStorefrontEvent('checkout-integration-provider-fallback', {
        providerId,
        reason: 'discount-code-error',
        message: String(error && error.message || error),
      });
      ToastManager.show('Checkout discount could not be prepared. Redirecting to checkout.');
    }
  }

  setTimeout(() => {
    window.location.href = target;
  }, 1000);
},

_scheduleCartTransformSelfHeal() {
  try {
    if (window.Shopify?.designMode) return;

    const shop = window.Shopify?.shop || this.container.dataset.shop || window.location.hostname;
    if (!shop) return;

    const storageKey = `wolfpack:cart-transform-heal:${shop}`;
    const lastCheckedAt = Number(window.localStorage?.getItem(storageKey) || 0);
    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000;

    if (lastCheckedAt && now - lastCheckedAt < cooldownMs) return;

    window.setTimeout(() => {
      fetch('/apps/product-bundles/api/cart-transform-heal', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      })
        .then(response => {
          if (response.ok) {
            window.localStorage?.setItem(storageKey, String(now));
          }
        })
        .catch(() => {});
    }, 1500);
  } catch (_error) {
    // Non-critical: checkout still works if the self-heal request is blocked.
  }
},

parseConfiguration() {
  const dataset = this.container.dataset;

  this.config = {
    bundleId: dataset.bundleId || null,
    isContainerProduct: dataset.isContainerProduct === 'true',
    containerBundleId: dataset.containerBundleId || null,
    hideDefaultButtons: dataset.hideDefaultButtons === 'true',
    showTitle: dataset.showTitle === 'true', // Default to false to avoid duplicate with main header
    showDescription: dataset.showDescription !== 'false',
    showStepNumbers: dataset.showStepNumbers !== 'false',
    showFooterMessaging: dataset.showFooterMessaging !== 'false',
    showStepTimeline: dataset.showStepTimeline !== 'false',
    showCategoryTabs: dataset.showCategoryTabs !== 'false',
    // Custom content from theme editor
    customTitle: dataset.customTitle || null,
    customDescription: dataset.customDescription || null,
    // Card layout settings from theme editor
    productCardSpacing: parseInt(dataset.productCardSpacing) || 20,
    productCardsPerRow: parseInt(dataset.productCardsPerRow) || 4,
    // Quantity selector visibility settings (default: show on both)
    showQuantitySelectorOnCard: dataset.showQuantitySelectorOnCard !== 'false',
    // Promo banner settings from theme editor
    showPromoBanner: dataset.showPromoBanner !== 'false',
    // Messages will be set from bundle.pricing.messages after bundle loads
    discountTextTemplate: 'Add {conditionText} to get {discountText}',
    successMessageTemplate: 'Congratulations! You got {discountText}!',
    showDiscountProgressBar: false,
    discountProgressBarType: 'step_based',
    discountProgressTextTemplate: null,
    discountProgressSuccessTemplate: null,
    currentProductId: window.currentProductId,
    currentProductGid: window.currentProductGid,
    currentProductHandle: window.currentProductHandle,
    currentProductCollections: window.currentProductCollections,
    tierConfig: this.parseTierConfig(dataset.tierConfig || '[]'),
  };

  this.tierConfig = this.config.tierConfig;

  // Parse bundle_settings metafield (Settings design display settings — promoBanner, badge, etc.)
  try {
    this.bundleSettings = JSON.parse(dataset.bundleSettings || 'null') || {};
  } catch {
    this.bundleSettings = {};
  }

  this._bundleConfigCacheMode = 'none';

  // Apply card layout settings as CSS variables
  this.applyCardLayoutSettings();
},

/**
 * Apply card layout settings from Theme Editor as CSS variables
 */
applyCardLayoutSettings() {
  document.documentElement.style.setProperty(
    '--bundle-product-card-spacing',
    `${this.config.productCardSpacing}px`
  );
  document.documentElement.style.setProperty(
    '--bundle-product-cards-per-row',
    this.config.productCardsPerRow
  );
},

_parseBundleConfigPayload(rawValue) {
  if (!rawValue || rawValue.trim() === '' || rawValue === 'null' || rawValue === 'undefined') {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch (_error) {
    return null;
  }
},

_isBundleConfigBootstrapPayload(payload) {
  return !!(
    payload &&
    typeof payload === 'object' &&
    payload.v &&
    payload.type === 'full_page' &&
    typeof payload.id === 'string' &&
    payload.id.trim() !== ''
  );
},

async loadBundleData() {
  let bundleData = null;

  // Check if this is a full-page bundle (needs to fetch from API)
  const bundleType = this.container.dataset.bundleType;
  const bundleId = this.container.dataset.bundleId;

  if (bundleType === 'full_page' && bundleId) {

    // Prefer metafield cache (data-bundle-config) over proxy API call.
    // The metafield is written by the app when "Place Widget Now" or "Sync Bundle"
    // is clicked — it eliminates the proxy round-trip for first paint.
    const cachedConfig = this.container.dataset.bundleConfig;
    const cachedPayload = this._parseBundleConfigPayload(cachedConfig);
    if (cachedPayload) {
      if (this._isBundleConfigBootstrapPayload(cachedPayload)) {
        this._bundleConfigCacheMode = 'bootstrap';
      } else if (typeof cachedPayload.id === 'string' && cachedPayload.id.trim() !== '') {
        this._bundleConfigCacheMode = 'full';
        bundleData = { [cachedPayload.id]: cachedPayload };
      }
    }

    // Fall back to proxy API if metafield cache was absent or unparseable.
    if (!bundleData) {
      this._bundleConfigCacheMode = 'proxy';

      // Retry once after a short delay for transient server errors (504/503).
      // This handles Render cold-start: the first request times out while the
      // server is warming up; the retry ~3 s later succeeds.
      const RETRY_DELAY_MS = 3000;
      const RETRYABLE_STATUSES = new Set([503, 504]);

      const fetchBundleData = async () => {
        // Use Shopify app proxy path - Shopify automatically adds signature and auth params
        // App proxy config: /apps/product-bundles -> https://wolfpack-product-bundle-app.onrender.com
        // CRITICAL: URL-encode bundle ID to handle special characters in cuid() format
        const apiUrl = `/apps/product-bundles/api/bundle/${encodeURIComponent(bundleId)}.json`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          // Try to get error details from response body
          let errorDetails = `${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorDetails = JSON.stringify(errorData);
          } catch (e) {
          }
          const err = new Error(`API request failed: ${errorDetails}`);
          err.status = response.status;
          throw err;
        }

        const data = await response.json();

        if (data.success && data.bundle) {
          return { [data.bundle.id]: data.bundle };
        } else {
          throw new Error('Invalid API response structure');
        }
      };

      try {
        try {
          bundleData = await fetchBundleData();
        } catch (firstErr) {
          // Retry once for 504/503 (server cold-start)
          if (RETRYABLE_STATUSES.has(firstErr.status)) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            bundleData = await fetchBundleData();
          } else {
            throw firstErr;
          }
        }
      } catch (error) {
        throw error;
      }
    }
  } else {
    // Product-page bundle: load from data-bundle-config attribute
    const configValue = this.container.dataset.bundleConfig;
    if (configValue && configValue.trim() !== '' && configValue !== 'null' && configValue !== 'undefined') {
      try {
        const singleBundle = JSON.parse(configValue);
        // Validate parsed result is a valid object with an id
        if (singleBundle && typeof singleBundle === 'object' && singleBundle.id) {
          bundleData = { [singleBundle.id]: singleBundle };
        } else {
        }
      } catch (error) {
      }
    } else {
    }

    // Widget only works on container products with bundleConfig metafield
    if (!bundleData || (typeof bundleData === 'object' && Object.keys(bundleData).length === 0)) {
      // Check if we're in theme editor mode
      const isThemeEditor = window.Shopify?.designMode ||
                           window.isThemeEditorContext ||
                           window.location.pathname.includes('/editor') ||
                           window.location.search.includes('preview_theme_id');

      const bundleIdFromDataset = this.container.dataset.bundleId;

      // Show helpful preview in theme editor instead of error
      if (isThemeEditor && bundleIdFromDataset) {
        this.showThemeEditorPreview(bundleIdFromDataset);
        return; // Don't throw error, just show preview
      }

      // For production/storefront: show proper error
      const errorMsg = 'This widget can only be used on bundle container products. Please ensure:\n1. This product is a bundle container product\n2. Bundle has been saved and published\n3. Product has bundleConfig metafield set';
      throw new Error(errorMsg);
    }
  }

  this.bundleData = bundleData;
},

selectBundle() {
  this.selectedBundle = BundleDataManager.selectBundle(this.bundleData, this.config);
  if (!this.selectedBundle && this.config?.bundleId && this.bundleData?.[this.config.bundleId]?.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
    this.selectedBundle = this.bundleData[this.config.bundleId];
  }
  if (this.selectedBundle) {
    this.config.showStepTimeline = this.resolveShowStepTimeline(
      this.selectedBundle.showStepTimeline ?? null,
      this.config.showStepTimeline
    );
  }

  // Update message templates from bundle pricing messages
  this.updateMessagesFromBundle();
},
};
