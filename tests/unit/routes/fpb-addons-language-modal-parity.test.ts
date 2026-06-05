import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page Add-ons language modal parity", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
    "utf8",
  );
  const modalSource = readFileSync(
    join(process.cwd(), "app/components/bundle-configure/MultiLanguageTextModal.tsx"),
    "utf8",
  );

  it("matches the reference Add-ons Multi Language modal variants", () => {
    const stepModalStart = routeSource.indexOf("const openAddonStepMultiLanguageModal");
    const sectionModalStart = routeSource.indexOf("const openAddonSectionMultiLanguageModal");
    const footerModalStart = routeSource.indexOf("const openAddonFooterMultiLanguageModal");
    const saveStart = routeSource.indexOf("const updateLocalizedTextOverride");

    expect(stepModalStart).toBeGreaterThan(-1);
    expect(sectionModalStart).toBeGreaterThan(stepModalStart);
    expect(footerModalStart).toBeGreaterThan(sectionModalStart);

    const stepModalSource = routeSource.slice(stepModalStart, sectionModalStart);
    const sectionModalSource = routeSource.slice(sectionModalStart, footerModalStart);
    const footerModalSource = routeSource.slice(footerModalStart, saveStart);

    expect(stepModalSource).toContain('setMultiLanguageLayout("rich")');
    expect(stepModalSource).toContain('fallback: "Step Text"');
    expect(stepModalSource).toContain('fallback: "Step Subtext"');

    expect(sectionModalSource).toContain('setMultiLanguageLayout("compact")');
    expect(sectionModalSource).toContain('label: "Add on Section title"');
    expect(sectionModalSource).toContain('label: `Tier#${index + 1} Title`');

    expect(footerModalSource).toContain('setMultiLanguageLayout("compact")');
    expect(footerModalSource).toContain('headingBefore: `Tier ${index + 1}`');
    expect(footerModalSource).toContain('label: "Message when rule not met"');
    expect(footerModalSource).toContain('label: "Success Message"');

    expect(routeSource).toContain("layout={multiLanguageLayout}");
    expect(routeSource).toContain('saveLabel={multiLanguageLayout === "compact" ? "Save and close" : undefined}');
  });

  it("keeps rich and compact modal bodies distinct", () => {
    expect(modalSource).toContain('layout?: "rich" | "compact"');
    expect(modalSource).toContain("const compactBody = (");
    expect(modalSource).toContain("const richBody = (");
    expect(modalSource).toContain('label="Select Language"');
    expect(modalSource).toContain('layout === "compact" ? compactBody : richBody');
    expect(modalSource).toContain('saveLabel ?? t("common.multiLanguage.saveAndClose")');
    expect(modalSource).toContain("field.headingBefore");
  });
});
