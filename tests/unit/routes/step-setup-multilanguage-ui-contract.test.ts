import fs from "node:fs";
import path from "node:path";

import { Prisma } from "@prisma/client";

const routePaths = {
  fullPage: path.join(
    process.cwd(),
    "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx",
  ),
  productPage: path.join(
    process.cwd(),
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx",
  ),
};

const routeSources = Object.fromEntries(
  Object.entries(routePaths).map(([key, filePath]) => [key, fs.readFileSync(filePath, "utf8")]),
);

const modalSource = fs.readFileSync(
  path.join(process.cwd(), "app/components/bundle-configure/MultiLanguageTextModal.tsx"),
  "utf8",
);

function getStepSetupHeaderActions(source: string) {
  const start = source.indexOf("stepSetupActions");
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf("</div>", start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

function getStepNameFieldBody(source: string) {
  const start = source.indexOf('label="Step Name"');
  expect(start).toBeGreaterThan(-1);
  const endCandidates = [
    source.indexOf("{/* ── Category card ── */", start),
    source.indexOf("Legacy products migration banner", start),
  ].filter((index) => index > start);
  expect(endCandidates.length).toBeGreaterThan(0);
  return source.slice(start, Math.min(...endCandidates));
}

describe("shared Step Setup Multi Language modal contract", () => {
  it("renders the observed translation headings, helper copy, language list, and action label", () => {
    expect(modalSource).toContain("Translations");
    expect(modalSource).toContain("Use the dropdown in this section to specify which language you would like to edit");
    expect(modalSource).toContain("Choose language to edit");
    expect(modalSource).toContain("Custom Text");
    expect(modalSource).toContain("Input Text for the Selected Language");
    expect(modalSource).toContain("Text Settings");
    expect(modalSource).toContain("Save and Close");
    expect(modalSource).toContain('name: "Norwegian Bokmål"');
    expect(modalSource).not.toContain('(default)');
  });
});

describe("Step Setup Multi Language persistence contract", () => {
  it("has a generated Prisma BundleStep multiLangData field", () => {
    const bundleStepModel = Prisma.dmmf.datamodel.models.find((model) => model.name === "BundleStep");
    expect(bundleStepModel?.fields.some((field) => field.name === "multiLangData" && field.type === "Json")).toBe(true);
  });
});

describe.each(Object.entries(routeSources))("%s Step Setup Multi Language wiring", (_bundleType, source) => {
  it("wires the step-level globe button to localized Step Name and Step Title fields", () => {
    expect(source).toContain("openStepMultiLanguageModal");
    expect(source).toContain('key: "productPageStepText"');
    expect(source).toContain('label: "Step Name"');
    expect(source).toContain('key: "productPageSubtext"');
    expect(source).toContain('label: "Step Title"');
    expect(source).toContain('multiLanguageTarget?.type === "step"');
    expect(source).toContain("productPageStepText");
    expect(source).toContain("productPageSubtext");
    expect(source).not.toContain('disabled={shopLocales.length === 0');
  });

  it("wires category row buttons to localized Category Name and Category Title fields", () => {
    expect(source).toContain("openStepCategoryMultiLanguageModal");
    expect(source).toContain('key: "name"');
    expect(source).toContain('label: "Category Name"');
    expect(source).toContain('key: "title"');
    expect(source).toContain('label: "Category Title"');
    expect(source).toContain('multiLanguageTarget?.type === "step-category"');
    expect(source).toContain("category.multiLangData");
  });

  it("saves Step Setup translations into the direct step and category multiLangData contracts", () => {
    expect(source).toContain("saveStepSetupMultiLanguageValues");
    expect(source).toContain('"multiLangData", nextValues');
    expect(source).toContain("multiLangData: {");
    expect(source).toContain("...(category.multiLangData ?? {})");
    expect(source).not.toContain('icon="globe" disabled accessibilityLabel="Multi Language"');
  });

  it("renders the Step Setup header language action before clone and delete", () => {
    const actions = getStepSetupHeaderActions(source);
    const languageIndex = actions.indexOf('icon="globe"');
    const cloneIndex = actions.indexOf('icon="duplicate"');
    const deleteIndex = actions.indexOf('icon="delete"');

    expect(actions).toContain('accessibilityLabel="Multi Language"');
    expect(languageIndex).toBeGreaterThan(-1);
    expect(cloneIndex).toBeGreaterThan(-1);
    expect(deleteIndex).toBeGreaterThan(-1);
    expect(languageIndex).toBeLessThan(cloneIndex);
    expect(cloneIndex).toBeLessThan(deleteIndex);
  });

  it("keeps the step-level language action in the header instead of below Step Name", () => {
    expect(getStepNameFieldBody(source)).not.toContain("openStepMultiLanguageModal(step.id)");
  });
});
