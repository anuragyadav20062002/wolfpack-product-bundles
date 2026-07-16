// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageLayoutShellMethods } = require('../../../app/assets/widgets/product-page/methods/layout-shell-methods.js');

function createElement(tagName: string): any {
  const attributes: Record<string, string> = {};
  const children: any[] = [];
  return {
    tagName,
    className: '',
    style: {},
    appendChild(child: any) {
      children.push(child);
      return child;
    },
    set src(value: string) {
      attributes.src = value;
    },
    set alt(value: string) {
      attributes.alt = value;
    },
    getAttribute(name: string) {
      return attributes[name];
    },
    querySelector(selector: string) {
      if (selector !== 'img') return null;
      return children.find((child) => child.tagName === 'img') ?? null;
    },
  };
}

describe('PPB Step Config banner image', () => {
  const previousDocument = global.document;

  beforeEach(() => {
    (global as any).document = { createElement };
  });

  afterEach(() => {
    (global as any).document = previousDocument;
  });

  it('creates a banner image from the public stepImage runtime key', () => {
    const banner = ProductPageLayoutShellMethods._createStepBannerImage({
      name: 'Step 1',
      stepImage: 'https://cdn.example.test/step-config.png',
    });

    const image = banner?.querySelector('img');
    expect(image?.getAttribute('src')).toBe('https://cdn.example.test/step-config.png');
    expect(image?.getAttribute('alt')).toBe('Step 1');
  });

  it('keeps bannerImageUrl as a fallback image source', () => {
    const banner = ProductPageLayoutShellMethods._createStepBannerImage({
      name: 'Step 2',
      bannerImageUrl: 'https://cdn.example.test/banner.png',
    });

    expect(banner?.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example.test/banner.png');
  });

  it('does not create a banner image without an image source', () => {
    expect(ProductPageLayoutShellMethods._createStepBannerImage({ name: 'Step 3' })).toBeNull();
  });
});

export {};
