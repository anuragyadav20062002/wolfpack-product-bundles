import { openThemeEditorInNewTab } from "../../../app/lib/theme-editor-navigation.client";

describe("openThemeEditorInNewTab", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("opens the Theme Editor in a new tab", () => {
    const open = jest.fn();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { open },
    });

    openThemeEditorInNewTab("https://shop.myshopify.com/admin/themes/1/editor");

    expect(open).toHaveBeenCalledWith(
      "https://shop.myshopify.com/admin/themes/1/editor",
      "_blank",
      "noopener,noreferrer",
    );
  });
});
