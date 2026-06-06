import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page Add-ons step config controls parity", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
    "utf8",
  );
  const cssSource = readFileSync(
    join(process.cwd(), "app/styles/routes/full-page-bundle-configure.module.css"),
    "utf8",
  );

  it("uses dedicated Add-ons step config control markers", () => {
    [
      "addonsMediaFieldGrid",
      "addonsGiftBoxDefault",
      "addonsIconReplaceGroup",
      "addonsIconColumn",
      "addonsIconBox",
      "addonsStepTextGroup",
      "addonsStepNameGroup",
      "addonsStepTitleGroup",
      "addonsReplaceButton",
    ].forEach((marker) => {
      expect(routeSource).toContain(`fullPageBundleStyles.${marker}`);
      expect(cssSource).toContain(`.${marker}`);
    });
  });

  it("keeps the Add-ons step config controls in the EB order", () => {
    const sectionStart = routeSource.indexOf('{activeSection === "free_gift_addons" && (() => {');
    const sectionEnd = routeSource.indexOf('activeSection === "discount_pricing"', sectionStart);
    const section = routeSource.slice(sectionStart, sectionEnd);
    const stepCardStart = section.indexOf("Add-Ons and Gifting Step");
    const stepCardEnd = section.indexOf("Add-Ons with Bundles", stepCardStart);
    const stepCard = section.slice(stepCardStart, stepCardEnd);

    const expectedOrder = [
      "addonsIconReplaceGroup",
      "addonsIconBox",
      "addonsReplaceButton",
      "addonsStepTextGroup",
      "addonsStepNameGroup",
      "Step Name",
      "addonsStepTitleGroup",
      "Step Title",
    ];

    let cursor = -1;
    expectedOrder.forEach((marker) => {
      const next = stepCard.indexOf(marker, cursor + 1);
      expect(next).toBeGreaterThan(cursor);
      cursor = next;
    });
  });

  it("uses a gift-box SVG default for the Add-ons step icon upload area", () => {
    const sectionStart = routeSource.indexOf('{activeSection === "free_gift_addons" && (() => {');
    const sectionEnd = routeSource.indexOf('activeSection === "discount_pricing"', sectionStart);
    const section = routeSource.slice(sectionStart, sectionEnd);
    const uploadStart = section.indexOf("addonsIconReplaceGroup");
    const uploadSource = section.slice(uploadStart, uploadStart + 4200);

    expect(uploadStart).toBeGreaterThan(-1);
    expect(uploadSource).toContain("addonsGiftBoxDefault");
    expect(uploadSource).toContain("addonsIconReplaceGroup");
    expect(uploadSource).toContain("addonsIconColumn");
    expect(uploadSource).toContain("addonsIconBox");
    expect(uploadSource).toContain("addonsStepTextGroup");
    expect(uploadSource).toContain("addonsStepNameGroup");
    expect(uploadSource).toContain("addonsStepTitleGroup");
    expect(uploadSource).toContain("addonsReplaceButton");
    expect(uploadSource).toContain('<button');
    expect(uploadSource).toContain('type="button"');
    expect(uploadSource).toContain('viewBox="0 0 48 48"');
    expect(uploadSource).toContain('aria-hidden="true"');
    expect(uploadSource).not.toContain("iconPlaceholder}>Upload file");
    expect(uploadSource).not.toContain('icon="upload"');
    expect(uploadSource).toContain('alt="Add-ons step icon"');
    expect(uploadSource).toContain('setShowIconPickerForStep(prev => prev === "addon-direct"');
  });

  it("keeps the icon, Replace button, and text field sizing contract", () => {
    expect(cssSource).toContain("--addons-icon-control-width: 98px");
    expect(cssSource).toMatch(/\.addonsMediaFieldGrid\s*{[^}]*--addons-icon-control-width: 98px/s);
    expect(cssSource).toContain("width: var(--addons-icon-control-width)");
    expect(cssSource).toMatch(/\.addonsIconBox\s*{[^}]*height: 88px/s);
    expect(cssSource).toContain("width: 40px");
    expect(cssSource).toContain(".addonsReferenceStepCard .addonsMediaFieldGrid");
    expect(cssSource).toContain("grid-template-columns: var(--addons-icon-control-width) minmax(0, 1fr)");
    expect(cssSource).toContain(".addonsIconReplaceGroup");
    expect(cssSource).toContain(".addonsStepTextGroup");
    expect(cssSource).toContain(".addonsStepNameGroup");
    expect(cssSource).toContain(".addonsStepTitleGroup");
    expect(cssSource).toContain("flex-direction: column");
    expect(cssSource).toContain("gap: 8px");
    expect(cssSource).toContain("min-width: 0");
    expect(cssSource).toContain("@media (max-width: 480px)");
    expect(cssSource).toContain(".addonsReferenceStepCard .addonsMediaFieldGrid { grid-template-columns: 1fr; }");
  });

  it("matches the reference placement for the first Add-ons step icon card", () => {
    expect(cssSource).toMatch(/\.addonsMediaFieldGrid\s*{[^}]*--addons-icon-control-width: 98px/s);
    expect(cssSource).toMatch(/\.addonsIconBox\s*{[^}]*height: 88px/s);
    expect(cssSource).toMatch(/\.addonsIconReplaceGroup\s*{[^}]*gap: 6px/s);
    expect(cssSource).toMatch(/\.addonsReplaceButton\s*{[^}]*width: var\(--addons-icon-control-width\)/s);
    expect(cssSource).toMatch(/\.addonsStepTextGroup\s*{[^}]*gap: 8px/s);
    expect(cssSource).toMatch(/\.addonsReferenceStepCard \.addonsMediaFieldGrid\s*{[^}]*gap: 10px/s);
    expect(cssSource).toMatch(/\.addonsReferenceStepCard \.addonsMediaFieldGrid\s*{[^}]*align-items: start/s);
  });
});
