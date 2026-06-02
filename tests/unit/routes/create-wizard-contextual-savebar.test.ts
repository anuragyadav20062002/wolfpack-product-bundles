import fs from "node:fs";
import path from "node:path";

const routePath = path.join(
  process.cwd(),
  "app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx"
);

describe("creation wizard contextual save bar contract", () => {
  const source = fs.readFileSync(routePath, "utf8");

  it("renders an App Bridge SaveBar controlled by wizard dirty state", () => {
    expect(source).toContain('import { SaveBar } from "@shopify/app-bridge-react";');
    expect(source).toContain("open={isCurrentWizardPageDirty}");
    expect(source).toContain("handleSaveCurrentWizardPage");
    expect(source).toContain("handleDiscardCurrentWizardPage");
  });

  it("keeps Next as navigation only and gates unsaved wizard pages", () => {
    const handleNextStart = source.indexOf("const handleNext = useCallback(() => {");
    const handleNextEnd = source.indexOf("const enablePreviewGate", handleNextStart);
    const handleNextSource = source.slice(handleNextStart, handleNextEnd);

    expect(handleNextSource).toContain("promptSaveBarBeforeNavigation");
    expect(handleNextSource).not.toContain("configFetcher.submit");
    expect(handleNextSource).not.toContain("pricingFetcher.submit");
    expect(handleNextSource).not.toContain("assetsFetcher.submit");
  });
});
