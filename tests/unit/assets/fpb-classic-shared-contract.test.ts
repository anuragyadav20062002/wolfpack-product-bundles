// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FPB_CLASSIC_TEMPLATE_CONFIG } = require('../../../app/assets/widgets/full-page/templates/classic.config.js');

describe('FPB Classic template config contract', () => {
  it('keeps the CLASSIC preset mapping', () => {
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.id).toBe('CLASSIC');
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.presetId).toBe('CLASSIC');
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.aliases).toEqual(expect.arrayContaining(['CLASSIC']));
  });

  it('declares shared primitives for later renderer migration', () => {
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.productCard.mode).toBe('grid');
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.summary.mode).toBe('slots');
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.discountProgress.mode).toBe('stepped');
  });
});
