/**
 * Create-bundle wizard i18n contract.
 *
 * Issue: admin-ui-i18n-1
 * Spec : test-spec/admin-ui-i18n.spec.md
 */
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.create/route.tsx"),
  "utf8",
);

const requiredKeys = [
  "createBundle.title",
  "createBundle.dashboard",
  "createBundle.heading",
  "createBundle.help",
  "createBundle.validation.required",
  "createBundle.validation.minLength",
  "createBundle.fields.name",
  "createBundle.fields.namePlaceholder",
  "createBundle.bundleType.productPage.title",
  "createBundle.bundleType.productPage.description",
  "createBundle.bundleType.fullPage.title",
  "createBundle.bundleType.fullPage.description",
  "createBundle.actions.selected",
  "createBundle.actions.select",
  "createBundle.actions.next",
];

describe("create-bundle wizard copy extraction", () => {
  it("resolves merchant-facing copy through translation keys", () => {
    expect(source).toContain("useTranslation");
    requiredKeys.forEach((key) => expect(source).toContain(key));
  });
});
