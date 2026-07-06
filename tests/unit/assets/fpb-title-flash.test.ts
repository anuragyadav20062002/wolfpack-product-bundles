// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  fullPageInitialRenderMethods,
} = require('../../../app/assets/widgets/full-page/methods/initial-render-methods.js');

describe('FPB title flash prevention', () => {
  beforeEach(() => {
    (global as unknown as { document: { createElement: (tagName: string) => unknown } }).document = {
      createElement: (tagName: string) => ({
        tagName: tagName.toUpperCase(),
        className: '',
        innerHTML: '',
        style: {},
      }),
    };
  });

  function createContext(bundleType: string) {
    return {
      selectedBundle: {
        bundleType,
        name: 'Daily Essentials',
        description: 'Build a set',
      },
      config: {
        customTitle: null,
        customDescription: null,
        showDescription: true,
      },
    };
  }

  it('does not emit widget-owned bundle title markup for full-page bundles', () => {
    const header = fullPageInitialRenderMethods.createHeader.call(createContext('full_page'));

    expect(header.className).toBe('bundle-header');
    expect(header.style.display).toBe('none');
    expect(header.innerHTML).toBe('');
  });

  it('preserves title header markup for non-full-page contexts', () => {
    const header = fullPageInitialRenderMethods.createHeader.call(createContext('product_page'));

    expect(header.innerHTML).toContain('bundle-title');
    expect(header.innerHTML).toContain('Daily Essentials');
  });
});
