export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageProductGridMethods } = require('../../../app/assets/widgets/full-page/methods/product-grid-methods.js');

class FakeElement {
  type = '';
  className = '';
  textContent = '';
  private children: FakeElement[] = [];

  get childElementCount() {
    return this.children.length;
  }

  appendChild(child: FakeElement) {
    this.children.push(child);
    this.textContent = this.children.map((item) => item.textContent).join('');
    return child;
  }

  addEventListener() {
    // The row click behavior is covered elsewhere; this test only needs render/no-render output.
  }
}

function makeContext(designPreset: 'STANDARD' | 'CLASSIC') {
  const entries = [
    { id: 'category-1', title: 'Category One' },
    { id: 'category-2', title: 'Category Two' },
  ];

  return {
    selectedBundle: {
      steps: [{ id: 'step-1' }],
    },
    getFullPageDesignPreset: () => designPreset,
    getStepCategoryTabEntries: () => entries,
    getActiveStepCategoryId: () => 'category-1',
    activateStepCategory: jest.fn(),
  };
}

describe('fullPageProductGridMethods.createCategorySectionRows', () => {
  beforeEach(() => {
    global.document = {
      createElement: () => new FakeElement(),
    } as unknown as Document;
  });

  it('does not render collapsed category rows for Standard', () => {
    const result = fullPageProductGridMethods.createCategorySectionRows.call(
      makeContext('STANDARD'),
      0,
      'after',
    );

    expect(result).toBeNull();
  });

  it('keeps collapsed category rows for Classic', () => {
    const result = fullPageProductGridMethods.createCategorySectionRows.call(
      makeContext('CLASSIC'),
      0,
      'after',
    );

    expect(result).not.toBeNull();
    expect(result?.childElementCount).toBe(1);
    expect(result?.textContent).toBe('Category Two');
  });
});
