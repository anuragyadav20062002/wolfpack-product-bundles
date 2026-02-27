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
    // No valid primary condition → enforce maxQuantity as an upper bound if set, otherwise allow
    if (!step || !step.conditionType || !step.conditionOperator || step.conditionValue == null) {
      if (step && step.maxQuantity != null && Number(step.maxQuantity) > 0) {
        const max = Number(step.maxQuantity);
        const totalAfter = calculateStepTotalAfterUpdate(currentSelections, targetProductId, newQuantity);
        if (totalAfter > max) {
          return { allowed: false, limitText: `at most ${max}` };
        }
      }
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

    const selections = currentSelections || {};
    let total = 0;
    for (const qty of Object.values(selections)) {
      total += qty || 0;
    }

    // No explicit condition configured → fallback to minQuantity / maxQuantity range.
    if (!step.conditionType || !step.conditionOperator || step.conditionValue == null) {
      const min = step.minQuantity != null ? Number(step.minQuantity) : 1;
      const max = step.maxQuantity != null ? Number(step.maxQuantity) : null;
      if (total < min) return false;
      if (max !== null && max > 0 && total > max) return false;
      return true;
    }

    // Primary condition
    if (!_evaluateSatisfied(step.conditionOperator, step.conditionValue, total)) return false;

    // Secondary condition — AND logic
    if (step.conditionOperator2 != null && step.conditionValue2 != null) {
      return _evaluateSatisfied(step.conditionOperator2, step.conditionValue2, total);
    }

    return true;
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
  };
}());

// CommonJS export for Node.js / Jest test environment.
// Harmless in browsers (no `module` global in IIFE context).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionValidator;
}
