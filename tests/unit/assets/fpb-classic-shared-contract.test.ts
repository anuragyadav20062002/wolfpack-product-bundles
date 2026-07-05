// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FPB_CLASSIC_TEMPLATE_CONFIG } = require('../../../app/assets/widgets/full-page/templates/classic.config.js');

describe('FPB Classic template config contract', () => {
  it('keeps the CLASSIC preset mapping', () => {
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.id).toBe('CLASSIC');
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.presetId).toBe('CLASSIC');
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.aliases).toEqual(expect.arrayContaining(['CLASSIC']));
  });
});
