import { readFpbConfigureRouteFamilySource } from "./fpb-configure-route-source";

const routeSource = readFpbConfigureRouteFamilySource().replace(/\s+/g, " ");

describe("FPB Place Widget theme app block contract", () => {
  it("opens Theme Editor for the full-page app block instead of calling the no-op install endpoint", () => {
    expect(routeSource).toContain("template.isPage");
    expect(routeSource).toContain("? flow.blockHandle");
    expect(routeSource).toContain(
      'templateParam = template.isPage ? "page" : template.handle',
    );
    expect(routeSource).toContain(
      'previewPath = template.isPage ? encodeURIComponent(`/pages/${template.handle}`) : ""',
    );
    expect(routeSource).toContain(
      'window.open(buildThemeEditorUrl(), "_blank")',
    );
    expect(routeSource).not.toContain("fetch('/api/install-fpb-widget'");
    expect(routeSource).not.toContain("Widget installed!");
  });
});
