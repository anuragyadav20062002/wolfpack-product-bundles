'use strict';

function loadBundleConfig(container, state) {
  var configValue = container && container.dataset && container.dataset.bundleConfig;

  if (!configValue || configValue.trim() === '' || configValue === 'null' || configValue === 'undefined') {
    return { success: false, error: 'No bundle config found on container. Ensure data-bundle-config attribute is set.' };
  }

  var bundleData;
  try {
    bundleData = JSON.parse(configValue);
  } catch (e) {
    return { success: false, error: 'data-bundle-config is not valid JSON: ' + e.message };
  }

  if (!bundleData || typeof bundleData !== 'object' || !bundleData.id) {
    return { success: false, error: 'data-bundle-config is missing required "id" field.' };
  }

  state.bundleId = bundleData.id;
  state.bundleName = bundleData.name || null;
  state.bundleData = bundleData;
  state.steps = Array.isArray(bundleData.steps) ? bundleData.steps : [];
  state.discountConfiguration = bundleData.pricing || null;

  // Initialise selections map for every step
  state.steps.forEach(function (step) {
    if (step.id && !state.selections[step.id]) {
      state.selections[step.id] = {};
    }
  });

  // stepProductData is populated lazily from bundle step products
  // (same shape as widget's stepProductData: array of arrays, indexed by step position)
  state.stepProductData = state.steps.map(function (step) {
    return Array.isArray(step.products) ? step.products : [];
  });

  state.isReady = true;
  return { success: true };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadBundleConfig };
}
