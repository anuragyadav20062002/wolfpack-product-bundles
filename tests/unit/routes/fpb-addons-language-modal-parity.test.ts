import { readFileSync } from "node:fs";
import { join } from "node:path";

import { readFpbConfigureRouteFamilySource } from "./fpb-configure-route-source";

describe("Full Page Add-ons compact language modal parity", () => {
  const routeSource = readFpbConfigureRouteFamilySource();
  const normalizedRouteSource = routeSource.replace(/\s+/g, " ");
  const modalSource = readFileSync(
    join(
      process.cwd(),
      "app/components/bundle-configure/MultiLanguageTextModal.tsx",
    ),
    "utf8",
  );

  it("matches the reference compact Add-ons Multi Language modal variants", () => {
    const sectionModalStart = routeSource.indexOf(
      "const openAddonSectionMultiLanguageModal",
    );
    const footerModalStart = routeSource.indexOf(
      "const openAddonFooterMultiLanguageModal",
    );
    const saveStart = routeSource.indexOf("const updateLocalizedTextOverride");

    expect(sectionModalStart).toBeGreaterThan(-1);
    expect(footerModalStart).toBeGreaterThan(sectionModalStart);

    const sectionModalSource = routeSource.slice(
      sectionModalStart,
      footerModalStart,
    );
    const footerModalSource = routeSource.slice(footerModalStart, saveStart);
    const indexInterpolationToken = ["$", "{index + 1}"].join("");
    const tierTitleToken = [
      "label: `Tier#",
      indexInterpolationToken,
      " Title`",
    ].join("");
    const footerTierHeadingToken = [
      "headingBefore: `Tier ",
      indexInterpolationToken,
      "`",
    ].join("");

    expect(sectionModalSource).toContain('setMultiLanguageLayout("compact")');
    expect(sectionModalSource).toContain('label: "Add on Section title"');
    expect(sectionModalSource).toContain(tierTitleToken);

    expect(footerModalSource).toContain('setMultiLanguageLayout("compact")');
    expect(footerModalSource).toContain(footerTierHeadingToken);
    expect(footerModalSource).toContain('label: "Message when rule not met"');
    expect(footerModalSource).toContain('label: "Success Message"');

    expect(normalizedRouteSource).toContain("layout={multiLanguageLayout}");
    expect(normalizedRouteSource).toContain(
      'saveLabel={ multiLanguageLayout === "compact" ? "Save and close" : undefined }',
    );
  });

  it("keeps compact modal body support for section and footer modals", () => {
    expect(modalSource).toContain('layout?: "rich" | "compact"');
    expect(modalSource).toContain("const compactBody = (");
    expect(modalSource).toContain('label="Select Language"');
    expect(modalSource).toContain(
      'layout === "compact" ? compactBody : richBody',
    );
    expect(modalSource).toContain(
      'saveLabel ?? t("common.multiLanguage.saveAndClose")',
    );
    expect(modalSource).toContain("field.headingBefore");
  });
});
