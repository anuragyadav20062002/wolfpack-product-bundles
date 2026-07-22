// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageInitialRenderMethods } = require('../../../app/assets/widgets/full-page/methods/initial-render-methods.js');

describe('FPB single-step storefront chrome', () => {
  const shouldRender = (steps: unknown) => (
    fullPageInitialRenderMethods.shouldRenderFullPageStepChrome.call({
      selectedBundle: { steps },
    })
  );

  it('suppresses multi-step chrome when only one shopper stage remains', () => {
    expect(shouldRender([{ id: 'step-1' }])).toBe(false);
  });

  it('retains multi-step chrome for two product stages', () => {
    expect(shouldRender([{ id: 'step-1' }, { id: 'step-2' }])).toBe(true);
  });

  it('retains multi-step chrome for a product stage followed by an add-on stage', () => {
    expect(shouldRender([{ id: 'step-1' }, { id: 'addon', isFreeGift: true }])).toBe(true);
  });

  it.each([undefined, null, {}])('suppresses chrome for malformed steps: %p', (steps) => {
    expect(shouldRender(steps)).toBe(false);
  });
});
