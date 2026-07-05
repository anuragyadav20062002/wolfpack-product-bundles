// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FPB_HORIZONTAL_TEMPLATE_CONFIG } = require('../../../app/assets/widgets/full-page/templates/horizontal.config.js');

describe('FPB Horizontal template config contract', () => {
  it('keeps the HORIZONTAL preset mapping', () => {
    expect(FPB_HORIZONTAL_TEMPLATE_CONFIG.id).toBe('HORIZONTAL');
    expect(FPB_HORIZONTAL_TEMPLATE_CONFIG.presetId).toBe('HORIZONTAL');
    expect(FPB_HORIZONTAL_TEMPLATE_CONFIG.aliases).toEqual(expect.arrayContaining(['HORIZONTAL']));
  });
});
