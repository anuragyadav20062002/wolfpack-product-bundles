export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageRuntimeCartSettingsMethods } = require('../../../app/assets/widgets/full-page/methods/runtime-cart-settings-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageMobileSummaryMethods } = require('../../../app/assets/widgets/full-page/methods/mobile-summary-methods.js');

function makeRuntime(selectedBundle: Record<string, unknown>) {
  return {
    selectedBundle,
    _resolveText: (_key: string, fallback: string) => fallback,
    ...fullPageRuntimeCartSettingsMethods,
    ...fullPageMobileSummaryMethods,
  };
}

describe('FPB product card CTA mode', () => {
  it('uses persisted showTextOnPlusEnabled to render text button copy', () => {
    const runtime = makeRuntime({ showTextOnPlusEnabled: true });

    expect(runtime.resolveFullPageCardCtaMode()).toBe('text');
    expect(runtime.getProductAddButtonText()).toBe('Add +');
  });

  it('uses compact plus icon copy when showTextOnPlusEnabled is disabled', () => {
    const runtime = makeRuntime({ showTextOnPlusEnabled: false });

    expect(runtime.resolveFullPageCardCtaMode()).toBe('icon');
    expect(runtime.getProductAddButtonText()).toBe('+');
  });

  it('keeps direct showTextOnAddButton support for runtime payloads that already expose it', () => {
    const runtime = makeRuntime({ showTextOnAddButton: true });

    expect(runtime.resolveFullPageCardCtaMode()).toBe('text');
  });

  it('does not collapse Compact selected cards into a badge-only state', () => {
    const runtime = makeRuntime({
      bundleDesignPresetId: 'COMPACT',
      showTextOnPlusEnabled: false,
    });

    expect(runtime.resolveFullPageCardCtaMode()).toBe('icon');
    expect(runtime.usesSelectedQuantityBadge()).toBe(false);
  });

  it('does not collapse Standard icon selected cards into a badge-only state', () => {
    const runtime = makeRuntime({
      bundleDesignPresetId: 'STANDARD',
      showTextOnPlusEnabled: false,
    });

    expect(runtime.resolveFullPageCardCtaMode()).toBe('icon');
    expect(runtime.usesSelectedQuantityBadge()).toBe(false);
  });

  it('does not collapse Standard text selected cards into a badge-only state', () => {
    const runtime = makeRuntime({
      bundleDesignPresetId: 'STANDARD',
      showTextOnPlusEnabled: true,
    });

    expect(runtime.resolveFullPageCardCtaMode()).toBe('text');
    expect(runtime.usesSelectedQuantityBadge()).toBe(false);
  });

  it('falls back to Standard when no preset is present', () => {
    const runtime = makeRuntime({});

    expect(runtime.getFullPageDesignPreset()).toBe('STANDARD');
  });
});
