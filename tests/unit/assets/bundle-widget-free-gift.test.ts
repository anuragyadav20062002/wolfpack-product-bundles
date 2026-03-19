/**
 * Unit Tests: FPB Widget — Free Gift Unlock Logic + Default Product Init
 *
 * Tests pure logic functions mirroring what will be in bundle-widget-full-page.js:
 *   - freeGiftStep getter
 *   - paidSteps getter
 *   - isFreeGiftUnlocked
 *   - canNavigateToStep
 *   - _getFreeGiftRemainingCount
 *   - _initDefaultProducts (pre-populates selectedProducts)
 */

export {};

// ============================================================
// Types
// ============================================================

interface Step {
  id: string;
  name: string;
  minQuantity: number;
  conditionValue?: number | null;
  isFreeGift?: boolean;
  freeGiftName?: string | null;
  isDefault?: boolean;
  defaultVariantId?: string | null;
  products?: any[];
  StepProduct?: any[];
}

interface SelectedProduct {
  variantId: string;
  quantity: number;
  isDefault?: boolean;
  title?: string;
  price?: number;
}

type SelectedProducts = Record<number, Record<string, SelectedProduct>>;

// ============================================================
// Pure helpers — mirror what will be in bundle-widget-full-page.js
// ============================================================

function getFreeGiftStep(steps: Step[]): Step | null {
  return steps.find(s => s.isFreeGift === true) ?? null;
}

function getFreeGiftStepIndex(steps: Step[]): number {
  return steps.findIndex(s => s.isFreeGift === true);
}

function getPaidSteps(steps: Step[]): Step[] {
  return steps.filter(s => !s.isFreeGift && !s.isDefault);
}

function isStepCompleted(step: Step, selections: Record<string, SelectedProduct>): boolean {
  const required = Number(step.conditionValue) || Number(step.minQuantity) || 1;
  const selected = Object.values(selections || {}).reduce((sum, p) => sum + (p.quantity || 1), 0);
  return selected >= required;
}

function isFreeGiftUnlocked(steps: Step[], selectedProducts: SelectedProducts): boolean {
  const freeGiftStep = getFreeGiftStep(steps);
  if (!freeGiftStep) return false;
  const paid = getPaidSteps(steps);
  return paid.every((paidStep) => {
    const globalIndex = steps.indexOf(paidStep);
    return isStepCompleted(paidStep, selectedProducts[globalIndex] ?? {});
  });
}

function canNavigateToStep(
  targetIndex: number,
  steps: Step[],
  selectedProducts: SelectedProducts
): boolean {
  const targetStep = steps[targetIndex];
  if (targetStep?.isFreeGift && !isFreeGiftUnlocked(steps, selectedProducts)) return false;
  return true;
}

function getFreeGiftRemainingCount(steps: Step[], selectedProducts: SelectedProducts): number {
  const paid = getPaidSteps(steps);
  const total = paid.reduce((sum, s) => sum + (Number(s.conditionValue) || Number(s.minQuantity) || 1), 0);
  const selected = paid.reduce((sum, paidStep) => {
    const globalIndex = steps.indexOf(paidStep);
    const stepSel = selectedProducts[globalIndex] ?? {};
    return sum + Object.values(stepSel).reduce((s, p) => s + (p.quantity || 1), 0);
  }, 0);
  return Math.max(0, total - selected);
}

function initDefaultProducts(steps: Step[], selectedProducts: SelectedProducts): SelectedProducts {
  const result: SelectedProducts = { ...selectedProducts };
  steps.forEach((step, stepIndex) => {
    if (!step.isDefault || !step.defaultVariantId) return;
    const allProducts = [...(step.products || []), ...(step.StepProduct || [])];
    const product = allProducts.find(p =>
      p.variantId === step.defaultVariantId ||
      p.id === step.defaultVariantId ||
      p.gid === step.defaultVariantId ||
      (p.variants || []).some((v: any) => v.id === step.defaultVariantId || v.gid === step.defaultVariantId)
    );
    if (product) {
      if (!result[stepIndex]) result[stepIndex] = {};
      result[stepIndex][step.defaultVariantId!] = {
        ...product,
        variantId: step.defaultVariantId!,
        quantity: 1,
        isDefault: true,
      };
    }
  });
  return result;
}

// ============================================================
// Test data builders
// ============================================================

