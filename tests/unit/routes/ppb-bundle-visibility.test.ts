/**
 * Unit tests — parsePPBBundleVisibility
 *
 * Spec: test-spec/ppb-bundle-visibility.spec.md
 * Issue: [ppb-edit-bundle-flow-1]
 */

import { parsePPBBundleVisibility } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers";

function makeForm(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

describe("parsePPBBundleVisibility", () => {
  it("returns all defaults when form has no visibility fields", () => {
    const result = parsePPBBundleVisibility(makeForm({}));
    expect(result.upsellWidgetEnabled).toBe(false);
    expect(result.upsellWidgetDisplayMode).toBeNull();
    expect(result.upsellWidgetDisplayOn).toBeNull();
    expect(result.autoSelectBrowsedProduct).toBe(false);
  });

  it("parses upsellWidgetEnabled=true", () => {
    const result = parsePPBBundleVisibility(makeForm({ upsellWidgetEnabled: "true" }));
    expect(result.upsellWidgetEnabled).toBe(true);
  });

  it("parses upsellWidgetDisplayMode", () => {
    const result = parsePPBBundleVisibility(makeForm({ upsellWidgetDisplayMode: "button" }));
    expect(result.upsellWidgetDisplayMode).toBe("button");
  });

  it("parses upsellWidgetDisplayOn", () => {
    const block = parsePPBBundleVisibility(makeForm({ upsellWidgetDisplayOn: "block" }));
    expect(block.upsellWidgetDisplayOn).toBe("block");

    const specific = parsePPBBundleVisibility(makeForm({ upsellWidgetDisplayOn: "specific_products" }));
    expect(specific.upsellWidgetDisplayOn).toBe("specific_products");

    const collections = parsePPBBundleVisibility(makeForm({ upsellWidgetDisplayOn: "specific_collections" }));
    expect(collections.upsellWidgetDisplayOn).toBe("specific_collections");
  });

  it("returns null for displayMode when field is empty", () => {
    const result = parsePPBBundleVisibility(makeForm({ upsellWidgetDisplayMode: "" }));
    expect(result.upsellWidgetDisplayMode).toBeNull();
  });

  it("parses autoSelectBrowsedProduct", () => {
    const result = parsePPBBundleVisibility(makeForm({ autoSelectBrowsedProduct: "true" }));
    expect(result.autoSelectBrowsedProduct).toBe(true);
  });

  it("coerces string 'false' to boolean false for boolean fields", () => {
    const result = parsePPBBundleVisibility(makeForm({
      upsellWidgetEnabled: "false",
      autoSelectBrowsedProduct: "false",
    }));
    expect(result.upsellWidgetEnabled).toBe(false);
    expect(result.autoSelectBrowsedProduct).toBe(false);
  });
});
