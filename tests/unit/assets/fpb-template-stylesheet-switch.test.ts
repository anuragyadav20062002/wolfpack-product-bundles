export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageRuntimeCartSettingsMethods } = require('../../../app/assets/widgets/full-page/methods/runtime-cart-settings-methods.js');

class FakeLink {
  rel = 'stylesheet';
  href: string;
  disabled = false;
  dataset: Record<string, string> = {};
  sheet = {};

  constructor(href: string, templateKey: string) {
    this.href = href;
    this.dataset.wpbFpbTemplateCss = templateKey;
  }

  getAttribute(name: string) {
    if (name === 'href') return this.href;
    if (name === 'rel') return this.rel;
    return null;
  }

  addEventListener(_eventName: string, callback: () => void) {
    callback();
  }
}

function installDocument(links: FakeLink[]) {
  (global as any).HTMLLinkElement = FakeLink;
  (global as any).document = {
    querySelectorAll: (selector: string) => {
      if (selector === 'link[rel="stylesheet"]') return links;
      return [];
    },
    createElement: (tagName: string) => {
      if (tagName !== 'link') throw new Error(`Unexpected element: ${tagName}`);
      const link = new FakeLink('', '');
      links.push(link);
      return link;
    },
    head: {
      appendChild: (link: FakeLink) => link,
    },
  };
}

function makeRuntime() {
  return {
    _fpbTemplateStylesheetPromises: new Map(),
    ...fullPageRuntimeCartSettingsMethods,
  };
}

describe('FPB preset stylesheet switching', () => {
  beforeEach(() => {
    (global as any).window = {
      __WOLFPACK_FPB_TEMPLATE_CSS_URLS__: {
        STANDARD: 'https://cdn.example.test/bundle-widget-full-page-standard.css',
        CLASSIC: 'https://cdn.example.test/bundle-widget-full-page-classic.css',
      },
    };
  });

  afterEach(() => {
    delete (global as any).document;
    delete (global as any).window;
    delete (global as any).HTMLLinkElement;
  });

  it('disables a stale Standard stylesheet after Classic is active', async () => {
    const standard = new FakeLink('https://cdn.example.test/bundle-widget-full-page-standard.css', 'STANDARD');
    const classic = new FakeLink('https://cdn.example.test/bundle-widget-full-page-classic.css', 'CLASSIC');
    installDocument([standard, classic]);

    await makeRuntime().ensureFullPageTemplateStylesheet('CLASSIC');

    expect(classic.disabled).toBe(false);
    expect(standard.disabled).toBe(true);
  });

  it('re-enables Standard when Standard becomes active again', async () => {
    const standard = new FakeLink('https://cdn.example.test/bundle-widget-full-page-standard.css', 'STANDARD');
    const classic = new FakeLink('https://cdn.example.test/bundle-widget-full-page-classic.css', 'CLASSIC');
    standard.disabled = true;
    installDocument([standard, classic]);

    await makeRuntime().ensureFullPageTemplateStylesheet('STANDARD');

    expect(standard.disabled).toBe(false);
    expect(classic.disabled).toBe(true);
  });
});
