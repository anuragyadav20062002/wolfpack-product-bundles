// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  resolveProductPageModalStepPosition,
} = require('../../../app/assets/widgets/product-page/methods/modal-methods.js');

export {};

describe('PPB modal step rail', () => {
  it.each([
    [0, 0, 3, 'current'],
    [1, 0, 3, 'next'],
    [2, 0, 3, 'hidden'],
    [0, 1, 3, 'previous'],
    [1, 1, 3, 'current'],
    [2, 1, 3, 'next'],
    [0, 2, 3, 'hidden'],
    [1, 2, 3, 'previous'],
    [2, 2, 3, 'current'],
  ])(
    'resolves step %i around current step %i of %i as %s',
    (stepIndex, currentStepIndex, stepCount, expected) => {
      expect(resolveProductPageModalStepPosition({
        stepIndex,
        currentStepIndex,
        stepCount,
      })).toBe(expected);
    },
  );

  it.each([
    [-1, 0, 3],
    [3, 0, 3],
    [0, -1, 3],
    [0, 3, 3],
    [0, 0, 0],
  ])('hides invalid rail input (%i, %i, %i)', (stepIndex, currentStepIndex, stepCount) => {
    expect(resolveProductPageModalStepPosition({
      stepIndex,
      currentStepIndex,
      stepCount,
    })).toBe('hidden');
  });
});
