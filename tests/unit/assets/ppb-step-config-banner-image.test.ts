// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageLayoutShellMethods } = require('../../../app/assets/widgets/product-page/methods/layout-shell-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageInpageRenderMethods } = require('../../../app/assets/widgets/product-page/methods/inpage-render-methods.js');

function createElement(tagName: string): any {
  const attributes: Record<string, string> = {};
  const children: any[] = [];
  const element = {
    tagName,
    className: '',
    style: {},
    children,
    isConnected: true,
    classList: {
      toggle() {},
    },
    setAttribute(name: string, value: string) {
      attributes[name] = value;
    },
    appendChild(child: any) {
      child.parentElement = element;
      children.push(child);
      return child;
    },
    prepend(child: any) {
      child.parentElement = element;
      children.unshift(child);
      return child;
    },
    set innerHTML(_value: string) {
      children.length = 0;
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
      const matches = (node: any) => {
        if (selector === 'img') return node.tagName === 'img';
        if (selector.startsWith('.')) {
          return String(node.className)
            .split(/\s+/)
            .includes(selector.slice(1));
        }
        return false;
      };
      const visit = (node: any): any => {
        if (matches(node)) return node;
        for (const child of node.children || []) {
          const match = visit(child);
          if (match) return match;
        }
        return null;
      };
      return children.map(visit).find(Boolean) ?? null;
    },
  };
  return element;
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

  it('keeps the banner image when the in-page renderer writes its final state', () => {
    const target = createElement('div');
    const shell = {
      ...ProductPageInpageRenderMethods,
      _createStepBannerImage: ProductPageLayoutShellMethods._createStepBannerImage,
      _inpageStepProductsLoaded: { 0: true },
      stepProductData: [[]],
      selectedBundle: {
        steps: [
          {
            name: 'Step 1',
            stepImage: 'https://cdn.example.test/step-config.png',
          },
        ],
      },
      activeInpageCategoryIndexes: {},
      _isProductPageCascadeTemplate: () => true,
      _isProductPageGridTemplate: () => false,
      _filterProductsForInpageCategory: () => [],
    };

    shell._renderInpageStepProducts(0, target);

    expect(target.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example.test/step-config.png');
  });
});

export {};
