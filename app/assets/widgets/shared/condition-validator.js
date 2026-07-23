/**
 * Step Condition Validator
 *
 * Pure functions for evaluating step conditions in bundle widgets.
 * Used by both the product-page and full-page bundle widgets.
 *
 * Exported as a single `ConditionValidator` object so that:
 *  - The bundle build (IIFE) can access it as a local variable in scope
 *  - Node.js test environments can require() it via module.exports
 *
 * @version 1.0.0
 */

'use strict';

// NOTE: This file intentionally uses an IIFE + module.exports pattern (not ES module export)
// so that Jest/Node.js tests can require() it without a transform step. All other files in
// this directory use ES module syntax. Do not convert without updating the test config.
const ConditionValidator = (function () {
  // ─── Operator constants ───────────────────────────────────────────────────
  const OPERATORS = {
    EQUAL_TO:                'equal_to',
    GREATER_THAN_OR_EQUAL_TO: 'greater_than_or_equal_to',
    LESS_THAN_OR_EQUAL_TO:   'less_than_or_equal_to',
  };

  /**
   * Calculate the step total in a single condition metric AFTER a proposed update.
   *
   * Correctly handles both:
   *  - Existing products: replaces their current count with newQuantity
   *  - New products (not yet in currentSelections): adds newQuantity to existing total
   *
   * Supports quantity, amount, and weight semantics. For amount/weight conditions
   * the `options` parameter accepts per-unit unit values for the target product.
   *
   * @param {Record<string, any>} currentSelections  Current { productId → value } map
   * @param {string}  targetProductId  The product whose quantity is being changed
   * @param {number}  newQuantity      The proposed new quantity (0 = remove)
   * @param {object}  options
   * @param {string}  options.conditionType  'quantity' (default), 'amount', or 'weight'
   * @param {number}  options.targetAmountPerUnit  Per-unit amount for the target product
   * @param {number}  options.targetWeightPerUnit  Per-unit weight for the target product
   * @returns {number}  Total across all products in the step after the update
   */
  function calculateStepTotalAfterUpdate(currentSelections, targetProductId, newQuantity, options = {}) {
    const selections = currentSelections || {};
    const conditionType = _normalizeConditionType(options.conditionType);
    const targetAmountPerUnit = Number(options.targetAmountPerUnit);
    const targetWeightPerUnit = Number(options.targetWeightPerUnit);
    const normalizedQuantity = Number(newQuantity) || 0;

    let total = 0;

    // Add every OTHER product's existing quantity unchanged.
    for (const pid of Object.keys(selections)) {
      if (pid !== targetProductId) {
        total += _getSelectionValueByConditionType(selections[pid], conditionType);
      }
    }

    if (conditionType === 'amount') {
      const perUnitAmount = Number.isFinite(targetAmountPerUnit) ? targetAmountPerUnit : 0;
      total += perUnitAmount * normalizedQuantity;
    } else if (conditionType === 'weight') {
      const perUnitWeight = Number.isFinite(targetWeightPerUnit) ? targetWeightPerUnit : 0;
      total += perUnitWeight * normalizedQuantity;
    } else {
      total += normalizedQuantity;
    }

    return total;
  }

  /**
   * Determine whether a proposed quantity update is permitted by the step's condition.
   *
   * Only blocks INCREASES that would violate an upper-bound operator.
   * Decreases are always permitted regardless of the condition state (so the
   * customer can switch products without getting permanently stuck).
   *
   * @param {object}  step              Step config object (conditionType, conditionOperator, conditionValue)
   * @param {Record<string, number>} currentSelections  Current selections for this step
   * @param {string}  targetProductId   Product being updated
   * @param {number}  newQuantity       Proposed quantity (0 = remove)
   * @returns {{ allowed: boolean, limitText: string|null }}
   */
  function canUpdateQuantity(step, currentSelections, targetProductId, newQuantity, targetValues) {
    // No explicit condition configured → no upper bound; always allow increases
    if (!step || !step.conditionType || !step.conditionOperator || !_isPositiveConditionValue(step.conditionValue)) {
      return { allowed: true, limitText: null };
    }

    const conditionType = _normalizeConditionType(step.conditionType);
    const targetMetric = _getTargetMetric(targetValues);
    const required = _normalizeConditionRuleValue(conditionType, step.conditionValue);

    const totalAfter = calculateStepTotalAfterUpdate(
      currentSelections,
      targetProductId,
      newQuantity,
      {
        conditionType,
        targetAmountPerUnit: targetMetric.amount,
        targetWeightPerUnit: targetMetric.weight,
      },
    );

    // Primary condition
    const primary = _evaluateCanUpdate(step.conditionOperator, required, totalAfter);
    if (!primary.allowed) return primary;

    // Secondary condition — AND logic (only when both fields are non-null)
    if (step.conditionOperator2 != null && _isPositiveConditionValue(step.conditionValue2)) {
      const secondary = _evaluateCanUpdate(
        step.conditionOperator2,
        _normalizeConditionRuleValue(conditionType, step.conditionValue2),
        totalAfter,
      );
      if (!secondary.allowed) return secondary;
    }

    return { allowed: true, limitText: null };
  }

  /**
   * Normalize an operator name. The validator accepts both Wolfpack-style
   * snake_case (`greater_than_or_equal_to`) and camelCase
   * (`greaterThanOrEqualTo`) so the same evaluator works against step rules
   * (snake_case) and category rules (camelCase, persisted from the admin
   * UI's CATEGORY_CONDITION_OPERATOR_OPTIONS).
   */
  function _normalizeOperator(operator) {
    if (typeof operator !== 'string' || operator.length === 0) return operator;
    if (operator.indexOf('_') !== -1) return operator;
    return operator.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  function _sumQuantities(selections) {
    let total = 0;
    if (!selections) return total;
    for (const qty of Object.values(selections)) {
      total += _getSelectionQuantity(qty);
    }
    return total;
  }

  function _normalizeConditionType(conditionType) {
    if (conditionType === 'amount') return 'amount';
    if (conditionType === 'weight') return 'weight';
    return 'quantity';
  }

  function _normalizeConditionRuleValue(conditionType, value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return numeric;
    return _normalizeConditionType(conditionType) === 'amount' ? numeric * 100 : numeric;
  }

  function _getSelectionValueByConditionType(selection, conditionType) {
    if (conditionType === 'amount') return _getSelectionAmount(selection);
    if (conditionType === 'weight') return _getSelectionWeight(selection);
    return _getSelectionQuantity(selection);
  }

  function _getTargetMetric(values) {
    const amount = Number(values && values.amount);
    const weight = Number(values && values.weight);
    return {
      amount: Number.isFinite(amount) ? amount : 0,
      weight: Number.isFinite(weight) ? weight : 0,
    };
  }

  function _isPositiveConditionValue(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0;
  }

  function _collectCategoryProductIds(category) {
    const ids = new Set();
    const products = Array.isArray(category && category.products) ? category.products : [];
    for (const product of products) {
      const raw = product && (product.id || product.productId || product.graphqlId);
      if (raw == null || raw === '') continue;
      // Strip GID prefix (e.g. "gid://shopify/Product/123" → "123") so that the
      // Set matches numeric IDs used as widget selection keys.
      const id = String(raw).replace(new RegExp('^gid://shopify/[^/]+/'), '');
      if (id) ids.add(id);
    }
    return ids;
  }

  function _getSelectionQuantity(selection) {
    if (selection && typeof selection === 'object') {
      return Number(selection.quantity) || 0;
    }
    return Number(selection) || 0;
  }

  function _getSelectionAmount(selection) {
    if (selection && typeof selection === 'object') {
      return Number(selection.amount) || 0;
    }
    return Number(selection) || 0;
  }

  function _getSelectionWeight(selection) {
    if (selection && typeof selection === 'object') {
      return Number(selection.weight) || 0;
    }
    return Number(selection) || 0;
  }

  function _normalizeAmountRuleValue(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return numeric;
    return numeric * 100;
  }

  /**
   * Evaluate whether a single category's rules are satisfied by the current
   * step selections. Categories with no `conditions` are always satisfied.
   *
   * Used by `isStepConditionSatisfied` in category-rule mode.
   */
  function evaluateCategoryRules(category, stepSelections) {
    const rules = Array.isArray(category && category.conditions)
      ? category.conditions.filter(rule => _isPositiveConditionValue(rule && rule.value))
      : [];
    if (rules.length === 0) return true;

    const productIds = _collectCategoryProductIds(category);
    const selections = stepSelections || {};
    for (const rule of rules) {
      const operator = _normalizeOperator(rule && (rule.operator || rule.condition));
      const ruleType = rule && (rule.conditionType || rule.type);
      const isAmountRule = ruleType === 'amount';
      const isWeightRule = ruleType === 'weight';
      const value = isAmountRule ? _normalizeAmountRuleValue(rule && rule.value) : Number(rule && rule.value);
      if (!Number.isFinite(value)) continue;
      let categoryTotal = 0;
      for (const pid of Object.keys(selections)) {
        if (productIds.has(String(pid))) {
          if (isAmountRule) {
            categoryTotal += _getSelectionAmount(selections[pid]);
          } else if (isWeightRule) {
            categoryTotal += _getSelectionWeight(selections[pid]);
          } else {
            categoryTotal += _getSelectionQuantity(selections[pid]);
          }
        }
      }
      if (!_evaluateSatisfied(operator, value, categoryTotal)) return false;
    }
    return true;
  }

  function _isCategoryRuleMode(step) {
    const categories = Array.isArray(step && step.categories) ? step.categories : [];
    return categories.some(c =>
      Array.isArray(c && c.conditions)
      && c.conditions.some(rule => _isPositiveConditionValue(rule && rule.value))
    );
  }

  /**
   * Check whether a step's current selection fully satisfies its condition(s).
   * Called at navigation time (Next / Add to Cart) to gate step completion.
   *
   * When a second condition is present, both must be satisfied (AND logic).
   *
   * @param {object}  step              Step config object
   * @param {Record<string, number>} currentSelections  Current selections for this step
   * @returns {boolean}
   */
  function isStepConditionSatisfied(step, currentSelections) {
    if (!step) return true;
    const conditionType = _normalizeConditionType(step.conditionType);

    // Category-rule mode: when any category has non-empty `conditions`, the
    // step is satisfied when every category with conditions is independently
    // satisfied. Step-level conditions are ignored in this mode (mutually
    // exclusive with category rules per the admin UI).
    if (_isCategoryRuleMode(step)) {
      const categories = Array.isArray(step.categories) ? step.categories : [];
      for (const cat of categories) {
        if (!evaluateCategoryRules(cat, currentSelections)) return false;
      }
      return true;
    }

    const selections = currentSelections || {};
    let total = 0;
    for (const value of Object.values(selections)) {
      total += _getSelectionValueByConditionType(value, conditionType);
    }
    const normalizedConditionValue = _normalizeConditionRuleValue(conditionType, step.conditionValue);
    const normalizedConditionValue2 = _normalizeConditionRuleValue(conditionType, step.conditionValue2);

    // No rule configured means the step is optional. Persisted min/max fields
    // describe the retired rule and must not recreate it at navigation time.
    if (!step.conditionType) return true;

    // An incomplete active condition keeps the existing minimum guard.
    if (!step.conditionOperator || !_isPositiveConditionValue(step.conditionValue)) {
      const min = step.minQuantity != null ? Number(step.minQuantity) : 1;
      return total >= min;
    }

    // Primary condition
    if (!_evaluateSatisfied(step.conditionOperator, normalizedConditionValue, total)) return false;

    // Secondary condition — AND logic
    if (step.conditionOperator2 != null && _isPositiveConditionValue(step.conditionValue2)) {
      return _evaluateSatisfied(step.conditionOperator2, normalizedConditionValue2, total);
    }

    return true;
  }

  function getAllowedQuantityPerProduct(validateQuantityPerProduct) {
    if (!validateQuantityPerProduct || validateQuantityPerProduct.isEnabled !== true) {
      return null;
    }

    const allowed = Number(validateQuantityPerProduct.allowedQuantity);
    if (!Number.isFinite(allowed) || allowed < 1) {
      return 1;
    }

    return Math.floor(allowed);
  }

  function canUpdateProductQuantity(validateQuantityPerProduct, currentQuantity, newQuantity) {
    const limit = getAllowedQuantityPerProduct(validateQuantityPerProduct);
    if (limit === null) {
      return { allowed: true, limit: null };
    }

    const current = Number(currentQuantity) || 0;
    const proposed = Number(newQuantity) || 0;
    if (proposed <= current) {
      return { allowed: true, limit };
    }

    return {
      allowed: proposed <= limit,
      limit,
    };
  }

  function isProductQuantityIncreaseDisabled(validateQuantityPerProduct, currentQuantity) {
    const current = Number(currentQuantity) || 0;
    return !canUpdateProductQuantity(
      validateQuantityPerProduct,
      current,
      current + 1,
    ).allowed;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Evaluate a single condition's "can update" rule for the proposed total.
   * Lower-bound operators never block increases (no upper cap from them alone).
   */
  function _evaluateCanUpdate(operator, required, totalAfter) {
    let allowed;
    switch (operator) {
      case OPERATORS.EQUAL_TO:
        // Allow building up to exactly N; prevent exceeding N.
        allowed = totalAfter <= required;
        break;
      case OPERATORS.LESS_THAN_OR_EQUAL_TO:
        allowed = totalAfter <= required;
        break;
      case OPERATORS.GREATER_THAN_OR_EQUAL_TO:
        // Lower-bound: no upper cap — always allow increases.
        allowed = true;
        break;
      default:
        allowed = true;
    }
    return { allowed, limitText: allowed ? null : _buildLimitText(operator, required) };
  }

  /**
   * Evaluate whether a total satisfies a single condition at step-completion time.
   */
  function _evaluateSatisfied(operator, required, total) {
    switch (operator) {
      case OPERATORS.EQUAL_TO:                 return total === required;
      case OPERATORS.GREATER_THAN_OR_EQUAL_TO: return total >= required;
      case OPERATORS.LESS_THAN_OR_EQUAL_TO:   return total <= required;
      default:                                return false;
    }
  }

  function _buildLimitText(operator, required) {
    const map = {
      [OPERATORS.EQUAL_TO]:                `exactly ${required}`,
      [OPERATORS.LESS_THAN_OR_EQUAL_TO]:   `at most ${required}`,
      [OPERATORS.GREATER_THAN_OR_EQUAL_TO]: `at least ${required}`,
    };
    return map[operator] || String(required);
  }

  function _formatStepLimitToast(limitText, required) {
    const requiredQuantity = Number(required);
    if (!Number.isFinite(requiredQuantity) || requiredQuantity <= 0) {
      return 'This step is not configured correctly.';
    }

    const suffix = requiredQuantity === 1 ? '' : 's';
    return `This step allows ${limitText} product${suffix} only.`;
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    OPERATORS,
    calculateStepTotalAfterUpdate,
    canUpdateQuantity,
    isStepConditionSatisfied,
    evaluateCategoryRules,
    isCategoryRuleMode: _isCategoryRuleMode,
    getAllowedQuantityPerProduct,
    canUpdateProductQuantity,
    isProductQuantityIncreaseDisabled,
    _formatStepLimitToast,
  };
}());

// CommonJS export for Node.js / Jest test environment.
// Harmless in browsers (no `module` global in IIFE context).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionValidator;
  module.exports.ConditionValidator = ConditionValidator;
}
