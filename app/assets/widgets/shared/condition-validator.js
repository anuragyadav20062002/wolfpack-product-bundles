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
    GREATER_THAN:            'greater_than',
    LESS_THAN:               'less_than',
    GREATER_THAN_OR_EQUAL_TO: 'greater_than_or_equal_to',
    LESS_THAN_OR_EQUAL_TO:   'less_than_or_equal_to',
  };

  /**
   * Calculate the total quantity in a step AFTER a proposed update.
   *
   * Correctly handles both:
   *  - Existing products: replaces their current quantity with newQuantity
   *  - New products (not yet in currentSelections): adds newQuantity to existing total
   *
   * @param {Record<string, number>} currentSelections  Current { productId → qty } map
   * @param {string}  targetProductId  The product whose quantity is being changed
   * @param {number}  newQuantity      The proposed new quantity (0 = remove)
   * @returns {number}  Total quantity across all products in the step after the update
   */
  function calculateStepTotalAfterUpdate(currentSelections, targetProductId, newQuantity) {
    const selections = currentSelections || {};

    // Start with the target product's new quantity (handles new products correctly).
    let total = newQuantity;

    // Add every OTHER product's existing quantity unchanged.
    for (const pid of Object.keys(selections)) {
      if (pid !== targetProductId) {
        total += selections[pid] || 0;
      }
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
  function canUpdateQuantity(step, currentSelections, targetProductId, newQuantity) {
    // No explicit condition configured → no upper bound; always allow increases
    if (!step || !step.conditionType || !step.conditionOperator || step.conditionValue == null) {
      return { allowed: true, limitText: null };
    }

    const totalAfter = calculateStepTotalAfterUpdate(
      currentSelections,
      targetProductId,
      newQuantity,
    );

    // Primary condition
    const primary = _evaluateCanUpdate(step.conditionOperator, step.conditionValue, totalAfter);
    if (!primary.allowed) return primary;

    // Secondary condition — AND logic (only when both fields are non-null)
    if (step.conditionOperator2 != null && step.conditionValue2 != null) {
      const secondary = _evaluateCanUpdate(step.conditionOperator2, step.conditionValue2, totalAfter);
      if (!secondary.allowed) return secondary;
    }

    return { allowed: true, limitText: null };
  }

  /**
   * Normalize an operator name. The validator accepts both Wolfpack-style
   * snake_case (`greater_than_or_equal_to`) and EB-style camelCase
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
      total += Number(qty) || 0;
    }
    return total;
  }

  function _collectCategoryProductIds(category) {
    const ids = new Set();
    const products = Array.isArray(category && category.products) ? category.products : [];
    for (const product of products) {
      const id = product && (product.id || product.productId || product.graphqlId);
      if (id != null && id !== '') ids.add(String(id));
    }
    return ids;
  }

  /**
   * Evaluate whether a single category's rules are satisfied by the current
   * step selections. Categories with no `conditions` are always satisfied.
   *
   * Used by `isStepConditionSatisfied` in category-rule mode.
   */
  function evaluateCategoryRules(category, stepSelections) {
    const rules = Array.isArray(category && category.conditions) ? category.conditions : [];
    if (rules.length === 0) return true;

    const productIds = _collectCategoryProductIds(category);
    const selections = stepSelections || {};
    let categoryTotal = 0;
    for (const pid of Object.keys(selections)) {
      if (productIds.has(String(pid))) {
        categoryTotal += Number(selections[pid]) || 0;
      }
    }

    for (const rule of rules) {
      const operator = _normalizeOperator(rule && (rule.operator || rule.condition));
      const value = Number(rule && rule.value);
      if (!Number.isFinite(value)) continue;
      if (!_evaluateSatisfied(operator, value, categoryTotal)) return false;
    }
    return true;
  }

  function _isCategoryRuleMode(step) {
    const categories = Array.isArray(step && step.categories) ? step.categories : [];
    return categories.some(c => Array.isArray(c && c.conditions) && c.conditions.length > 0);
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
    for (const qty of Object.values(selections)) {
      total += qty || 0;
    }

    // No explicit condition configured → only enforce minQuantity; no upper bound
    if (!step.conditionType || !step.conditionOperator || step.conditionValue == null) {
      const min = step.minQuantity != null ? Number(step.minQuantity) : 1;
      return total >= min;
    }

    // Primary condition
    if (!_evaluateSatisfied(step.conditionOperator, step.conditionValue, total)) return false;

    // Secondary condition — AND logic
    if (step.conditionOperator2 != null && step.conditionValue2 != null) {
      return _evaluateSatisfied(step.conditionOperator2, step.conditionValue2, total);
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
      case OPERATORS.LESS_THAN:
        allowed = totalAfter < required;
        break;
      case OPERATORS.LESS_THAN_OR_EQUAL_TO:
        allowed = totalAfter <= required;
        break;
      case OPERATORS.GREATER_THAN:
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
      case OPERATORS.GREATER_THAN:             return total > required;
      case OPERATORS.LESS_THAN:               return total < required;
      case OPERATORS.GREATER_THAN_OR_EQUAL_TO: return total >= required;
      case OPERATORS.LESS_THAN_OR_EQUAL_TO:   return total <= required;
      default:                                return true;
    }
  }

  function _buildLimitText(operator, required) {
    const map = {
      [OPERATORS.EQUAL_TO]:                `exactly ${required}`,
      [OPERATORS.LESS_THAN]:               `less than ${required}`,
      [OPERATORS.LESS_THAN_OR_EQUAL_TO]:   `at most ${required}`,
      [OPERATORS.GREATER_THAN]:            `more than ${required}`,
      [OPERATORS.GREATER_THAN_OR_EQUAL_TO]: `at least ${required}`,
    };
    return map[operator] || String(required);
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    OPERATORS,
    calculateStepTotalAfterUpdate,
    canUpdateQuantity,
    isStepConditionSatisfied,
    evaluateCategoryRules,
    getAllowedQuantityPerProduct,
    canUpdateProductQuantity,
  };
}());

// CommonJS export for Node.js / Jest test environment.
// Harmless in browsers (no `module` global in IIFE context).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionValidator;
}
