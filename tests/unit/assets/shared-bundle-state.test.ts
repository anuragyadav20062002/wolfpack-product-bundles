import { readProductPageWidgetSources } from './widget-source-helpers';
import fs from 'node:fs';
import path from 'node:path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createBundleState } = require('../../../app/assets/widgets/shared/engine/create-bundle-state.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  getCurrentStep,
  getSelectedQuantity,
  getSelectedSubtotalCents,
} = require('../../../app/assets/widgets/shared/engine/bundle-selectors.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  addSelectedProduct,
  removeSelectedProduct,
} = require('../../../app/assets/widgets/shared/engine/bundle-actions.js');

describe('shared bundle state skeleton', () => {
  const bundle = {
    id: 'bundle-1',
    steps: [
      { id: 'step-1', name: 'First' },
      { id: 'step-2', name: 'Second' },
    ],
  };

  const stepProductData = [
    [
      { variantId: 'v1', price: 1000 },
      { variantId: 'v2', price: 2500 },
    ],
    [
      { variantId: 'v3', price: 3000 },
    ],
  ];

  it('creates state from bundle and selection data', () => {
    const state = createBundleState({
      bundle,
      selectedProducts: [{ v1: 2 }, { v3: 1 }],
      stepProductData,
      currentStepIndex: 1,
    });

    expect(state.bundle).toBe(bundle);
    expect(state.steps).toEqual(bundle.steps);
    expect(state.selectedProducts).toEqual([{ v1: 2 }, { v3: 1 }]);
    expect(state.currentStepIndex).toBe(1);
    expect(getCurrentStep(state)).toEqual(bundle.steps[1]);
  });

  it('counts selected quantity across steps', () => {
    const state = createBundleState({
      bundle,
      selectedProducts: [{ v1: 2 }, { v3: 1 }],
      stepProductData,
    });

    expect(getSelectedQuantity(state)).toBe(3);
  });

  it('computes selected subtotal from step product data', () => {
    const state = createBundleState({
      bundle,
      selectedProducts: [{ v1: 2 }, { v3: 1 }],
      stepProductData,
    });

    expect(getSelectedSubtotalCents(state)).toBe(5000);
  });

  it('adds selected products without mutating previous state', () => {
    const state = createBundleState({
      bundle,
      selectedProducts: [{ v1: 1 }, {}],
      stepProductData,
    });

    const next = addSelectedProduct(state, {
      stepIndex: 0,
      variantId: 'v1',
      quantity: 2,
    });

    expect(next.selectedProducts).toEqual([{ v1: 3 }, {}]);
    expect(state.selectedProducts).toEqual([{ v1: 1 }, {}]);
  });

  it('removes selected products without mutating previous state', () => {
    const state = createBundleState({
      bundle,
      selectedProducts: [{ v1: 2 }, { v3: 1 }],
      stepProductData,
    });

    const decremented = removeSelectedProduct(state, { stepIndex: 0, variantId: 'v1' });
    const removed = removeSelectedProduct(decremented, { stepIndex: 0, variantId: 'v1' });

    expect(decremented.selectedProducts).toEqual([{ v1: 1 }, { v3: 1 }]);
    expect(removed.selectedProducts).toEqual([{}, { v3: 1 }]);
    expect(state.selectedProducts).toEqual([{ v1: 2 }, { v3: 1 }]);
  });
});

describe('shared bundle state widget wiring', () => {
  it('wires selected count selector into FPB and PPB widgets without changing render paths', () => {
    const fullPageSource = fs.readFileSync(
      path.join(process.cwd(), 'app/assets/bundle-widget-full-page.js'),
      'utf8',
    );
    const productPageSource = fs.readFileSync(
      path.join(process.cwd(), 'app/assets/bundle-widget-product-page.js'),
      'utf8',
    );

    expect(fullPageSource).toContain('getSelectedQuantity');
    expect(fullPageSource).toContain('getSharedSelectedQuantity()');
    expect(productPageSource).toContain('getSelectedQuantity');
    expect(productPageSource).toContain('getSharedSelectedQuantity()');
  });
});
