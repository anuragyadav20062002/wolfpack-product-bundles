// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageWidgetMiscMethods } = require('../../../app/assets/widgets/product-page/methods/widget-misc-methods.js');
/* eslint-disable jest-dom/prefer-to-have-style */

type MockElement = {
  style: Record<string, string>;
  dataset: Record<string, string>;
  children: MockElement[];
  className: string;
  tagName?: string;
  removed?: boolean;
  offsetHeight?: number;
  classList: {
    add: (value: string) => void;
    remove: (value: string) => void;
    contains: (value: string) => boolean;
  };
  setAttribute: (name: string, value: string) => void;
  getAttribute: (name: string) => string | undefined;
  querySelector: (selector: string) => MockElement | null;
  appendChild: (child: MockElement) => MockElement;
  remove?: () => void;
};

function createMockElement(): MockElement {
  const classes = new Set<string>();
  const attributes = new Map<string, string>();
  return {
    style: {},
    dataset: {},
    children: [],
    className: '',
    classList: {
      add: (value: string) => {
        classes.add(value);
      },
      remove: (value: string) => {
        classes.delete(value);
      },
      contains: (value: string) => classes.has(value),
    },
    setAttribute(name: string, value: string) {
      attributes.set(name, value);
    },
    getAttribute(name: string) {
      return attributes.get(name);
    },
    querySelector(selector: string) {
      if (selector === '.bundle-loading-overlay') {
        const match = this.children.find((child: MockElement) => child.className === 'bundle-loading-overlay');
        if (match) {
          return match;
        }
        return null;
      }
      return null;
    },
    appendChild(child: MockElement) {
      this.children.push(child);
      return child;
    },
  };
}

function createMockDocument() {
  return {
    createElement(tagName: string) {
      const element = createMockElement();
      element.tagName = tagName;
      element.remove = () => {
        element.removed = true;
      };
      element.offsetHeight = 0;
      return element;
    },
    getComputedStyle: () => ({ position: 'static' }),
    querySelector: () => null,
  };
}

describe('ProductPageWidgetMiscMethods loading overlay', () => {
  it('adds a loading overlay with a minimum loading area for zero-height containers', () => {
    const container = createMockElement();
    global.document = createMockDocument() as unknown as Document;
    global.getComputedStyle = (() => ({ position: 'static' })) as unknown as typeof global.getComputedStyle;
    const widget = { container };

    ProductPageWidgetMiscMethods.showLoadingOverlay.call(widget, null);

    const overlay = container.querySelector('.bundle-loading-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay?.style.minHeight).toBe('var(--bundle-ppb-loading-overlay-min-height, 180px)');
    expect(overlay?.style.minWidth).toBe('var(--bundle-ppb-loading-overlay-min-width, 180px)');
    expect(container.style.position).toBe('relative');
  });
});