function makeStep(overrides: Partial<Step> = {}): Step {
  return {
    id: 'step-' + Math.random().toString(36).slice(2, 7),
    name: 'Step',
    minQuantity: 1,
    conditionValue: null,
    isFreeGift: false,
    isDefault: false,
    defaultVariantId: null,
    products: [],
    StepProduct: [],
    ...overrides,
  };
}

function makeSelection(variantId: string, quantity = 1, isDefault = false): SelectedProduct {
  return { variantId, quantity, isDefault };
}

// ============================================================
// Tests: getFreeGiftStep
// ============================================================

describe('getFreeGiftStep', () => {
  it('returns null when no steps', () => {
    expect(getFreeGiftStep([])).toBeNull();
  });

  it('returns null when no step has isFreeGift=true', () => {
    expect(getFreeGiftStep([makeStep(), makeStep()])).toBeNull();
  });

  it('returns the step when one step has isFreeGift=true', () => {
    const gift = makeStep({ isFreeGift: true, freeGiftName: 'cap' });
    const steps = [makeStep(), gift];
    expect(getFreeGiftStep(steps)).toBe(gift);
  });

  it('returns the first free gift step when multiple exist', () => {
    const gift1 = makeStep({ id: 'gift-1', isFreeGift: true });
    const gift2 = makeStep({ id: 'gift-2', isFreeGift: true });
    expect(getFreeGiftStep([gift1, gift2])?.id).toBe('gift-1');
  });
});

// ============================================================
// Tests: getPaidSteps
// ============================================================

describe('getPaidSteps', () => {
  it('returns all steps when no free gift or default steps', () => {
    const steps = [makeStep(), makeStep(), makeStep()];
    expect(getPaidSteps(steps)).toHaveLength(3);
  });

  it('excludes free gift steps', () => {
    const steps = [makeStep(), makeStep({ isFreeGift: true }), makeStep()];
    expect(getPaidSteps(steps)).toHaveLength(2);
    expect(getPaidSteps(steps).every(s => !s.isFreeGift)).toBe(true);
  });

  it('excludes default steps', () => {
    const steps = [makeStep({ isDefault: true }), makeStep(), makeStep()];
    expect(getPaidSteps(steps)).toHaveLength(2);
    expect(getPaidSteps(steps).every(s => !s.isDefault)).toBe(true);
  });

  it('excludes both free gift and default steps', () => {
    const steps = [
      makeStep({ isDefault: true }),
      makeStep(),
      makeStep({ isFreeGift: true }),
    ];
    expect(getPaidSteps(steps)).toHaveLength(1);
  });

  it('returns empty array when all steps are special', () => {
    const steps = [makeStep({ isDefault: true }), makeStep({ isFreeGift: true })];
    expect(getPaidSteps(steps)).toHaveLength(0);
  });
});

// ============================================================
// Tests: isFreeGiftUnlocked
// ============================================================

