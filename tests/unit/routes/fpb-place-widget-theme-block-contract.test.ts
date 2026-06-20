import { readFileSync } from "node:fs";
import { join } from "node:path";

const routeSource = readFileSync(
  join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/ConfigureBundleFlow.tsx"),
  "utf8"
);

describe("FPB Place Widget theme app block contract", () => {
  it("opens Theme Editor for the full-page app block instead of calling the no-op install endpoint", () => {
    expect(routeSource).toContain("template.isPage");
    expect(routeSource).toContain("? blockHandle");
    expect(routeSource).toContain("templateParam = template.isPage ? 'page' : template.handle");
    expect(routeSource).toContain("previewPath = template.isPage ? encodeURIComponent(`/pages/${template.handle}`) : ''");
    expect(routeSource).toContain("window.open(buildThemeEditorUrl(), '_blank')");
    expect(routeSource).not.toContain("fetch('/api/install-fpb-widget'");
    expect(routeSource).not.toContain("Widget installed!");
  });
});
