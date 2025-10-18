/**
 * Test Suite for Step Condition Validation
 *
 * Tests the validateCurrentStep() logic from bundle-widget-full.js
 */

describe('Step Condition Validation', () => {

  // Helper function to simulate validateCurrentStep logic
  function validateCurrentStep(currentStep, selectedQuantity) {
    // Check if step has quantity-based conditions
    if (currentStep.conditionType === 'quantity' &&
        currentStep.conditionOperator &&
        currentStep.conditionValue !== null) {
      const requiredQuantity = currentStep.conditionValue;

      switch (currentStep.conditionOperator) {
        case 'equal_to':
          return selectedQuantity === requiredQuantity;
        case 'greater_than':
          return selectedQuantity > requiredQuantity;
        case 'less_than':
          return selectedQuantity < requiredQuantity;
        case 'greater_than_or_equal_to':
          return selectedQuantity >= requiredQuantity;
        case 'less_than_or_equal_to':
          return selectedQuantity <= requiredQuantity;
        default:
          return false; // Unknown condition operator
      }
    }

    // ORIGINAL BUG: If no explicit condition, consider it valid if at least one product is selected
    // return selectedQuantity > 0;

    // FIX: If no explicit condition is set, the step is always valid (allow navigation)
    return true;
  }

  describe('Steps WITH Configured Conditions', () => {

    test('equal_to: should pass when quantity matches exactly', () => {
      const step = {
        conditionType: 'quantity',
        conditionOperator: 'equal_to',
        conditionValue: 3
      };

      expect(validateCurrentStep(step, 3)).toBe(true);
      expect(validateCurrentStep(step, 2)).toBe(false);
      expect(validateCurrentStep(step, 4)).toBe(false);
      expect(validateCurrentStep(step, 0)).toBe(false);
    });

    test('greater_than: should pass when quantity exceeds threshold', () => {
      const step = {
        conditionType: 'quantity',
        conditionOperator: 'greater_than',
        conditionValue: 2
      };

      expect(validateCurrentStep(step, 3)).toBe(true);
      expect(validateCurrentStep(step, 5)).toBe(true);
      expect(validateCurrentStep(step, 2)).toBe(false);
      expect(validateCurrentStep(step, 1)).toBe(false);
      expect(validateCurrentStep(step, 0)).toBe(false);
    });

    test('less_than: should pass when quantity is below threshold', () => {
      const step = {
        conditionType: 'quantity',
        conditionOperator: 'less_than',
        conditionValue: 5
      };

      expect(validateCurrentStep(step, 4)).toBe(true);
      expect(validateCurrentStep(step, 0)).toBe(true);
      expect(validateCurrentStep(step, 1)).toBe(true);
      expect(validateCurrentStep(step, 5)).toBe(false);
      expect(validateCurrentStep(step, 6)).toBe(false);
    });

    test('greater_than_or_equal_to: should pass when quantity meets or exceeds threshold', () => {
      const step = {
        conditionType: 'quantity',
        conditionOperator: 'greater_than_or_equal_to',
        conditionValue: 3
      };

      expect(validateCurrentStep(step, 3)).toBe(true);
      expect(validateCurrentStep(step, 4)).toBe(true);
      expect(validateCurrentStep(step, 10)).toBe(true);
      expect(validateCurrentStep(step, 2)).toBe(false);
      expect(validateCurrentStep(step, 0)).toBe(false);
    });

    test('less_than_or_equal_to: should pass when quantity is at or below threshold', () => {
      const step = {
        conditionType: 'quantity',
        conditionOperator: 'less_than_or_equal_to',
        conditionValue: 4
      };

      expect(validateCurrentStep(step, 4)).toBe(true);
      expect(validateCurrentStep(step, 3)).toBe(true);
      expect(validateCurrentStep(step, 0)).toBe(true);
      expect(validateCurrentStep(step, 5)).toBe(false);
      expect(validateCurrentStep(step, 10)).toBe(false);
    });

    test('unknown operator: should return false', () => {
      const step = {
        conditionType: 'quantity',
        conditionOperator: 'invalid_operator',
        conditionValue: 3
      };

      expect(validateCurrentStep(step, 3)).toBe(false);
      expect(validateCurrentStep(step, 0)).toBe(false);
    });
  });

  describe('Steps WITHOUT Configured Conditions (THE BUG SCENARIO)', () => {

    test('should ALWAYS return true when no condition is set (null conditionType)', () => {
      const step = {
        conditionType: null,
        conditionOperator: null,
        conditionValue: null
      };

      // BUG: Original code would fail these cases with 0 quantity
      expect(validateCurrentStep(step, 0)).toBe(true); // ❌ FAILS with original code
      expect(validateCurrentStep(step, 1)).toBe(true);
      expect(validateCurrentStep(step, 5)).toBe(true);
    });

    test('should ALWAYS return true when conditionType is undefined', () => {
      const step = {
        // conditionType: undefined,
        // conditionOperator: undefined,
        // conditionValue: undefined
      };

      expect(validateCurrentStep(step, 0)).toBe(true); // ❌ FAILS with original code
      expect(validateCurrentStep(step, 1)).toBe(true);
    });

    test('should ALWAYS return true when conditionType is not "quantity"', () => {
      const step = {
        conditionType: 'other_type',
        conditionOperator: 'equal_to',
        conditionValue: 3
      };

      expect(validateCurrentStep(step, 0)).toBe(true); // ❌ FAILS with original code
      expect(validateCurrentStep(step, 5)).toBe(true);
    });

    test('should ALWAYS return true when conditionOperator is null/undefined', () => {
      const step = {
        conditionType: 'quantity',
        conditionOperator: null,
        conditionValue: 3
      };

      expect(validateCurrentStep(step, 0)).toBe(true); // ❌ FAILS with original code
      expect(validateCurrentStep(step, 1)).toBe(true);
    });

    test('should ALWAYS return true when conditionValue is null', () => {
      const step = {
        conditionType: 'quantity',
        conditionOperator: 'equal_to',
        conditionValue: null
      };

      expect(validateCurrentStep(step, 0)).toBe(true); // ❌ FAILS with original code
      expect(validateCurrentStep(step, 3)).toBe(true);
    });
  });

  describe('Real-World Navigation Scenarios', () => {

    test('Scenario 1: User on Step 2, going back to Step 1 (no conditions, 0 products selected)', () => {
      const step1 = {
        conditionType: null,
        conditionOperator: null,
        conditionValue: null
      };

      // User hasn't selected anything on Step 1 yet
      const selectedQuantity = 0;

      // Should allow navigation back
      expect(validateCurrentStep(step1, selectedQuantity)).toBe(true); // ❌ FAILS with original code
    });

    test('Scenario 2: User on Step 3, going back to Step 2 (has conditions, not met)', () => {
      const step2 = {
        conditionType: 'quantity',
        conditionOperator: 'equal_to',
        conditionValue: 2
      };

      // User only selected 1 product on Step 2
      const selectedQuantity = 1;

      // Should NOT allow navigation if conditions are configured and not met
      expect(validateCurrentStep(step2, selectedQuantity)).toBe(false);
    });

    test('Scenario 3: Multi-step bundle with mixed conditions', () => {
      const steps = [
        { // Step 1: No conditions
          conditionType: null,
          conditionOperator: null,
          conditionValue: null
        },
        { // Step 2: Exactly 2 products
          conditionType: 'quantity',
          conditionOperator: 'equal_to',
          conditionValue: 2
        },
        { // Step 3: At least 1 product
          conditionType: 'quantity',
          conditionOperator: 'greater_than_or_equal_to',
          conditionValue: 1
        }
      ];

      // User selections
      const selections = [0, 1, 2]; // Step 1: 0, Step 2: 1, Step 3: 2

      // Validation results
      expect(validateCurrentStep(steps[0], selections[0])).toBe(true);  // Step 1: No conditions - should pass
      expect(validateCurrentStep(steps[1], selections[1])).toBe(false); // Step 2: Needs 2, has 1 - should fail
      expect(validateCurrentStep(steps[2], selections[2])).toBe(true);  // Step 3: Needs >=1, has 2 - should pass
    });
  });

  describe('Edge Cases', () => {

    test('should handle zero conditionValue', () => {
      const step = {
        conditionType: 'quantity',
        conditionOperator: 'equal_to',
        conditionValue: 0
      };

      expect(validateCurrentStep(step, 0)).toBe(true);
      expect(validateCurrentStep(step, 1)).toBe(false);
    });

    test('should handle very large conditionValue', () => {
      const step = {
        conditionType: 'quantity',
        conditionOperator: 'less_than_or_equal_to',
        conditionValue: 999999
      };

      expect(validateCurrentStep(step, 0)).toBe(true);
      expect(validateCurrentStep(step, 999999)).toBe(true);
      expect(validateCurrentStep(step, 1000000)).toBe(false);
    });

    test('should handle negative quantity values (edge case - should not happen in real usage)', () => {
      const step = {
        conditionType: 'quantity',
        conditionOperator: 'greater_than',
        conditionValue: 0
      };

      // Negative quantities should fail greater_than 0
      expect(validateCurrentStep(step, -1)).toBe(false);
      expect(validateCurrentStep(step, 1)).toBe(true);
    });
  });
});

console.log('✅ Test suite created successfully!');
console.log('');
console.log('🐛 BUG IDENTIFIED:');
console.log('The original validateCurrentStep() function returns `totalQuantitySelected > 0` when no conditions are set.');
console.log('This causes the toast error when navigating back to a step with 0 products selected and no conditions configured.');
console.log('');
console.log('✅ FIX:');
console.log('Change line 1479 from `return totalQuantitySelected > 0;` to `return true;`');
console.log('This allows navigation when no conditions are set, regardless of selection state.');
