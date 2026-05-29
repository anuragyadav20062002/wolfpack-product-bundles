'use strict';

function _stepIsCategoryRuleMode(step) {
  var categories = Array.isArray(step && step.categories) ? step.categories : [];
  for (var i = 0; i < categories.length; i++) {
    var c = categories[i];
    if (c && Array.isArray(c.conditions) && c.conditions.length > 0) return true;
  }
  return false;
}

function validateStep(stepId, state, ConditionValidator) {
  var step = state.steps.find(function (s) { return s.id === stepId; });
  if (!step) {
    return { valid: false, message: 'stepId "' + stepId + '" not found in bundle.' };
  }
  var selections = state.selections[stepId] || {};
  var valid = ConditionValidator.isStepConditionSatisfied(step, selections);
  if (valid) return { valid: true, message: '' };

  // Category-rule mode: surface a generic message. Per-category specifics
  // are a follow-up; today the widget only needs to know the step is
  // unmet so the ATC can be blocked.
  if (_stepIsCategoryRuleMode(step)) {
    return { valid: false, message: 'Selection requirements not met for this step.' };
  }

  var condVal = step.conditionValue;
  var op = step.conditionOperator || 'equal_to';
  var opLabels = {
    'equal_to': 'exactly ' + condVal,
    'greater_than': 'more than ' + condVal,
    'less_than': 'less than ' + condVal,
    'greater_than_or_equal_to': 'at least ' + condVal,
    'less_than_or_equal_to': 'at most ' + condVal,
  };
  var label = opLabels[op] || String(condVal);
  return { valid: false, message: 'This step requires ' + label + ' item' + (condVal !== 1 ? 's' : '') + '.' };
}

function validateBundle(state, ConditionValidator) {
  var errors = {};
  state.steps.forEach(function (step) {
    if (step.isFreeGift || step.isDefault) return;
    var result = validateStep(step.id, state, ConditionValidator);
    if (!result.valid) {
      errors[step.id] = result.message;
    }
  });
  return { valid: Object.keys(errors).length === 0, errors: errors };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateStep, validateBundle };
}
