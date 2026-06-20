import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page Add-ons step language modal parity", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/ConfigureBundleFlow.tsx"),
    "utf8",
  );
  const modalSource = readFileSync(
    join(process.cwd(), "app/components/bundle-configure/MultiLanguageTextModal.tsx"),
    "utf8",
  );

  it("keeps the first Add-ons language modal on the rich Step modal contract", () => {
    const stepModalStart = routeSource.indexOf("const openAddonStepMultiLanguageModal");
    const sectionModalStart = routeSource.indexOf("const openAddonSectionMultiLanguageModal");

    expect(stepModalStart).toBeGreaterThan(-1);
    expect(sectionModalStart).toBeGreaterThan(stepModalStart);

    const stepModalSource = routeSource.slice(stepModalStart, sectionModalStart);

    expect(stepModalSource).toContain('type: "addon-step"');
    expect(stepModalSource).toContain('setMultiLanguageLayout("rich")');
    expect(stepModalSource).toContain('label: "Step Name"');
    expect(stepModalSource).toContain('fallback: "Step Text"');
    expect(stepModalSource).toContain('label: "Step Title"');
    expect(stepModalSource).toContain('fallback: "Step Subtext"');
  });

  it("keeps the shared modal rich body available for the first Add-ons modal", () => {
    expect(modalSource).toContain('layout?: "rich" | "compact"');
    expect(modalSource).toContain("const richBody = (");
    expect(modalSource).toContain('t("common.multiLanguage.translations")');
    expect(modalSource).toContain('t("common.multiLanguage.chooseLanguage")');
    expect(modalSource).toContain('t("common.multiLanguage.customText")');
    expect(modalSource).toContain('t("common.multiLanguage.textSettings")');
    expect(modalSource).toContain('saveLabel ?? t("common.multiLanguage.saveAndClose")');
  });
});
