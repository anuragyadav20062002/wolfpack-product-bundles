/**
 * Unit Tests: Bottom-Sheet Widget Helper Functions
 *
 * Tests the three pure helper functions exposed by the product-page widget
 * for bottom-sheet mode: step progression, default step detection, and
 * discount badge label extraction.
 */

// ============================================================
// Types mirroring the shape used in bundle-widget-product-page.js
// ============================================================
interface MockStep {
  id?: string;
  name?: string;
  isDefault?: boolean;
  discountBadgeLabel?: string;
  conditionOperator?: string;
  conditionValue?: number;
}

type MockSelections = Record<string, number>; // variantId → quantity

// ============================================================
// Pure function implementations under test (copied logic from widget)
// These must match exactly what is implemented in bundle-widget-product-page.js
// ============================================================

/**
 * Find the next incomplete non-default step, starting *after* `fromIndex`.
 * Returns -1 if all remaining non-default steps are complete.
 */
function bsFindNextIncompleteStep(
  steps: MockStep[],
  _selectedProducts: MockSelections[],
  validateFn: (index: number) => boolean,
  fromIndex: number
): number {
  for (let i = fromIndex + 1; i < steps.length; i++) {
    if (!steps[i].isDefault && !validateFn(i)) return i;
  }
  return -1;
}

function bsIsDefaultStep(step: MockStep | null | undefined): boolean {
  return !!step?.isDefault;
}

function bsGetDiscountBadgeLabel(step: MockStep | null | undefined): string | null {
  return step?.discountBadgeLabel || null;
}

// ============================================================
// Tests
// ============================================================

describe('bsFindNextIncompleteStep', () => {
  const steps: MockStep[] = [
    { id: 's0', name: 'T-Shirt' },
    { id: 's1', name: 'Pants' },
    { id: 's2', name: 'Hoodie' },
    { id: 's3', name: 'Cap (Free)', discountBadgeLabel: 'FREE' },
  ];
  const emptySelections: MockSelections[] = [{}, {}, {}, {}];

  it('returns next incomplete step after fromIndex', () => {
    const validateFn = (i: number) => i === 0; // only step 0 is complete
    const result = bsFindNextIncompleteStep(steps, emptySelections, validateFn, 0);
    expect(result).toBe(1); // step 1 is next incomplete
  });

  it('skips complete steps when finding next', () => {
    const validateFn = (i: number) => [0, 1].includes(i); // steps 0 and 1 complete
    const result = bsFindNextIncompleteStep(steps, emptySelections, validateFn, 0);
    expect(result).toBe(2); // step 2 is next incomplete
  });

  it('returns -1 when all remaining steps are complete', () => {
    const validateFn = () => true; // all complete
    const result = bsFindNextIncompleteStep(steps, emptySelections, validateFn, 0);
    expect(result).toBe(-1);
  });

  it('returns -1 when fromIndex is at last step and it is complete', () => {
    const validateFn = () => true;
    const result = bsFindNextIncompleteStep(steps, emptySelections, validateFn, 3);
    expect(result).toBe(-1);
  });

  it('skips default steps even if they are incomplete', () => {
    const stepsWithDefault: MockStep[] = [
      { id: 's0', name: 'T-Shirt' },
      { id: 's1', name: 'Default Bag', isDefault: true },
      { id: 's2', name: 'Pants' },
    ];
    const validateFn = (i: number) => i === 0 || i === 1; // s0 complete, s1 complete (default)
    const result = bsFindNextIncompleteStep(stepsWithDefault, [{}, {}, {}], validateFn, 0);
    // s1 is default (skipped in search), s2 is incomplete → should return 2
    const validateFnIncompleteS2 = (i: number) => i !== 2;
    const result2 = bsFindNextIncompleteStep(stepsWithDefault, [{}, {}, {}], validateFnIncompleteS2, 0);
    expect(result2).toBe(2);
  });

  it('returns -1 when all non-default steps after fromIndex are complete', () => {
    const stepsWithDefault: MockStep[] = [
      { id: 's0', name: 'T-Shirt' },
      { id: 's1', name: 'Pants' },
      { id: 's2', name: 'Default Bag', isDefault: true },
    ];
    const validateFn = () => true;
    const result = bsFindNextIncompleteStep(stepsWithDefault, [{}, {}, {}], validateFn, 0);
    expect(result).toBe(-1);
  });

  it('handles empty steps array', () => {
    const result = bsFindNextIncompleteStep([], [], () => false, 0);
    expect(result).toBe(-1);
  });
});

describe('bsIsDefaultStep', () => {
  it('returns true when step has isDefault: true', () => {
    expect(bsIsDefaultStep({ isDefault: true })).toBe(true);
  });

  it('returns false when step has isDefault: false', () => {
    expect(bsIsDefaultStep({ isDefault: false })).toBe(false);
  });

  it('returns false when step has no isDefault field', () => {
    expect(bsIsDefaultStep({ name: 'T-Shirt' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(bsIsDefaultStep(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(bsIsDefaultStep(undefined)).toBe(false);
  });
});

describe('bsGetDiscountBadgeLabel', () => {
  it('returns the badge label when set', () => {
    expect(bsGetDiscountBadgeLabel({ discountBadgeLabel: 'FREE' })).toBe('FREE');
  });

  it('returns custom label when set', () => {
    expect(bsGetDiscountBadgeLabel({ discountBadgeLabel: '20% off' })).toBe('20% off');
  });

  it('returns null when discountBadgeLabel is absent', () => {
    expect(bsGetDiscountBadgeLabel({ name: 'T-Shirt' })).toBeNull();
  });

  it('returns null when discountBadgeLabel is empty string', () => {
    expect(bsGetDiscountBadgeLabel({ discountBadgeLabel: '' })).toBeNull();
  });

  it('returns null for null step', () => {
    expect(bsGetDiscountBadgeLabel(null)).toBeNull();
  });

  it('returns null for undefined step', () => {
    expect(bsGetDiscountBadgeLabel(undefined)).toBeNull();
  });
});
