// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  fullPageProductGridMethods,
} = require('../../../app/assets/widgets/full-page/methods/product-grid-methods.js');

describe('FPB Classic product loading spinner behavior', () => {
  function createContainer() {
    return {
      innerHTML: 'stale',
    };
  }

  function createWidget(preset: string, loadingGif?: string) {
    return {
      selectedBundle: loadingGif ? { loadingGif } : {},
      getFullPageDesignPreset: jest.fn(() => preset),
      showLoadingOverlay: jest.fn(),
      shouldUseProductGridSpinnerOnly: fullPageProductGridMethods.shouldUseProductGridSpinnerOnly,
      createProductGridLoadingState: fullPageProductGridMethods.createProductGridLoadingState,
      renderProductGridLoadingState: fullPageProductGridMethods.renderProductGridLoadingState,
    };
  }

  it('keeps Classic product loading spinner-only until product data is populated', () => {
    const widget = createWidget('CLASSIC');
    const container = createContainer();

    widget.renderProductGridLoadingState.call(widget, container);

    expect(container.innerHTML.length).toBe(0);
    expect(widget.showLoadingOverlay).toHaveBeenCalledWith(null);
  });

  it('preserves non-Classic product skeleton loading without a custom loading GIF', () => {
    const widget = createWidget('STANDARD');
    const container = createContainer();

    widget.renderProductGridLoadingState.call(widget, container);

    expect(container.innerHTML).toContain('skeleton-loading');
    expect(widget.showLoadingOverlay).not.toHaveBeenCalled();
  });

  it('preserves custom GIF loading overlay behavior for non-Classic product loading', () => {
    const widget = createWidget('STANDARD', 'https://cdn.example.com/loading.gif');
    const container = createContainer();

    widget.renderProductGridLoadingState.call(widget, container);

    expect(container.innerHTML).toContain('skeleton-loading');
    expect(widget.showLoadingOverlay).toHaveBeenCalledWith('https://cdn.example.com/loading.gif');
  });
});
