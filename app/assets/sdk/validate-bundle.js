'use strict';

function validateStep(stepId, state, ConditionValidator) {
  var step = state.steps.find(function (s) { return s.id === stepId; });
  if (!step) {
    return { valid: false, message: 'stepId "' + stepId + '" not found in bundle.' };
  }
  var selections = state.selections[stepId] || {};
  var valid = ConditionValidator.isStepConditionSatisfied(step, selections);
  if (valid) return { valid: true, message: '' };

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
