export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageValidationAddonsMethods } = require('../../../app/assets/widgets/full-page/methods/validation-addons-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageBoxSelectionSidebarMethods } = require('../../../app/assets/widgets/full-page/methods/box-selection-sidebar-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageMobileSummaryMethods } = require('../../../app/assets/widgets/full-page/methods/mobile-summary-methods.js');

function makeContext(steps: any[]) {
  return Object.assign(Object.create({
    ...fullPageValidationAddonsMethods,
    ...fullPageBoxSelectionSidebarMethods,
  }), {
    selectedBundle: { steps },
    getAllSelectedProductsData: () => [],
  });
}

class FakeElement {
  className = '';
  innerHTML = '';
  private children: FakeElement[] = [];

  get classList() {
    return {
      add: (...classNames: string[]) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        classNames.forEach((className) => classes.add(className));
        this.className = Array.from(classes).join(' ');
      },
    };
  }

  appendChild(child: FakeElement) {
    this.children.push(child);
    return child;
  }

  getChildren() {
    return this.children;
  }
}

const originalDocument = global.document;

beforeEach(() => {
  global.document = {
    createElement: () => new FakeElement(),
  } as unknown as Document;
});

afterEach(() => {
  global.document = originalDocument;
});

describe('fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount', () => {
  it('sums configured required quantities from step quantity conditions', () => {
    const count = fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount.call(
      makeContext([
        { enabled: true, conditionType: 'QUANTITY', conditionOperator: 'greater_than_or_equal_to', conditionValue: 2 },
        { enabled: true, conditionType: 'QUANTITY', conditionOperator: 'equal_to', conditionValue: 3 },
      ]),
    );

    expect(count).toBe(5);
  });

  it('falls back to one row when there is no explicit required-quantity condition', () => {
    const count = fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount.call(
      makeContext([
        { enabled: true, minQuantity: 1 },
        { enabled: false, minQuantity: 1, maxQuantity: 5 },
      ]),
    );

    expect(count).toBe(1);
  });

  it('keeps enough rows for selected products when selected count exceeds configured fallback', () => {
    const count = fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount.call(
      makeContext([
        { enabled: true, minQuantity: 2 },
      ]),
      4,
    );

    expect(count).toBe(4);
  });

  it('uses the active bundle quantity option before step quantity fallback', () => {
    const context = makeContext([
      { enabled: true, minQuantity: 1 },
    ]);
    context.selectedBundle.boxSelection = {
      isEnabled: true,
      rules: [{
        ruleId: 'box-3',
        boxQuantity: 3,
        boxLabel: 'Box of 3',
        boxSubtext: '$10 off',
        isDefaultSelected: true,
      }],
    };

    const count = fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount.call(context);

    expect(count).toBe(3);
  });
});

describe('fullPageBoxSelectionSidebarMethods.getClassicSidebarSlotCount', () => {
  it('uses the shared bundle-wide target when no box selection is active', () => {
    const context = makeContext([
      { enabled: true, conditionType: 'QUANTITY', conditionOperator: 'equal_to', conditionValue: 2 },
      { enabled: true, conditionType: 'QUANTITY', conditionOperator: 'equal_to', conditionValue: 3 },
    ]);

    const count = fullPageBoxSelectionSidebarMethods.getClassicSidebarSlotCount.call(
      context,
      [],
      context.selectedBundle.steps[0],
    );

    expect(count).toBe(5);
  });
});

describe('fullPageMobileSummaryMethods._renderCompactMobileSummarySlotTiles', () => {
  it('uses the shared summary target for mobile slot tiles', () => {
    const container = new FakeElement();

    fullPageMobileSummaryMethods._renderCompactMobileSummarySlotTiles.call({
      selectedBundle: {},
      getSummarySidebarMaxItemCount: () => 3,
      getSummaryProductDisplayTitle: () => '',
      _getSelectedProductImageSrc: () => '',
      _escapeHTML: (value: string) => value,
    }, container, [], { minQuantity: 1 }, 0);

    expect(container.getChildren()).toHaveLength(3);
  });
});

describe('fullPageValidationAddonsMethods.getSummarySidebarEmptyStateMode', () => {
  it('uses inline slots when Product Slots is enabled', () => {
    const mode = fullPageValidationAddonsMethods.getSummarySidebarEmptyStateMode.call({
      _shouldRenderProductSlots: () => true,
    });

    expect(mode).toBe('slots');
  });

  it('uses skeleton rows when Product Slots is disabled', () => {
    const mode = fullPageValidationAddonsMethods.getSummarySidebarEmptyStateMode.call({
      _shouldRenderProductSlots: () => false,
    });

    expect(mode).toBe('skeletons');
  });
});
