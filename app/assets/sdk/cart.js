'use strict';

function _generateBundleInstanceId(bundleId) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return bundleId + '_' + crypto.randomUUID();
  }
  return bundleId + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
}

function buildCartItems(state) {
  var bundleInstanceId = _generateBundleInstanceId(state.bundleId);
  var items = [];
  var unavailable = [];

  state.steps.forEach(function (step, stepIndex) {
    var stepSelections = state.selections[step.id] || {};
    var productsInStep = (state.stepProductData && state.stepProductData[stepIndex]) || [];

    Object.keys(stepSelections).forEach(function (variantId) {
      var qty = stepSelections[variantId];
      if (!qty || qty <= 0) return;

      var product = productsInStep.find(function (p) {
        return String(p.variantId || p.id) === String(variantId);
      });
      if (!product) return;

      if (product.available === false) {
        unavailable.push(product.title || variantId);
        return;
      }

      var properties = {
        '_bundle_id': bundleInstanceId,
        '_bundle_name': state.bundleName || '',
        '_step_index': String(stepIndex),
      };
      if (step.isFreeGift) properties['_bundle_step_type'] = 'free_gift';
      if (step.isDefault) properties['_bundle_step_type'] = 'default';

      items.push({
        id: parseInt(variantId, 10),
        quantity: qty,
        properties: properties,
      });
    });
  });

  if (unavailable.length > 0) {
    throw new Error(
      'The following product' + (unavailable.length > 1 ? 's are' : ' is') +
      ' currently unavailable: ' + unavailable.join(', ') + '.'
    );
  }

  return { items: items, bundleInstanceId: bundleInstanceId };
}

function addBundleToCart(state, validateBundleFn, emitFn) {
  var validation = validateBundleFn();
  if (!validation.valid) {
    emitFn('wbp:cart-failed', { error: 'Bundle validation failed. Complete all required steps.' });
    return Promise.resolve();
  }

  var cartResult;
  try {
    cartResult = buildCartItems(state);
  } catch (e) {
    emitFn('wbp:cart-failed', { error: e.message });
    return Promise.resolve();
  }

  return fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cartResult.items }),
  })
    .then(function (response) {
      return response.text().then(function (text) {
        if (!response.ok) {
          var msg = 'Cart add failed (' + response.status + ')';
          try { msg = JSON.parse(text).message || msg; } catch (_) {}
          throw new Error(msg);
        }
        return text;
      });
    })
    .then(function () {
      emitFn('wbp:cart-success', { bundleId: state.bundleId });
    })
    .catch(function (err) {
      emitFn('wbp:cart-failed', { error: err.message });
    });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildCartItems, addBundleToCart };
}
