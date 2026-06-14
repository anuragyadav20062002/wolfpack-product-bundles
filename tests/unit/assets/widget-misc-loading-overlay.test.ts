// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageWidgetMiscMethods } = require('../../../app/assets/widgets/product-page/methods/widget-misc-methods.js');
/* eslint-disable jest-dom/prefer-to-have-style */

function createMockElement() {
  const classes = new Set();
  const attributes = new Map();
  return {
    style: {},
    dataset: {},
    children: [],
    className: '',
    classList: {
      add: (value) => {
        classes.add(value);
      },
      remove: (value) => {
        classes.delete(value);
      },
      contains: (value) => classes.has(value),
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    getAttribute(name) {
      return attributes.get(name);
    },
    querySelector(selector) {
      if (selector === '.bundle-loading-overlay') {
        const match = this.children.find((child) => child.className === 'bundle-loading-overlay');
        if (match) {
          return match;
        }
        return null;
      }
      return null;
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
  };
}

function createMockDocument() {
  return {
    createElement(tagName) {
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
    global.document = createMockDocument();
    global.getComputedStyle = () => ({ position: 'static' });
    const widget = { container };

    ProductPageWidgetMiscMethods.showLoadingOverlay.call(widget, null);

    const overlay = container.querySelector('.bundle-loading-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.minHeight).toBe('var(--bundle-ppb-loading-overlay-min-height, 180px)');
    expect(overlay.style.minWidth).toBe('var(--bundle-ppb-loading-overlay-min-width, 180px)');
    expect(container.style.position).toBe('relative');
    expect(overlay.className).toBe('bundle-loading-overlay');
  });
});
