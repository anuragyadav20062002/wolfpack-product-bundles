'use strict';

function _generateBundleInstanceId(bundleId) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return bundleId + '_' + crypto.randomUUID();
  }
  return bundleId + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
}

function _generateBundleSessionKey() {
  return Math.random().toString(36).slice(2, 5).toUpperCase();
}

function _resolveProductPageOfferId(state) {
  var rawOfferId = state.offerId || state.bundleOfferId || state.bundleId || 'UNKNOWN';
  var offerId = String(rawOfferId);
  return offerId.indexOf('MIX-') === 0 ? offerId : 'MIX-' + offerId;
}

function _formatCartAmount(cents, state) {
  if (typeof state.formatMoney === 'function') return state.formatMoney(cents);
  return String(cents);
}

function _buildCartLineSourceProperties(state, selectedLines) {
  var retailCents = selectedLines.reduce(function (sum, line) {
    if (line.step && line.step.isFreeGift) return sum;
    return sum + ((Number(line.product.price) || 0) * line.quantity);
  }, 0);
  var discountCents = Math.max(0, Number(state.discountAmount || 0));
  var discountPercentage = Number(state.discountPercentage || 0);
  if (!discountPercentage && retailCents > 0 && discountCents > 0) {
    discountPercentage = Math.round((discountCents / retailCents) * 100);
  }

  var displayProperties = {
    box: '1',
    items: selectedLines.map(function (line) {
      return line.quantity + ' x ' + (line.product.title || line.product.id);
    }).join(', '),
    retailPrice: _formatCartAmount(retailCents, state),
  };

  if (discountCents > 0) {
    var amount = _formatCartAmount(discountCents, state);
    var percentage = Math.round(discountPercentage) + '%';
    displayProperties.youSave = {
      amount: amount,
      percentage: percentage,
      amountPercentage: amount + ' (' + percentage + ')',
    };
  }

  return {
    '_bundle_display_properties': JSON.stringify(displayProperties),
  };
}

function buildCartItems(state) {
  var bundleInstanceId = _generateBundleInstanceId(state.bundleId);
  var offerId = _resolveProductPageOfferId(state);
  var sessionKey = _generateBundleSessionKey();
  var itemNumber = 0;
  var items = [];
  var unavailable = [];
  var selectedLines = [];

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

      itemNumber += 1;
      var properties = {
        'Box': String(itemNumber),
        '_bundleName': state.bundleName || '',
        '_wolfpackProductBundle:OfferId': offerId + '_' + sessionKey + '_' + itemNumber,
        '_wolfpackProductBundle:prodQty': String(qty),
      };
      if (step.isFreeGift) properties['_bundle_step_type'] = 'free_gift';
      if (step.isDefault) properties['_bundle_step_type'] = 'default';

      items.push({
        id: parseInt(variantId, 10),
        quantity: qty,
        properties: properties,
      });
      selectedLines.push({ product: product, quantity: qty, step: step });
    });
  });

  if (unavailable.length > 0) {
    throw new Error(
      'The following product' + (unavailable.length > 1 ? 's are' : ' is') +
      ' currently unavailable: ' + unavailable.join(', ') + '.'
    );
  }

  var sourceProperties = _buildCartLineSourceProperties(state, selectedLines);
  items.forEach(function (item) {
    Object.assign(item.properties, sourceProperties);
  });

  return {
    items: items,
    bundleInstanceId: bundleInstanceId,
    offerId: offerId,
    sessionKey: sessionKey,
    bundleDetailsKey: offerId + '_' + sessionKey,
    sourceProperties: sourceProperties,
  };
}

function buildProductPageCartFormData(items) {
  var formData = new FormData();
  items.forEach(function (item, index) {
    formData.append('items[' + index + '][id]', String(item.id));
    formData.append('items[' + index + '][quantity]', String(item.quantity));
    Object.keys(item.properties || {}).forEach(function (key) {
      var value = item.properties[key];
      if (value === null || typeof value === 'undefined') return;
      formData.append('items[' + index + '][properties][' + key + ']', String(value));
    });
  });
  return formData;
}

function buildBundleDetailsDisplayProperties(sourceProperties) {
  var displayProperties = {};
  var raw = sourceProperties && sourceProperties._bundle_display_properties;

  if (raw) {
    try {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.box) displayProperties.Box = String(parsed.box);
      if (parsed && parsed.items) displayProperties.Items = String(parsed.items);
      if (parsed && parsed.retailPrice) displayProperties['Retail Price'] = String(parsed.retailPrice);
      if (parsed && parsed.youSave && parsed.youSave.amountPercentage) {
        displayProperties['You Save'] = String(parsed.youSave.amountPercentage);
      }
    } catch (_) {}
  }

  ['Box', 'Items', 'Retail Price', 'You Save'].forEach(function (key) {
    if (sourceProperties && sourceProperties[key] && !displayProperties[key]) {
      displayProperties[key] = String(sourceProperties[key]);
    }
  });

  return displayProperties;
}

function getBundleDetailsCartToken() {
  return fetch('/cart.js', { credentials: 'same-origin' })
    .then(function (response) {
      if (!response.ok) return null;
      return response.json().catch(function () { return null; });
    })
    .then(function (cart) {
      return (cart && cart.token) || null;
    })
    .catch(function () { return null; });
}

function syncBundleDetailsCartMetafield(bundleDetailsKey, sourceProperties) {
  var displayProperties = buildBundleDetailsDisplayProperties(sourceProperties);
  if (!bundleDetailsKey || Object.keys(displayProperties).length === 0) return Promise.resolve();

  return getBundleDetailsCartToken()
    .then(function (cartToken) {
      if (!cartToken) return null;
      return fetch('/apps/product-bundles/api/cart-bundle-details', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartToken: cartToken,
          bundleDetailsKey: bundleDetailsKey,
          displayProperties: displayProperties,
        }),
      });
    })
    .then(function (response) {
      if (!response || !response.ok) return null;
      return response.json().catch(function () { return null; });
    })
    .then(function (data) {
      if (data && data.ok !== true) {
        console.warn('[Wolfpack Bundles] Failed to sync bundle_details cart metafield', data.error || data);
      }
    })
    .catch(function (error) {
      console.warn('[Wolfpack Bundles] Failed to sync bundle_details cart metafield', error);
    });
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

  return fetch('/cart/add', {
    method: 'POST',
    body: buildProductPageCartFormData(cartResult.items),
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
      return syncBundleDetailsCartMetafield(cartResult.bundleDetailsKey, cartResult.sourceProperties);
    })
    .then(function () {
      emitFn('wbp:cart-success', { bundleId: state.bundleId });
    })
    .catch(function (err) {
      emitFn('wbp:cart-failed', { error: err.message });
    });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildCartItems,
    buildProductPageCartFormData,
    buildBundleDetailsDisplayProperties,
    addBundleToCart,
  };
}
