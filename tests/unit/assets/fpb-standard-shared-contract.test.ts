// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FPB_STANDARD_TEMPLATE_CONFIG } = require('../../../app/assets/widgets/full-page/templates/standard.config.js');

describe('FPB Standard template config contract', () => {
  it('uses STANDARD as the only Standard preset identity', () => {
    expect(FPB_STANDARD_TEMPLATE_CONFIG.id).toBe('STANDARD');
    expect(FPB_STANDARD_TEMPLATE_CONFIG.presetId).toBe('STANDARD');
    expect(FPB_STANDARD_TEMPLATE_CONFIG.aliases).toEqual(['STANDARD']);
  });

  it('declares shared primitives for later renderer migration', () => {
    expect(FPB_STANDARD_TEMPLATE_CONFIG.productCard.mode).toBe('grid');
    expect(FPB_STANDARD_TEMPLATE_CONFIG.summary.mode).toBe('rows');
    expect(FPB_STANDARD_TEMPLATE_CONFIG.discountProgress.mode).toBe('stepped');
  });
});
