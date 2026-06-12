import { readFullPageWidgetSources } from './widget-source-helpers';

describe("bundle-widget-full-page explicit FPB selection fallback", () => {
  const source = readFullPageWidgetSources();

  it("selects the explicit full-page bundle id when generic bundle selection returns null", () => {
    expect(source).toContain("BundleDataManager.selectBundle(this.bundleData, this.config)");
    expect(source).toContain("this.bundleData?.[this.config.bundleId]?.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE");
    expect(source).toContain("this.selectedBundle = this.bundleData[this.config.bundleId]");
  });
});
