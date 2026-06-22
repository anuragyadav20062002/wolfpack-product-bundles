import { fullPageClearCartConfirmationMethods } from '../../../app/assets/widgets/full-page/methods/clear-cart-confirmation-methods.js';

type Listener = (event?: { key?: string; target?: FakeElement }) => void;

class FakeClassList {
  private values = new Set<string>();

  add(...classNames: string[]) {
    classNames.forEach((className) => this.values.add(className));
  }

  remove(...classNames: string[]) {
    classNames.forEach((className) => this.values.delete(className));
  }

  contains(className: string) {
    return this.values.has(className);
  }
}

class FakeElement {
  public className = '';
  public textContent = '';
  public innerHTML = '';
  public attributes = new Map<string, string>();
  public children: FakeElement[] = [];
  public parentElement: FakeElement | null = null;
  public classList = new FakeClassList();
  public listeners = new Map<string, Listener[]>();
  public focused = false;

  constructor(public tagName: string) {}

  append(...children: FakeElement[]) {
    children.forEach((child) => this.appendChild(child));
  }

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

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  getAttribute(name: string) {
    return this.attributes.get(name) || null;
  }

  addEventListener(type: string, listener: Listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: Listener) {
    const listeners = this.listeners.get(type) || [];
    this.listeners.set(type, listeners.filter((candidate) => candidate !== listener));
  }

  click() {
    this.dispatch('click', { target: this });
  }

  focus() {
    this.focused = true;
  }

  dispatch(type: string, event: { key?: string; target?: FakeElement } = {}) {
    (this.listeners.get(type) || []).forEach((listener) => listener(event));
  }

  querySelector(selector: string): FakeElement | null {
    if (!selector.startsWith('.')) return null;
    const className = selector.slice(1);
    return this.find((element) => element.className.split(' ').includes(className));
  }

  private find(predicate: (element: FakeElement) => boolean): FakeElement | null {
    for (const child of this.children) {
      if (predicate(child)) return child;
      const nested = child.find(predicate);
      if (nested) return nested;
    }
    return null;
  }
}

function installFakeDocument() {
  const body = new FakeElement('body');
  const documentListeners = new Map<string, Listener[]>();
  const fakeDocument = {
    body,
    createElement: (tagName: string) => new FakeElement(tagName),
    addEventListener: (type: string, listener: Listener) => {
      const listeners = documentListeners.get(type) || [];
      listeners.push(listener);
      documentListeners.set(type, listeners);
    },
    removeEventListener: (type: string, listener: Listener) => {
      const listeners = documentListeners.get(type) || [];
      documentListeners.set(type, listeners.filter((candidate) => candidate !== listener));
    },
    dispatch: (type: string, event: { key?: string } = {}) => {
      (documentListeners.get(type) || []).forEach((listener) => listener(event));
    },
  };

  (global as unknown as { document: typeof fakeDocument }).document = fakeDocument;
  return fakeDocument;
}

function createWidget() {
  return {
    selectedBundle: { steps: [{ id: 'one' }, { id: 'two' }] },
    selectedProducts: [{ a: { quantity: 1 } }, { b: { quantity: 2 } }],
    currentStepIndex: 1,
    searchQuery: 'rings',
    activeCollectionId: 'collection-1',
    compactMobileSummaryTrayExpanded: true,
    reRenderFullPage: jest.fn(),
    _clearCartConfirmationModal: null as FakeElement | null,
    _clearCartConfirmationKeydownHandler: null,
    ...fullPageClearCartConfirmationMethods,
  };
}

describe('fullPageClearCartConfirmationMethods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installFakeDocument();
  });

  it('opens a confirmation dialog without mutating selected products', () => {
    const widget = createWidget();
    const before = JSON.stringify(widget.selectedProducts);

    widget.showClearCartConfirmation();

    expect(document.body.children).toHaveLength(1);
    expect(widget._clearCartConfirmationModal?.getAttribute('aria-modal')).toBe('true');
    expect(JSON.stringify(widget.selectedProducts)).toBe(before);
  });

  it('closes from cancel without clearing selections', () => {
    const widget = createWidget();
    const before = JSON.stringify(widget.selectedProducts);

    widget.showClearCartConfirmation();
    widget._clearCartConfirmationModal?.querySelector('.wpb-clear-cart-confirmation__cancel')?.click();

    expect(document.body.children).toHaveLength(0);
    expect(JSON.stringify(widget.selectedProducts)).toBe(before);
    expect(widget.reRenderFullPage).not.toHaveBeenCalled();
  });

  it('clears selections only after confirmation', () => {
    const widget = createWidget();

    widget.showClearCartConfirmation();
    widget._clearCartConfirmationModal?.querySelector('.wpb-clear-cart-confirmation__confirm')?.click();

    expect(widget.selectedProducts).toEqual([{}, {}]);
    expect(widget.currentStepIndex).toBe(0);
    expect(widget.searchQuery).toBe('');
    expect(widget.activeCollectionId).toBeNull();
    expect(widget.compactMobileSummaryTrayExpanded).toBe(false);
    expect(widget.reRenderFullPage).toHaveBeenCalledTimes(1);
    expect(document.body.children).toHaveLength(0);
  });
});
