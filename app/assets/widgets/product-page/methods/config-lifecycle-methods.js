import { TemplateManager } from '../../../bundle-widget-components.js';

export const ProductPageConfigLifecycleMethods = {
_getProductPageControls() {
  return this.config.controlsSettings?.activeControls
    || this.config.controlsSettings?.settingsControls?.productPage
    || null;
},

_isProductCardClickAddEnabled() {
  const controls = this._getProductPageControls();
  return controls?.addToCartWhenProductCardClicked === true;
},

_runControlsScript(script) {
  if (!script || typeof script !== 'string') return;
  try {
    new Function(script).call(window);
  } catch (_) {
    // Merchant-authored integration script should not block bundle checkout.
  }
},

_handlePostAddToCartAction(actionConfig) {
  const controls = this._getProductPageControls();
  const redirect = actionConfig || controls?.redirect || {};
  this._runControlsScript(redirect.executeScript);
  this._runControlsScript(controls?.scripts?.executeCustomScript);

  const action = redirect.action || 'cart';
  if (action === 'checkout') {
    setTimeout(() => {
      window.location.href = '/checkout';
    }, 1000);
    return;
  }

  if (action === 'side_cart') {
    const selector = redirect.selectors?.sideCartOpenButton
      || controls?.selectors?.sideCartOpenButton
      || controls?.selectors?.sideCart;
    if (selector) {
      const sideCartTrigger = document.querySelector(selector);
      if (sideCartTrigger) {
        setTimeout(() => sideCartTrigger.click(), 300);
        return;
      }
    }
  }

  setTimeout(() => {
    window.location.href = '/cart';
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
      showStepNumbers: dataset.showStepNumbers !== 'false',
      // Quantity selector visibility settings (default: show on card)
      showQuantitySelectorOnCard: dataset.showQuantitySelectorOnCard !== 'false',
      // Messages will be set from bundle.pricing.messages after bundle loads
      discountTextTemplate: 'Add {conditionText} to get {discountText}',
      successMessageTemplate: 'Congratulations! You got {discountText}!',
      currentProductId: window.currentProductId,
      currentProductGid: window.currentProductGid,
      currentProductHandle: window.currentProductHandle,
      currentProductCollections: window.currentProductCollections
    };
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
      payload.type === 'product_page' &&
      typeof payload.id === 'string' &&
      payload.id.trim() !== ''
    );
  },

  async loadBundleData() {
    let bundleData = null;
    const bundleType = this.container.dataset.bundleType;
    const bundleId = this.container.dataset.bundleId;
    const configValue = this._parseBundleConfigPayload(this.container.dataset.bundleConfig);

    if (bundleType === 'product_page' && this._isBundleConfigBootstrapPayload(configValue)) {
      const RETRY_DELAY_MS = 3000;
      const RETRYABLE_STATUSES = new Set([503, 504]);

      const fetchBundleData = async () => {
        const apiUrl = `/apps/product-bundles/api/bundle/${encodeURIComponent(configValue.id)}.json`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          let errorDetails = `${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorDetails = JSON.stringify(errorData);
          } catch (_) {
            // Ignore parse failures for error body.
          }
          const err = new Error(`API request failed: ${errorDetails}`);
          err.status = response.status;
          throw err;
        }

        const data = await response.json();
        if (data.success && data.bundle) {
          return { [data.bundle.id]: data.bundle };
        }

        throw new Error('Invalid API response structure');
      };

      try {
        try {
          bundleData = await fetchBundleData();
        } catch (firstErr) {
          if (RETRYABLE_STATUSES.has(firstErr.status)) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            bundleData = await fetchBundleData();
          } else {
            throw firstErr;
          }
        }
      } catch (_error) {
      }
    }

    // Widget only works on container products with bundleConfig marker.
    if (!bundleData || (typeof bundleData === 'object' && Object.keys(bundleData).length === 0)) {
      const isThemeEditor = window.Shopify?.designMode ||
                           window.isThemeEditorContext ||
                           window.location.pathname.includes('/editor') ||
                           window.location.search.includes('preview_theme_id');

      const bundleIdFromDataset = bundleId || this.container.dataset.bundleId;

      if (isThemeEditor && bundleIdFromDataset) {
        this.showThemeEditorPreview(bundleIdFromDataset);
        return; // Don't throw error, just show preview.
      }

      this.container.style.display = 'none';
      return;
    }

    this.bundleData = bundleData;
  },

selectBundle() {
  this.selectedBundle = ppbExpandSingleStepCategoriesAsSteps(
    BundleDataManager.selectBundle(this.bundleData, this.config)
  );

  this.widgetStyle = 'bottom-sheet';

  // Update message templates from bundle pricing messages
  this.updateMessagesFromBundle();
},

_getProductPageTemplateType() {
  const templateType = this.selectedBundle?.bundleDesignTemplate;
  return templateType === 'PDP_INPAGE' || templateType === 'PDP_MODAL'
    ? templateType
    : 'PDP_MODAL';
},

_getProductPageDesignPreset() {
  const templateType = this._getProductPageTemplateType();
  const rawPresetId = this.selectedBundle?.bundleDesignTemplateData?.templateId
    || this.selectedBundle?.bundleDesignPresetId
    || this.selectedBundle?.templateId;
  const preset = typeof rawPresetId === "string" ? rawPresetId.trim().toUpperCase() : '';

  if (preset) {
    return preset;
  }

  return templateType === 'PDP_MODAL' ? 'MODAL' : 'CASCADE';
},

_isProductPageInpageTemplate() {
  return this._getProductPageTemplateType() === 'PDP_INPAGE';
},

_shouldShowProductComparedAtPrice() {
  return this.selectedBundle?.showProductComparedAtPrice === true;
},

ensureProductPageTemplateStylesheet(templateType, designPreset) {
  const templateKey = String(templateType || 'PDP_MODAL').trim().toUpperCase() || 'PDP_MODAL';
  const presetKey = String(designPreset || '').trim().toUpperCase();
  const urls = window.__WOLFPACK_PPB_TEMPLATE_CSS_URLS__ || {};
  const href = templateKey === 'PDP_MODAL'
    ? urls[presetKey] || urls.MODAL || urls.SIMPLIFIED
    : urls[presetKey] || urls.CASCADE || urls.COGNIVE;

  if (!href || typeof document === 'undefined') return Promise.resolve();

  if (!this._ppbTemplateStylesheetPromises) {
    this._ppbTemplateStylesheetPromises = new Map();
  }

  const assetKey = templateKey === 'PDP_MODAL' ? 'MODAL' : presetKey;
  const pendingPromise = this._ppbTemplateStylesheetPromises.get(href);
  if (pendingPromise) {
    return pendingPromise;
  }

  const existingLink = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find((link) =>
    link.getAttribute('href') === href
    || link.href === href
    || link.dataset.wpbPpbTemplateCss === assetKey
  );

  const markLoaded = (link) => {
    if (link instanceof HTMLLinkElement) {
      link.dataset.wpbPpbTemplateCssLoaded = '1';
    }
  };

  const isStylesheetLoaded = (link) => {
    if (!link) return false;
    if (link.dataset?.wpbPpbTemplateCssLoaded === '1') return true;

    try {
      return !!link.sheet;
    } catch (_error) {
      return false;
    }
  };

  if (existingLink) {
    if (isStylesheetLoaded(existingLink)) {
      markLoaded(existingLink);
      return Promise.resolve();
    }

    const promise = new Promise((resolve) => {
      const done = () => {
        markLoaded(existingLink);
        this._ppbTemplateStylesheetPromises.delete(href);
        resolve();
      };

      existingLink.addEventListener('load', done, { once: true });
      existingLink.addEventListener('error', done, { once: true });
    });

    this._ppbTemplateStylesheetPromises.set(href, promise);
    return promise;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.wpbPpbTemplateCss = assetKey;

  const promise = new Promise((resolve) => {
    const done = () => {
      markLoaded(link);
      this._ppbTemplateStylesheetPromises.delete(href);
      resolve();
    };

    link.addEventListener('load', done, { once: true });
    link.addEventListener('error', done, { once: true });
  });

  this._ppbTemplateStylesheetPromises.set(href, promise);
  document.head.appendChild(link);

  return promise;
},

_markProductPageTemplate() {
  if (!this.container || !this.elements?.stepsContainer || !this.selectedBundle) return;

  const templateType = this._getProductPageTemplateType();
  const designPreset = this._getProductPageDesignPreset();

  this.container.classList.toggle(
    'wpbMixPageWrapper',
    templateType === 'PDP_INPAGE' && designPreset === 'CASCADE'
  );
  this.container.classList.toggle(
    'wpbMixProductPageWrapperV2',
    templateType === 'PDP_INPAGE' && designPreset === 'CASCADE'
  );

  this.container.dataset.ppbTemplateType = templateType;
  this.container.dataset.ppbDesignPreset = designPreset;
  this.container.setAttribute('template-id', designPreset);
  this.container.setAttribute('template-type', templateType);
  this.elements.stepsContainer.dataset.ppbTemplateType = templateType;
  this.elements.stepsContainer.dataset.ppbDesignPreset = designPreset;

  document.body?.setAttribute('wpbmix-template-id', designPreset);
  document.body?.setAttribute('wpbmix-template-type', templateType);
  document.body?.setAttribute('wpb-mix-consolidated-design', 'true');
  void this.ensureProductPageTemplateStylesheet(templateType, designPreset);

  if (templateType === 'PDP_MODAL') {
    const slotOrientation = this._usesVerticalModalSlotLayout() ? 'vertical' : 'horizontal';
    this.container.dataset.ppbSlotOrientation = slotOrientation;
    this.elements.stepsContainer.dataset.ppbSlotOrientation = slotOrientation;
  } else {
    delete this.container.dataset.ppbSlotOrientation;
    delete this.elements.stepsContainer.dataset.ppbSlotOrientation;
  }
},

// ========================================================================
// STEP TYPE GETTERS
// ========================================================================

/** Steps that are neither free gift nor default — require user selection */
get paidSteps() {
  return this.selectedBundle?.steps?.filter(s => !s.isFreeGift && !s.isDefault) ?? [];
},

/** The free gift step, if any */
get freeGiftStep() {
  return this.selectedBundle?.steps?.find(s => s.isFreeGift) ?? null;
},

/** Index of the free gift step, or -1 */
get freeGiftStepIndex() {
  return this.selectedBundle?.steps?.findIndex(s => s.isFreeGift) ?? -1;
},

/** Steps that are pre-filled with a compulsory product */
get defaultStepsList() {
  return this.selectedBundle?.steps?.filter(s => s.isDefault) ?? [];
},

/**
 * True when all paid (non-free-gift, non-default) steps are fully satisfied.
 * Used to unlock the free gift slot.
 */
get isFreeGiftUnlocked() {
  if (!this.selectedBundle) return false;
  return this.selectedBundle.steps.every((step, i) => {
    if (step.isFreeGift || step.isDefault) return true; // skip these
    return this.validateStep(i);
  });
},

updateMessagesFromBundle() {
  const messaging = this.selectedBundle?.messaging;

  if (messaging) {
    if (messaging.progressTemplate) {
      this.config.discountTextTemplate = messaging.progressTemplate;
    }
    if (messaging.successTemplate) {
      this.config.successMessageTemplate = messaging.successTemplate;
    }

    this.config.showDiscountMessaging = messaging.showDiscountMessaging !== false;

  } else {
    this.config.showDiscountMessaging = this.selectedBundle?.pricing?.enabled || false;
  }
}
};
