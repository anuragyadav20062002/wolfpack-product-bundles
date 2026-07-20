// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  getEnabledFullPageSteps,
} = require('../../../app/assets/widgets/full-page/methods/initial-render-methods.js');

describe('FPB disabled step storefront filtering', () => {
  it('keeps enabled and unspecified steps in persisted order', () => {
    const first = { id: 'first', enabled: true };
    const disabled = { id: 'disabled', enabled: false };
    const third = { id: 'third' };

    expect(getEnabledFullPageSteps([first, disabled, third])).toEqual([first, third]);
  });

  it('makes enabled steps adjacent when a middle step is disabled', () => {
    expect(getEnabledFullPageSteps([
      { id: 'step-1', enabled: true },
      { id: 'step-2', enabled: false },
      { id: 'step-3', enabled: true },
    ]).map((step: { id: string }) => step.id)).toEqual(['step-1', 'step-3']);
  });

  it('returns an empty step collection for invalid input', () => {
    expect(getEnabledFullPageSteps(null)).toEqual([]);
  });
});
