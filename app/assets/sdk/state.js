'use strict';

function createState() {
  return {
    isReady: false,
    bundleId: null,
    bundleName: null,
    bundleData: null,
    steps: [],
    stepProductData: [],
    selections: {},
    discountConfiguration: null,
  };
}

function _findStep(state, stepId) {
  return state.steps.find(function (s) { return s.id === stepId; }) || null;
}

function addItem(state, stepId, variantId, qty, ConditionValidator) {
  if (!state.isReady) {
    return { success: false, error: 'WolfpackBundles SDK not ready yet.' };
  }
  const step = _findStep(state, stepId);
  if (!step) {
    return { success: false, error: 'stepId "' + stepId + '" not found in bundle.' };
  }

  const vid = String(variantId);
  const currentSelections = state.selections[stepId] || {};
  const check = ConditionValidator.canUpdateQuantity(step, currentSelections, vid, (currentSelections[vid] || 0) + qty);
  if (!check.allowed) {
    return { success: false, error: 'This step allows ' + check.limitText + ' product' + (step.conditionValue !== 1 ? 's' : '') + '.' };
  }

  if (!state.selections[stepId]) state.selections[stepId] = {};
  state.selections[stepId][vid] = (state.selections[stepId][vid] || 0) + qty;
  return { success: true };
}

function removeItem(state, stepId, variantId, qty) {
  if (!state.isReady) {
    return { success: false, error: 'WolfpackBundles SDK not ready yet.' };
  }
  const step = _findStep(state, stepId);
  if (!step) {
    return { success: false, error: 'stepId "' + stepId + '" not found in bundle.' };
  }

  const vid = String(variantId);
  if (!state.selections[stepId]) state.selections[stepId] = {};
  const current = state.selections[stepId][vid] || 0;
  const next = Math.max(0, current - qty);
  if (next === 0) {
    delete state.selections[stepId][vid];
  } else {
    state.selections[stepId][vid] = next;
  }
  return { success: true };
}

function clearStep(state, stepId) {
  if (!state.isReady) {
    return { success: false, error: 'WolfpackBundles SDK not ready yet.' };
  }
  const step = _findStep(state, stepId);
  if (!step) {
    return { success: false, error: 'stepId "' + stepId + '" not found in bundle.' };
  }
  state.selections[stepId] = {};
  return { success: true };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createState, addItem, removeItem, clearStep };
}
