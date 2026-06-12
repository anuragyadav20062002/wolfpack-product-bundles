import fs from "fs";
import path from "path";

const routePaths = [
  "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx",
  "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx",
];

describe("bundle configure admin save lock wiring", () => {
  it.each(routePaths)("%s blocks config edits while save fetcher is running", (routePath) => {
    const source = fs.readFileSync(path.join(process.cwd(), routePath), "utf8");

    expect(source).toContain("handleAdminSaveLockedEvent");
    expect(source).toContain("void saveBarRef.current?.show?.()");
    expect(source).toContain('const isSaveInFlight = fetcher.state !== "idle";');
    expect(source).toContain("blockConfigurationChangeWhileSaving");
    expect(source).toContain("onBeforeInputCapture={blockConfigurationChangeWhileSaving}");
    expect(source).toContain("onChangeCapture={blockConfigurationChangeWhileSaving}");
    expect(source).toContain("onPointerDownCapture={blockConfigurationChangeWhileSaving}");
  });
});
