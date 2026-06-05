import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page Add-ons Admin layout", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
    "utf8",
  );
  const cssSource = readFileSync(
    join(process.cwd(), "app/styles/routes/full-page-bundle-configure.module.css"),
    "utf8",
  );

  it("uses dedicated visual markers for the evidence-backed Add-ons card", () => {
    [
      "addonsReferenceStepCard",
      "addonsCard",
      "addonsReferenceSwitch",
      "addonsHeaderLine",
      "addonsHeaderActions",
      "addonsLanguageButton",
      "addonsTierCard",
      "addonsProductSelectionRow",
      "addonsSelectedButton",
      "addonsDiscountGrid",
      "addonsTierRules",
      "addonsTierButton",
      "addonsFooterCard",
      "addonsTierHeader",
      "addonsTierHeaderActive",
      "addonsTierTitle",
      "addonsTierDeleteButton",
    ].forEach((marker) => {
      expect(routeSource).toContain(`fullPageBundleStyles.${marker}`);
      expect(cssSource).toContain(`.${marker}`);
    });
  });

  it("keeps the Add-ons setup action wired without competitor references", () => {
    const sectionStart = routeSource.indexOf('{activeSection === "free_gift_addons" && (() => {');
    const sectionEnd = routeSource.indexOf('activeSection === "discount_pricing"', sectionStart);
    const section = routeSource.slice(sectionStart, sectionEnd);

    expect(section).toContain("ADDONS_HELP_ARTICLE_URL");
    expect(section).toContain("How to setup?");
    expect(section).toContain("window.open(ADDONS_HELP_ARTICLE_URL");
    expect(routeSource).toContain('const ADDONS_HELP_ARTICLE_URL = "https://wolfpackapps.com";');
  });

  it("keeps the reference Add-ons control order in the Admin section", () => {
    const sectionStart = routeSource.indexOf('{activeSection === "free_gift_addons" && (() => {');
    expect(sectionStart).toBeGreaterThan(-1);
    const sectionEnd = routeSource.indexOf('activeSection === "discount_pricing"', sectionStart);
    expect(sectionEnd).toBeGreaterThan(sectionStart);
    const section = routeSource.slice(sectionStart, sectionEnd);

    const expectedOrder = [
      "Add-Ons and Gifting Step",
      "Step Name",
      "Step Title",
      "Add-Ons with Bundles",
      "How to setup?",
      "Enable customers to add extra items",
      "Add on Section title",
      "addonsTierCard",
      "Add Products",
      "addonsSelectedButton",
      "Display Variants as Individual Products",
      "Discount Based on",
      "Discount on Add-ons",
      "Tier Rules",
      "Add Add Ons Tier",
      "Footer Messaging",
      "Message when rule not met",
      "Success Message",
    ];

    let cursor = -1;
    expectedOrder.forEach((marker) => {
      const next = section.indexOf(marker, cursor + 1);
      expect(next).toBeGreaterThan(cursor);
      cursor = next;
    });
  });

  it("wires add-on tier rule contract hooks", () => {
    expect(routeSource).toContain("getAddonConditions = (tier: any) =>");
    expect(routeSource).toContain("addAddonTierCondition");
    expect(routeSource).toContain("removeAddonTierCondition");
    expect(routeSource).toContain("updateAddonTierCondition");
    expect(routeSource).toContain("createDefaultAddonTierCondition");
    expect(routeSource).toContain('condition: "lessThanOrEqualTo"');
    expect(routeSource).toContain('value: "1"');
    expect(routeSource).toContain("value: String(condition?.value ?? \"1\")");
    expect(routeSource).toContain("conditions: Array.isArray(tier?.conditions)");
  });

  it("dirties the SaveBar from Add-ons footer messaging edits", () => {
    const footerStart = routeSource.indexOf("Footer Messaging");
    expect(footerStart).toBeGreaterThan(-1);
    const footerSource = routeSource.slice(footerStart, routeSource.indexOf('activeSection === "discount_pricing"', footerStart));

    const messageNotMetStart = footerSource.indexOf("discountText: value");
    const successMessageStart = footerSource.indexOf("successMessage: value");
    expect(messageNotMetStart).toBeGreaterThan(-1);
    expect(successMessageStart).toBeGreaterThan(-1);

    expect(footerSource.slice(messageNotMetStart, messageNotMetStart + 260)).toContain("markAsDirty();");
    expect(footerSource.slice(successMessageStart, successMessageStart + 260)).toContain("markAsDirty();");
  });

  it("wires Add-ons scoped language buttons instead of disabled placeholders", () => {
    const sectionStart = routeSource.indexOf('{activeSection === "free_gift_addons" && (() => {');
    const sectionEnd = routeSource.indexOf('activeSection === "discount_pricing"', sectionStart);
    const section = routeSource.slice(sectionStart, sectionEnd);

    expect(section).toContain("openAddonStepMultiLanguageModal");
    expect(section).toContain("openAddonSectionMultiLanguageModal");
    expect(section).toContain("openAddonFooterMultiLanguageModal");
    expect(section).not.toContain('className={fullPageBundleStyles.addonsLanguageButton} disabled');
    expect(routeSource).toContain('type: "addon-step"');
    expect(routeSource).toContain('type: "addon-section"');
    expect(routeSource).toContain('type: "addon-footer"');
  });

  it("uses Add-ons-specific variables in the footer variables modal", () => {
    expect(routeSource).toContain("ADDON_TEMPLATE_VARIABLES");
    expect(routeSource).toContain("{{addonsConditionDiff}}");
    expect(routeSource).toContain("{{currencyUnit}}");
    expect(routeSource).toContain("{{addonsDiscountValue}}");
    expect(routeSource).toContain("{{addonsDiscountValueUnit}}");

    const footerStart = routeSource.indexOf("Footer Messaging");
    const footerSource = routeSource.slice(footerStart, routeSource.indexOf('activeSection === "discount_pricing"', footerStart));
    expect(footerSource).toContain("setIsAddonVariablesModalOpen(true)");
    expect(routeSource).toContain("addonVariablesModalRef");
    expect(footerSource).not.toContain("templateVariablesModalRef");
  });

  it("opens a selected Add-ons products modal from the selected count", () => {
    const sectionStart = routeSource.indexOf('{activeSection === "free_gift_addons" && (() => {');
    const sectionEnd = routeSource.indexOf('activeSection === "discount_pricing"', sectionStart);
    const section = routeSource.slice(sectionStart, sectionEnd);

    expect(section).toContain("openAddonSelectedProductsModal");
    expect(routeSource).toContain("addonSelectedProductsModalRef");
    expect(routeSource).toContain("Selected Products");
    expect(routeSource).toContain("handleAddonSelectedProductRemove");
  });

  it("matches the reference tier empty and accordion behavior", () => {
    const sectionStart = routeSource.indexOf('{activeSection === "free_gift_addons" && (() => {');
    const sectionEnd = routeSource.indexOf('activeSection === "discount_pricing"', sectionStart);
    const section = routeSource.slice(sectionStart, sectionEnd);

    expect(routeSource).toContain("activeAddonTierIndex");
    expect(routeSource).toContain("setActiveAddonTierIndex(addonTiers.length)");
    expect(routeSource).toContain("setActiveAddonTierIndex((currentIndex)");
    expect(routeSource).toContain("Math.max(0, addonTierCount - 1)");
    expect(section).not.toContain("No rules defined yet");
    expect(section).toContain("addonsTierBody");
  });
});
