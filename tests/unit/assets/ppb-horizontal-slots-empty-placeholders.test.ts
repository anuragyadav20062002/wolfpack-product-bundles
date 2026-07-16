// eslint-disable-next-line @typescript-eslint/no-require-imports
const { modalSlotTemplateMethods } = require('../../../app/assets/widgets/product-page/templates/modal-slot-template.js');

export {};

describe('PPB Horizontal Slots empty placeholders', () => {
  let originalDocument: Document | undefined;

  beforeEach(() => {
    originalDocument = global.document;
    global.document = createFakeDocument() as unknown as Document;
  });

  afterEach(() => {
    global.document = originalDocument as Document;
  });

  it.each([
    {
      name: 'renders every empty exact-match slot',
      step: { name: 'Step 1', conditionOperator: 'equal_to', conditionValue: 2 },
      selectedCount: 0,
      labels: ['Product 1', 'Product 2'],
    },
    {
      name: 'continues numbering after an existing selection',
      step: { name: 'Step 1', conditionOperator: 'equal_to', conditionValue: 2 },
      selectedCount: 1,
      labels: ['Product 2'],
    },
    {
      name: 'converts greater-than into the first valid quantity',
      step: { name: 'Step 1', conditionOperator: 'greater_than', conditionValue: 2 },
      selectedCount: 0,
      labels: ['Product 1', 'Product 2', 'Product 3'],
    },
    {
      name: 'keeps the next slot open when a minimum target is reached',
      step: { name: 'Step 1', conditionOperator: 'greater_than_or_equal_to', conditionValue: 2 },
      selectedCount: 2,
      labels: ['Product 3'],
    },
    {
      name: 'keeps the next slot open after selection exceeds a minimum target',
      step: { name: 'Step 1', conditionOperator: 'greater_than_or_equal_to', conditionValue: 2 },
      selectedCount: 3,
      labels: ['Product 4'],
    },
  ])('$name', ({ step, selectedCount, labels }) => {
    const target = createFakeElement('div');
    const widget = createWidget();

    widget._appendModalSlotEmptyCards(target, step, 0, selectedCount);

    expect(target.children.map((card: any) => card.children.at(-1)?.textContent)).toEqual(labels);
  });

  it('retains expanded slot capacity after selections are removed', () => {
    const widget = createWidget();
    const step = { name: 'Step 1', conditionOperator: 'greater_than_or_equal_to', conditionValue: 2 };

    widget._appendModalSlotEmptyCards(createFakeElement('div'), step, 0, 3);

    const target = createFakeElement('div');
    widget._appendModalSlotEmptyCards(target, step, 0, 0);

    expect(target.children.map((card: any) => card.children.at(-1)?.textContent)).toEqual([
      'Product 1',
      'Product 2',
      'Product 3',
      'Product 4',
    ]);
  });

  it('does not append an overflow slot when an exact target is reached', () => {
    const target = createFakeElement('div');
    const widget = createWidget();

    widget._appendModalSlotEmptyCards(
      target,
      { name: 'Step 2', conditionOperator: 'equal_to', conditionValue: 1 },
      1,
      1
    );

    expect(target.children).toEqual([]);
  });

  it('renders one empty slot when the global condition-based slot setting is disabled', () => {
    const target = createFakeElement('div');
    const widget = createWidget({
      controlsSettings: {
        activeControls: {
          displayEmptyStateBoxesBasedOnBundleCondition: false,
        },
      },
    });

    widget._appendModalSlotEmptyCards(
      target,
      { name: 'Step 1', conditionOperator: 'greater_than_or_equal_to', conditionValue: 2 },
      0,
      0
    );

    expect(target.children.map((card: any) => card.children.at(-1)?.textContent)).toEqual([
      'Product 1',
    ]);
  });

  it('keeps condition-sized slots when the global condition-based slot setting is enabled', () => {
    const target = createFakeElement('div');
    const widget = createWidget({
      controlsSettings: {
        activeControls: {
          displayEmptyStateBoxesBasedOnBundleCondition: true,
        },
      },
    });

    widget._appendModalSlotEmptyCards(
      target,
      { name: 'Step 1', conditionOperator: 'greater_than_or_equal_to', conditionValue: 2 },
      0,
      0
    );

    expect(target.children.map((card: any) => card.children.at(-1)?.textContent)).toEqual([
      'Product 1',
      'Product 2',
    ]);
  });
});

function createWidget(config = {}) {
  const widget = {
    selectedBundle: { renderFilledSlotsAsHorizontalStacked: true },
    config,
    _getProductPageTemplateType: () => 'PDP_MODAL',
    _getProductPageDesignPreset: () => 'MODAL',
    openModal: jest.fn(),
  } as any;
  Object.assign(widget, modalSlotTemplateMethods);
  return widget;
}

function createFakeDocument() {
  return {
    createElement: (tagName: string) => createFakeElement(tagName),
  };
}

function createFakeElement(tagName: string) {
  return {
    tagName: tagName.toUpperCase(),
    className: '',
    textContent: '',
    children: [] as any[],
    dataset: {} as Record<string, string>,
    style: { setProperty: jest.fn() },
    appendChild(child: any) {
      this.children.push(child);
      return child;
    },
    addEventListener: jest.fn(),
  };
}
