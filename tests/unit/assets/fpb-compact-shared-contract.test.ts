// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FPB_COMPACT_TEMPLATE_CONFIG } = require('../../../app/assets/widgets/full-page/templates/compact.config.js');

describe('FPB Compact template config contract', () => {
  it('keeps the COMPACT preset mapping', () => {
    expect(FPB_COMPACT_TEMPLATE_CONFIG.id).toBe('COMPACT');
    expect(FPB_COMPACT_TEMPLATE_CONFIG.presetId).toBe('COMPACT');
    expect(FPB_COMPACT_TEMPLATE_CONFIG.aliases).toEqual(expect.arrayContaining(['COMPACT']));
  });

  it('declares shared primitives for later renderer migration', () => {
    expect(FPB_COMPACT_TEMPLATE_CONFIG.productCard.mode).toBe('compact');
    expect(FPB_COMPACT_TEMPLATE_CONFIG.summary.mode).toBe('compactSlots');
    expect(FPB_COMPACT_TEMPLATE_CONFIG.discountProgress.mode).toBe('stepped');
  });
});
