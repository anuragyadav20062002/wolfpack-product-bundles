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
    // No valid condition → always allow
    if (!step || !step.conditionType || !step.conditionOperator || step.conditionValue == null) {
      return { allowed: true, limitText: null };
    }

    const required = step.conditionValue;
    const totalAfter = calculateStepTotalAfterUpdate(
      currentSelections,
      targetProductId,
      newQuantity,
    );

    let allowed;
    switch (step.conditionOperator) {
      case OPERATORS.EQUAL_TO:
        // Allow building up to exactly N; prevent exceeding N.
        // Final step validation (isStepConditionSatisfied) then enforces exactly N.
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
        // No upper bound for minimum-quantity conditions — always allow increases.
        allowed = true;
        break;
      default:
        allowed = true;
    }

    const limitText = allowed ? null : _buildLimitText(step.conditionOperator, required);
    return { allowed, limitText };
  }

  /**
   * Check whether a step's current selection fully satisfies its condition.
   * Called at navigation time (Next / Add to Cart) to gate step completion.
   *
   * @param {object}  step              Step config object
   * @param {Record<string, number>} currentSelections  Current selections for this step
   * @returns {boolean}
   */
  function isStepConditionSatisfied(step, currentSelections) {
    // No valid condition → step is optional, always satisfied.
    if (!step || !step.conditionType || !step.conditionOperator || step.conditionValue == null) {
      return true;
    }

    const selections = currentSelections || {};
    let total = 0;
    for (const qty of Object.values(selections)) {
      total += qty || 0;
    }

    const required = step.conditionValue;
    switch (step.conditionOperator) {
      case OPERATORS.EQUAL_TO:               return total === required;
      case OPERATORS.GREATER_THAN:           return total > required;
      case OPERATORS.LESS_THAN:              return total < required;
      case OPERATORS.GREATER_THAN_OR_EQUAL_TO: return total >= required;
      case OPERATORS.LESS_THAN_OR_EQUAL_TO:  return total <= required;
      default:                               return true;
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

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
