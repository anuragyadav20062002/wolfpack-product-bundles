/**
 * Test Spec: fpb-free-gift-addons-parity
 *
 * Ensures widget method composition preserves dynamic getters used by the
 * Free Gift & Add Ons storefront runtime.
 */

export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { applyMethodMixins } = require('../../../app/assets/widgets/shared/mixin-descriptors.js');

describe('applyMethodMixins', () => {
  it('preserves getter descriptors instead of flattening getter values', () => {
    const target: Record<string, unknown> = {};
    const source = {
      get freeGiftStepIndex() {
        return Array.isArray(this.steps)
          ? this.steps.findIndex((step: { isFreeGift?: boolean }) => step.isFreeGift === true)
          : -1;
      },
    };

    applyMethodMixins(target, source);

    const descriptor = Object.getOwnPropertyDescriptor(target, 'freeGiftStepIndex');
    expect(typeof descriptor?.get).toBe('function');

    const instance = Object.create(target) as { steps: Array<{ isFreeGift?: boolean }>; freeGiftStepIndex: number };
    instance.steps = [{}, { isFreeGift: true }];

    expect(instance.freeGiftStepIndex).toBe(1);
  });
});
