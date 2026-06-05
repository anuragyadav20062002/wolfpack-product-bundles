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
      "addonsMediaFieldGrid",
      "addonsTierCard",
      "addonsProductSelectionRow",
      "addonsSelectedButton",
      "addonsDiscountGrid",
      "addonsTierRules",
      "addonsFooterCard",
      "addonsTierHeader",
      "addonsTierHeaderActive",
      "addonsTierTitle",
      "addonsTierDeleteButton",
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
    expect(section).not.toContain('className={fullPageBundleStyles.addonsLanguageButton}');
    expect(routeSource).toContain('type: "addon-step"');
    expect(routeSource).toContain('type: "addon-section"');
    expect(routeSource).toContain('type: "addon-footer"');
  });

  it("keeps Add-ons Multi Language buttons on the same Polaris style", () => {
    const sectionStart = routeSource.indexOf('{activeSection === "free_gift_addons" && (() => {');
    const sectionEnd = routeSource.indexOf('activeSection === "discount_pricing"', sectionStart);
    const section = routeSource.slice(sectionStart, sectionEnd);
    const topButtonStart = section.indexOf("openAddonStepMultiLanguageModal");
    const sectionButtonStart = section.indexOf("openAddonSectionMultiLanguageModal");
    const footerButtonStart = section.indexOf("openAddonFooterMultiLanguageModal");

    expect(topButtonStart).toBeGreaterThan(-1);
    expect(sectionButtonStart).toBeGreaterThan(-1);
    expect(footerButtonStart).toBeGreaterThan(-1);
    expect(section.slice(topButtonStart - 140, topButtonStart + 220)).toContain('variant="secondary"');
    expect(section.slice(topButtonStart - 140, topButtonStart + 220)).toContain('icon="globe"');
    expect(section.slice(topButtonStart, topButtonStart + 420)).toContain("Multi Language");
    expect(section.slice(sectionButtonStart - 140, sectionButtonStart + 220)).toContain('variant="secondary"');
    expect(section.slice(sectionButtonStart - 140, sectionButtonStart + 220)).toContain('icon="globe"');
    expect(section.slice(sectionButtonStart, sectionButtonStart + 420)).toContain("Multi Language");
    expect(section.slice(footerButtonStart - 120, footerButtonStart + 160)).toContain('icon="globe"');
    expect(section.slice(footerButtonStart - 120, footerButtonStart + 160)).toContain("Multi Language");
  });

  it("groups Add-ons toggles with their card titles", () => {
    const sectionStart = routeSource.indexOf('{activeSection === "free_gift_addons" && (() => {');
    const sectionEnd = routeSource.indexOf('activeSection === "discount_pricing"', sectionStart);
    const section = routeSource.slice(sectionStart, sectionEnd);

    const stepTitleStart = section.indexOf("Add-Ons and Gifting Step");
    const bundlesTitleStart = section.indexOf("Add-Ons with Bundles");
    const stepToggleStart = section.indexOf("Enable add-ons and gifting step");
    const bundlesToggleStart = section.indexOf("Enable add-ons with bundles");
    const firstActionsStart = section.indexOf("addonsHeaderActions", stepTitleStart);
    const secondActionsStart = section.indexOf("addonsHeaderActions", bundlesTitleStart);

    expect(section.slice(stepTitleStart - 140, stepToggleStart)).toContain("addonsTitleCluster");
    expect(section.slice(bundlesTitleStart - 140, bundlesToggleStart)).toContain("addonsTitleCluster");
    expect(stepToggleStart).toBeGreaterThan(stepTitleStart);
    expect(bundlesToggleStart).toBeGreaterThan(bundlesTitleStart);
    expect(stepToggleStart).toBeLessThan(firstActionsStart);
    expect(bundlesToggleStart).toBeLessThan(secondActionsStart);
  });

  it("keeps Add-ons tier action buttons on the Polaris secondary style", () => {
    const sectionStart = routeSource.indexOf('{activeSection === "free_gift_addons" && (() => {');
    const sectionEnd = routeSource.indexOf('activeSection === "discount_pricing"', sectionStart);
    const section = routeSource.slice(sectionStart, sectionEnd);
    const tierRuleStart = section.indexOf("Add Tier Rule");
    const tierStart = section.indexOf("Add Add Ons Tier");
    const tierRuleButtonStart = section.lastIndexOf("<s-button", tierRuleStart);
    const tierButtonStart = section.lastIndexOf("<s-button", tierStart);

    expect(tierRuleStart).toBeGreaterThan(-1);
    expect(tierStart).toBeGreaterThan(-1);
    expect(tierRuleButtonStart).toBeGreaterThan(-1);
    expect(tierButtonStart).toBeGreaterThan(-1);
    expect(section.slice(tierRuleButtonStart, tierRuleStart + 80)).toContain('variant="secondary"');
    expect(section.slice(tierButtonStart, tierStart + 80)).toContain('variant="secondary"');
    expect(section).not.toContain("addonsTierRuleButton");
    expect(section).not.toContain("addonsTierButton");
    expect(cssSource).not.toContain(".addonsTierRuleButton");
    expect(cssSource).not.toContain(".addonsTierButton");
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
    expect(cssSource).toContain("--addons-icon-control-width: 96px");
    expect(cssSource).toContain("width: var(--addons-icon-control-width)");
    expect(cssSource).toContain("width: 40px");
    expect(cssSource).toContain("grid-template-columns: var(--addons-icon-control-width) minmax(0, 1fr)");
    expect(cssSource).toContain(".addonsFieldsColumn");
    expect(cssSource).toContain("min-width: 0");
  });

  it("keeps Add-ons cards on the compact reference padding contract", () => {
    expect(cssSource).toContain(".addonsReferenceStepCard");
    expect(cssSource).toContain(".addonsCard");
    expect(cssSource).toContain(".addonsFooterCard");
    expect(cssSource).toContain("--addons-card-padding: 14px");
    expect(cssSource).toContain("padding: var(--addons-card-padding)");
    expect(cssSource).toContain(".addonsTierBody");
    expect(cssSource).toContain("padding: 14px");
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
