import { fullPageSearchCategoryMethods } from '../../../app/assets/widgets/full-page/methods/search-category-methods.js';

type Selector = string;

class FakeElement {
  public children: FakeElement[] = [];
  public parentElement: FakeElement | null = null;
  public dataset: Record<string, string> = {};
  public textContent = '';

  constructor(
    public tagName: string,
    public className = '',
    public id = '',
  ) {}

  appendChild(child: FakeElement) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
  }

  querySelector(selector: Selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector: Selector): FakeElement[] {
    const selectors = selector.split(',').map((part) => part.trim()).filter(Boolean);
    const matches: FakeElement[] = [];

    const visit = (node: FakeElement) => {
      if (selectors.some((candidate) => node.matches(candidate))) {
        matches.push(node);
      }
      node.children.forEach(visit);
    };

    this.children.forEach(visit);
    return matches;
  }

  closest(selector: Selector): FakeElement | null {
    const selectors = selector.split(',').map((part) => part.trim()).filter(Boolean);

    for (const candidate of selectors) {
      if (this.matches(candidate)) return this;
    }

    return this.parentElement?.closest(selector) || null;
  }

  matches(selector: Selector) {
    if (selector === 'section') return this.tagName.toLowerCase() === 'section';
    if (selector === 'h1') return this.tagName.toLowerCase() === 'h1';
    if (selector === 'h1.page-title') {
      return this.tagName.toLowerCase() === 'h1' && this.hasClass('page-title');
    }
    if (selector === '[id^="shopify-section"]') return this.id.startsWith('shopify-section');
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('.')) return this.hasClass(selector.slice(1));
    return false;
  }

  private hasClass(className: string) {
    return this.className.split(/\s+/).filter(Boolean).includes(className);
  }
}

function installDocument(root: FakeElement) {
  (global as unknown as { document: { querySelectorAll: (selector: Selector) => FakeElement[] } }).document = {
    querySelectorAll: (selector: Selector) => root.querySelectorAll(selector),
  };
}

describe('FPB loading page title hiding', () => {
  it('removes a plain host page H1 from the same Shopify section as the full-page widget', () => {
    const root = new FakeElement('main');
    const section = root.appendChild(new FakeElement('div', 'shopify-section section-wrapper', 'shopify-section-template-main'));
    const titleBlock = section.appendChild(new FakeElement('div', 'spacing-style text-block text-block--heading'));
    const title = titleBlock.appendChild(new FakeElement('h1'));
    title.textContent = '[Preview] Daily Essentials';
    const widget = section.appendChild(new FakeElement('div', 'bundle-widget-container bundle-widget-full-page', 'bundle-builder-app'));
    widget.dataset.bundleType = 'full_page';
    installDocument(root);

    fullPageSearchCategoryMethods.hidePageTitle.call({ container: widget });

    expect(root.querySelector('h1')).toBeNull();
    expect(titleBlock.parentElement).toBeNull();
    expect(section.querySelector('#bundle-builder-app')).toBe(widget);
  });
});
