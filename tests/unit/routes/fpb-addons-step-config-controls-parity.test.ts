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
      "addonsIconColumn",
      "addonsIconBox",
      "addonsFieldsColumn",
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
      "addonsIconColumn",
      "addonsIconBox",
      "addonsReplaceButton",
      "addonsFieldsColumn",
      "Step Name",
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
    const uploadStart = section.indexOf("addonsIconColumn");
    const uploadSource = section.slice(uploadStart, uploadStart + 4200);

    expect(uploadStart).toBeGreaterThan(-1);
    expect(uploadSource).toContain("addonsGiftBoxDefault");
    expect(uploadSource).toContain("addonsIconColumn");
    expect(uploadSource).toContain("addonsIconBox");
    expect(uploadSource).toContain("addonsFieldsColumn");
    expect(uploadSource).toContain("addonsReplaceButton");
    expect(uploadSource).toContain('viewBox="0 0 48 48"');
    expect(uploadSource).toContain('aria-hidden="true"');
    expect(uploadSource).not.toContain("iconPlaceholder}>Upload file");
    expect(uploadSource).toContain('alt="Add-ons step icon"');
    expect(uploadSource).toContain('setShowIconPickerForStep(prev => prev === "addon-direct"');
  });

  it("keeps the icon, Replace button, and text field sizing contract", () => {
    expect(cssSource).toContain("--addons-icon-control-width: 96px");
    expect(cssSource).toContain("width: var(--addons-icon-control-width)");
    expect(cssSource).toContain("width: 40px");
    expect(cssSource).toContain("grid-template-columns: var(--addons-icon-control-width) minmax(0, 1fr)");
    expect(cssSource).toContain(".addonsFieldsColumn");
    expect(cssSource).toContain("min-width: 0");
  });
});
