import { readFpbConfigureRouteFamilySource } from "./fpb-configure-route-source";

describe("Full Page Bundle Widget multilingual gate", () => {
  it("disables the Bundle Widget Multi Language action when locales are unavailable", () => {
    const source = readFpbConfigureRouteFamilySource();

    const widgetSectionIndex = source.indexOf('data-tour-target="fpb-bundle-widget"');
    const modalIndex = source.indexOf('openMultiLanguageModal("Bundle Widget"', widgetSectionIndex);
    const disabledIndex = source.indexOf("disabled={shopLocales.length === 0 || undefined}", widgetSectionIndex);

    expect(widgetSectionIndex).toBeGreaterThan(-1);
    expect(disabledIndex).toBeGreaterThan(widgetSectionIndex);
    expect(disabledIndex).toBeLessThan(modalIndex);
  });
});
