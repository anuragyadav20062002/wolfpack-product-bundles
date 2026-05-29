/**
 * UI contract for the CREATE wizard's Preview button.
 *
 * Issue: feedback-jun26-2
 *
 * The Preview button must appear in each of the four `.wizardFooter` blocks
 * (one per wizardStep value 1..4). The loader must expose the data the
 * preview handler needs (shop, themeEditorUrl, product/page handles).
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

describe("CREATE wizard footer Preview button", () => {
  it("renders a Preview s-button inside the wizard footer at least four times (one per wizardStep branch)", () => {
    // We assert that every .wizardFooter block contains both a Preview button and the existing Back/Next buttons.
    const footerBlocks = source.split('className={styles.wizardFooter}');
    // First chunk is the prefix before the first occurrence — exclude it. Each subsequent chunk corresponds to one footer.
    const footerChunks = footerBlocks.slice(1);
    expect(footerChunks.length).toBeGreaterThanOrEqual(4);

    for (const chunk of footerChunks) {
      // Each footer must contain Back, Next/Finish, and the new Preview wiring.
      const upToClose = chunk.slice(0, chunk.indexOf("</div>"));
      expect(upToClose).toMatch(/handleBack/);
      expect(upToClose).toMatch(/handleNext/);
      expect(upToClose).toMatch(/handleWizardPreview/);
      expect(upToClose).toMatch(/Preview/);
    }
  });

  it("does not leave the legacy placeholder onPreview that only toasted", () => {
    // The old StepSummary onPreview just did localStorage + toast with no URL open.
    // It must now route through handleWizardPreview (which internally handles the toast/embed gate).
    const offendingPattern = /onPreview=\{\(\)\s*=>\s*\{\s*if\s*\(typeof window/;
    expect(source).not.toMatch(offendingPattern);
  });
});
