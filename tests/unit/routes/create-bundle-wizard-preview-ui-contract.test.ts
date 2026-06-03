/**
 * UI contract for the CREATE wizard's Preview button.
 *
 * Issue: feedback-jun26-2
 *
 * The Preview button must appear in the top page header next to "How to configure?".
 * The loader must expose the data the preview handler needs (shop,
 * themeEditorUrl, product/page handles).
 */
import fs from "node:fs";
import path from "node:path";

const routePath = path.join(
  process.cwd(),
  "app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx"
);
const source = fs.readFileSync(routePath, "utf8");

describe("CREATE wizard loader contract for Preview", () => {
  it("exposes shop, themeEditorUrl, and bundle handles in the loader return", () => {
    const loaderReturn = source.slice(source.indexOf("return json("), source.indexOf("export const action"));
    expect(loaderReturn).toContain("shop:");
    expect(loaderReturn).toContain("themeEditorUrl");
    expect(loaderReturn).toContain("shopifyProductHandle");
    expect(loaderReturn).toContain("shopifyPageHandle");
  });
});

describe("CREATE wizard Preview handler", () => {
  it("imports the buildWizardPreviewUrl helper", () => {
    expect(source).toMatch(/from\s+["'][^"']*lib\/wizard-preview-url["']/);
    expect(source).toContain("buildWizardPreviewUrl");
  });

  it("defines a handleWizardPreview callback", () => {
    expect(source).toContain("handleWizardPreview");
  });

  it("gates preview via the useEnablePreviewGate hook so the modal triggers when the app embed is off", () => {
    expect(source).toContain("useEnablePreviewGate");
    expect(source).toMatch(/enablePreviewGate\.requestPreview\(/);
  });
});

describe("CREATE wizard header Preview button", () => {
  it("renders Preview next to the How to configure action in the page header", () => {
    const headerStart = source.indexOf("className={styles.pageHeader}");
    expect(headerStart).toBeGreaterThan(-1);
    const headerBlock = source.slice(headerStart, source.indexOf("{/* Step indicator", headerStart));
    expect(headerBlock).toContain("How to configure?");
    expect(headerBlock).toContain("handleWizardPreview");
    expect(headerBlock).toContain("Preview");
  });

  it("does not render Preview in wizard footers or StepSummary", () => {
    const footerBlocks = source.split('className={styles.wizardFooter}').slice(1);
    expect(footerBlocks.length).toBeGreaterThanOrEqual(3);
    for (const chunk of footerBlocks) {
      const upToClose = chunk.slice(0, chunk.indexOf("</div>"));
      expect(upToClose).not.toMatch(/handleWizardPreview/);
      expect(upToClose).not.toMatch(/Preview/);
    }
    expect(source).not.toContain("onPreview={handleWizardPreview}");
  });

  it("does not leave the legacy placeholder onPreview that only toasted", () => {
    // The old StepSummary onPreview just did localStorage + toast with no URL open.
    // It must now route through handleWizardPreview (which internally handles the toast/embed gate).
    const offendingPattern = /onPreview=\{\(\)\s*=>\s*\{\s*if\s*\(typeof window/;
    expect(source).not.toMatch(offendingPattern);
  });
});