describe('isFreeGiftUnlocked', () => {
  it('returns false when there is no free gift step', () => {
    const steps = [makeStep(), makeStep()];
    expect(isFreeGiftUnlocked(steps, {})).toBe(false);
  });

  it('returns false when paid steps are not complete (no selections)', () => {
    const steps = [
      makeStep({ id: 's1', minQuantity: 1 }),
      makeStep({ id: 's2', isFreeGift: true }),
    ];
    expect(isFreeGiftUnlocked(steps, {})).toBe(false);
  });

  it('returns false when paid step is partially complete', () => {
    const steps = [
      makeStep({ id: 's1', minQuantity: 2 }),
      makeStep({ id: 's2', isFreeGift: true }),
    ];
    const selected: SelectedProducts = { 0: { 'v1': makeSelection('v1', 1) } };
    expect(isFreeGiftUnlocked(steps, selected)).toBe(false);
  });

  it('returns true when all paid steps are complete', () => {
    const steps = [
      makeStep({ id: 's1', minQuantity: 1 }),
      makeStep({ id: 's2', isFreeGift: true }),
    ];
    const selected: SelectedProducts = { 0: { 'v1': makeSelection('v1', 1) } };
    expect(isFreeGiftUnlocked(steps, selected)).toBe(true);
  });

  it('returns true with multiple paid steps all complete', () => {
    const steps = [
      makeStep({ id: 's1', minQuantity: 1 }),
      makeStep({ id: 's2', minQuantity: 1 }),
      makeStep({ id: 's3', isFreeGift: true }),
    ];
    const selected: SelectedProducts = {
      0: { 'v1': makeSelection('v1', 1) },
      1: { 'v2': makeSelection('v2', 1) },
    };
    expect(isFreeGiftUnlocked(steps, selected)).toBe(true);
  });

  it('returns false again when a paid item is removed after being unlocked', () => {
    const steps = [
      makeStep({ id: 's1', minQuantity: 1 }),
      makeStep({ id: 's2', isFreeGift: true }),
    ];
    // Unlocked
    let selected: SelectedProducts = { 0: { 'v1': makeSelection('v1', 1) } };
    expect(isFreeGiftUnlocked(steps, selected)).toBe(true);
    // Remove item
    selected = {};
    expect(isFreeGiftUnlocked(steps, selected)).toBe(false);
  });

  it('ignores default steps when computing unlock condition', () => {
    const steps = [
      makeStep({ id: 's0', isDefault: true, defaultVariantId: 'vDefault' }),
      makeStep({ id: 's1', minQuantity: 1 }),
      makeStep({ id: 's2', isFreeGift: true }),
    ];
    // Only paid step (index 1) needs to be completed
    const selected: SelectedProducts = {
      0: { 'vDefault': makeSelection('vDefault', 1, true) }, // default
      1: { 'v1': makeSelection('v1', 1) }, // paid
    };
    expect(isFreeGiftUnlocked(steps, selected)).toBe(true);
  });

  it('returns false when only default step is filled but paid step is not', () => {
    const steps = [
      makeStep({ id: 's0', isDefault: true }),
      makeStep({ id: 's1', minQuantity: 1 }),
      makeStep({ id: 's2', isFreeGift: true }),
    ];
    const selected: SelectedProducts = { 0: { 'vDef': makeSelection('vDef', 1, true) } };
    expect(isFreeGiftUnlocked(steps, selected)).toBe(false);
  });
});

// ============================================================
// Tests: canNavigateToStep
// ============================================================

describe('canNavigateToStep', () => {
  it('returns true for a regular paid step', () => {
    const steps = [makeStep(), makeStep(), makeStep({ isFreeGift: true })];
    expect(canNavigateToStep(1, steps, {})).toBe(true);
  });

  it('returns false for free gift step when not unlocked', () => {
    const steps = [
      makeStep({ minQuantity: 1 }),
      makeStep({ isFreeGift: true }),
    ];
    expect(canNavigateToStep(1, steps, {})).toBe(false);
  });

  it('returns true for free gift step when unlocked', () => {
    const steps = [
      makeStep({ minQuantity: 1 }),
      makeStep({ isFreeGift: true }),
    ];
    const selected: SelectedProducts = { 0: { 'v1': makeSelection('v1') } };
    expect(canNavigateToStep(1, steps, selected)).toBe(true);
  });

  it('returns true for out-of-bounds index (no targetStep)', () => {
    const steps = [makeStep()];
    expect(canNavigateToStep(5, steps, {})).toBe(true);
  });
});

// ============================================================
// Tests: getFreeGiftRemainingCount
// ============================================================

describe('getFreeGiftRemainingCount', () => {
  it('returns total required when nothing selected', () => {
    const steps = [
      makeStep({ minQuantity: 1 }),
      makeStep({ minQuantity: 1 }),
      makeStep({ isFreeGift: true }),
    ];
    expect(getFreeGiftRemainingCount(steps, {})).toBe(2);
  });

  it('returns 0 when all paid steps complete', () => {
    const steps = [
      makeStep({ minQuantity: 1 }),
      makeStep({ isFreeGift: true }),
    ];
    const selected: SelectedProducts = { 0: { 'v1': makeSelection('v1') } };
    expect(getFreeGiftRemainingCount(steps, selected)).toBe(0);
  });

  it('returns correct count for partial completion', () => {
    const steps = [
      makeStep({ minQuantity: 1 }),
      makeStep({ minQuantity: 1 }),
      makeStep({ isFreeGift: true }),
    ];
    const selected: SelectedProducts = { 0: { 'v1': makeSelection('v1') } };
    expect(getFreeGiftRemainingCount(steps, selected)).toBe(1);
  });

  it('does not count default step selections toward paid total', () => {
    const steps = [
      makeStep({ isDefault: true, minQuantity: 1 }),
      makeStep({ minQuantity: 1 }),
      makeStep({ isFreeGift: true }),
    ];
    const selected: SelectedProducts = {
      0: { 'vDef': makeSelection('vDef', 1, true) }, // default — excluded
    };
    // Only paid step at index 1 counts; 1 item needed, 0 selected = 1 remaining
    expect(getFreeGiftRemainingCount(steps, selected)).toBe(1);
  });

  it('never returns negative', () => {
    const steps = [
      makeStep({ minQuantity: 1 }),
      makeStep({ isFreeGift: true }),
    ];
    const selected: SelectedProducts = {
      0: { 'v1': makeSelection('v1', 3) }, // over-selected
    };
    expect(getFreeGiftRemainingCount(steps, selected)).toBe(0);
  });
});

