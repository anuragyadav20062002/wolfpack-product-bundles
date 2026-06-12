import { fullPageResponsiveLayoutMethods } from "../../../app/assets/widgets/full-page/methods/responsive-layout-methods";

type FakeElement = {
  values: Record<string, string>;
  style: {
    setProperty: (property: string, value: string) => void;
  };
};

function createElement(values: Record<string, string> = {}): FakeElement {
  return {
    values,
    style: {
      setProperty(property, value) {
        values[property] = value;
      },
    },
  };
}

describe("FPB mobile portal theme vars", () => {
  const originalDocument = global.document;
  const originalGetComputedStyle = global.getComputedStyle;

  afterEach(() => {
    global.document = originalDocument;
    global.getComputedStyle = originalGetComputedStyle;
  });

  it("copies widget theme variables to body-mounted mobile elements", () => {
    const widgetRoot = createElement({
      "--bundle-button-bg": "#d12f7a",
      "--bundle-button-text-color": "#102030",
      "--bundle-sidebar-button-bg": "#0a84ff",
      "--bundle-sidebar-button-text": "#fff6d5",
    });
    const documentRoot = createElement();
    const sheet = createElement();
    const bar = createElement();

    global.document = { documentElement: documentRoot } as unknown as Document;
    global.getComputedStyle = ((element: FakeElement) => ({
      getPropertyValue: (property: string) => element.values[property] ?? "",
    })) as unknown as typeof getComputedStyle;

    fullPageResponsiveLayoutMethods._syncMobilePortalThemeVars.call(
      { container: widgetRoot },
      sheet,
      bar,
    );

    expect(sheet.values["--bundle-button-bg"]).toBe("#d12f7a");
    expect(sheet.values["--bundle-button-text-color"]).toBe("#102030");
    expect(sheet.values["--bundle-sidebar-button-bg"]).toBe("#0a84ff");
    expect(sheet.values["--bundle-sidebar-button-text"]).toBe("#fff6d5");
    expect(bar.values["--bundle-sidebar-button-bg"]).toBe("#0a84ff");
  });

  it("falls back to document root theme variables when widget values are absent", () => {
    const widgetRoot = createElement();
    const documentRoot = createElement({
      "--bundle-global-primary-button": "#111111",
      "--bundle-global-button-text": "#ffffff",
    });
    const sheet = createElement();

    global.document = { documentElement: documentRoot } as unknown as Document;
    global.getComputedStyle = ((element: FakeElement) => ({
      getPropertyValue: (property: string) => element.values[property] ?? "",
    })) as unknown as typeof getComputedStyle;

    fullPageResponsiveLayoutMethods._syncMobilePortalThemeVars.call(
      { container: widgetRoot },
      sheet,
    );

    expect(sheet.values["--bundle-global-primary-button"]).toBe("#111111");
    expect(sheet.values["--bundle-global-button-text"]).toBe("#ffffff");
  });
});
