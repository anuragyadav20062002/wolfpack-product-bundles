'use strict';

(function (window) {

  function _findContainer() {
    return document.querySelector('[data-sdk-mode="true"]') || null;
  }

  function _bootstrap() {
    var state = createState();
    var container = _findContainer();

    if (!container) {
      if (isDebugMode()) {
        console.warn('[WolfpackBundles] No [data-sdk-mode="true"] container found. SDK exposed as no-op for debugging.');
        window.WolfpackBundles = _buildNoOp(state);
      }
      return;
    }

    var loadResult = loadBundleConfig(container, state);
    if (!loadResult.success) {
      if (isDebugMode()) {
        console.error('[WolfpackBundles] Config load failed:', loadResult.error);
      }
      return;
    }

    var sdk = _buildSdk(state);
    window.WolfpackBundles = sdk;

    initDebugMode(state, sdk);
    emit('wbp:ready', { bundleId: state.bundleId, steps: state.steps });
  }

  function _buildSdk(state) {
    return {
      get state() {
        return {
          isReady: state.isReady,
          bundleId: state.bundleId,
          bundleName: state.bundleName,
          steps: state.steps,
          selections: state.selections,
          discountConfiguration: state.discountConfiguration,
        };
      },

      addItem: function (stepId, variantId, qty) {
        var result = addItem(state, stepId, variantId, qty, ConditionValidator);
        if (result.success) {
          emit('wbp:item-added', { stepId: stepId, variantId: String(variantId), qty: qty, selections: state.selections });
          debugLog('addItem', stepId, variantId, qty, '→ selections:', state.selections);
        }
        return result;
      },

      removeItem: function (stepId, variantId, qty) {
        var result = removeItem(state, stepId, variantId, qty);
        if (result.success) {
          emit('wbp:item-removed', { stepId: stepId, variantId: String(variantId), qty: qty, selections: state.selections });
          debugLog('removeItem', stepId, variantId, qty, '→ selections:', state.selections);
        }
        return result;
      },

      clearStep: function (stepId) {
        var result = clearStep(state, stepId);
        if (result.success) {
          emit('wbp:step-cleared', { stepId: stepId });
          debugLog('clearStep', stepId);
        }
        return result;
      },

      addBundleToCart: function () {
        var self = this;
        return addBundleToCart(state, function () { return self.validateBundle(); }, emit);
      },

      validateStep: function (stepId) {
        return validateStep(stepId, state, ConditionValidator);
      },

      validateBundle: function () {
        return validateBundle(state, ConditionValidator);
      },

      getDisplayPrice: function () {
        return getDisplayPrice(state, PricingCalculator, CurrencyManager);
      },
    };
  }

  function _buildNoOp(state) {
    var noop = function () { return { success: false, error: 'SDK not initialized (no bundle found).' }; };
    return {
      get state() { return { isReady: false, bundleId: null, bundleName: null, steps: [], selections: {}, discountConfiguration: null }; },
      addItem: noop, removeItem: noop, clearStep: noop,
      addBundleToCart: function () { return Promise.resolve(); },
      validateStep: function () { return { valid: false, message: 'SDK not initialized.' }; },
      validateBundle: function () { return { valid: false, errors: {} }; },
      getDisplayPrice: function () { return { original: 0, discounted: 0, savings: 0, savingsPercent: 0, formatted: '' }; },
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bootstrap);
  } else {
    _bootstrap();
  }

})(window);