// ============================================================
// Tests: initDefaultProducts
// ============================================================

describe('initDefaultProducts', () => {
  it('does nothing when no steps have isDefault=true', () => {
    const steps = [makeStep(), makeStep()];
    const result = initDefaultProducts(steps, {});
    expect(result).toEqual({});
  });

  it('does nothing when isDefault=true but no defaultVariantId', () => {
    const steps = [makeStep({ isDefault: true, defaultVariantId: null })];
    const result = initDefaultProducts(steps, {});
    expect(result).toEqual({});
  });

  it('pre-populates selectedProducts for a default step with matching product', () => {
    const variantId = 'gid://shopify/ProductVariant/123';
    const product = { id: 'prod-1', title: 'Gift Box', variantId, price: 499, StepProduct: [] };
    const steps = [
      makeStep({
        isDefault: true,
        defaultVariantId: variantId,
        products: [product],
      }),
    ];
    const result = initDefaultProducts(steps, {});
    expect(result[0]).toBeDefined();
    expect(result[0][variantId]).toBeDefined();
    expect(result[0][variantId].quantity).toBe(1);
    expect(result[0][variantId].isDefault).toBe(true);
  });

  it('marks pre-populated products with isDefault=true', () => {
    const variantId = 'gid://shopify/ProductVariant/456';
    const product = { id: 'prod-2', title: 'Mandatory Box', variantId, price: 999 };
    const steps = [makeStep({ isDefault: true, defaultVariantId: variantId, products: [product] })];
    const result = initDefaultProducts(steps, {});
    expect(result[0][variantId].isDefault).toBe(true);
  });

  it('finds product by StepProduct when not in products array', () => {
    const variantId = 'gid://shopify/ProductVariant/789';
    const stepProduct = { id: 'sp-1', title: 'Gift Box', variantId, price: 499 };
    const steps = [
      makeStep({
        isDefault: true,
        defaultVariantId: variantId,
        products: [],
        StepProduct: [stepProduct],
      }),
    ];
    const result = initDefaultProducts(steps, {});
    expect(result[0][variantId]).toBeDefined();
    expect(result[0][variantId].isDefault).toBe(true);
  });

  it('does not overwrite existing selections', () => {
    const variantId = 'gid://shopify/ProductVariant/111';
    const product = { id: 'prod-1', variantId, price: 100 };
    const steps = [makeStep({ isDefault: true, defaultVariantId: variantId, products: [product] })];
    const existingSelected: SelectedProducts = {
      0: { 'other-v': makeSelection('other-v') },
    };
    const result = initDefaultProducts(steps, existingSelected);
    // New default product added alongside existing
    expect(result[0][variantId]).toBeDefined();
    expect(result[0]['other-v']).toBeDefined();
  });

  it('handles multiple default steps at different positions', () => {
    const v1 = 'gid://shopify/ProductVariant/001';
    const v2 = 'gid://shopify/ProductVariant/002';
    const steps = [
      makeStep({ isDefault: true, defaultVariantId: v1, products: [{ id: 'p1', variantId: v1 }] }),
      makeStep({ name: 'Regular step' }),
      makeStep({ isDefault: true, defaultVariantId: v2, products: [{ id: 'p2', variantId: v2 }] }),
    ];
    const result = initDefaultProducts(steps, {});
    expect(result[0][v1]).toBeDefined();
    expect(result[2][v2]).toBeDefined();
    expect(result[1]).toBeUndefined();
  });
});
