/**
 * Unit tests — parseWpbTemplate
 *
 * Spec: test-spec/select-template.spec.md
 * Issue: [select-template-1]
 */

import { parseWpbTemplate } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers";

function makeForm(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

describe("parseWpbTemplate", () => {
  // --- defaults and empty form ---

  it("returns null for both fields when form is empty", () => {
    const result = parseWpbTemplate(makeForm({}));
    expect(result.wpbLayoutTemplate).toBeNull();
    expect(result.wpbPresetId).toBeNull();
  });

  it("returns null for wpbPresetId when value is only whitespace", () => {
    const result = parseWpbTemplate(makeForm({ wpbPresetId: "  " }));
    expect(result.wpbPresetId).toBeNull();
  });

  it("returns null for wpbLayoutTemplate when value is only whitespace", () => {
    const result = parseWpbTemplate(makeForm({ wpbLayoutTemplate: "  " }));
    expect(result.wpbLayoutTemplate).toBeNull();
  });

  // --- valid FPB presets ---

  it("parses FPB Standard preset", () => {
    const result = parseWpbTemplate(makeForm({
      wpbLayoutTemplate: "FBP_SIDE_FOOTER",
      wpbPresetId: "STANDARD",
    }));
    expect(result.wpbLayoutTemplate).toBe("FBP_SIDE_FOOTER");
    expect(result.wpbPresetId).toBe("STANDARD");
  });

  it("parses FPB Classic preset", () => {
    const result = parseWpbTemplate(makeForm({
      wpbLayoutTemplate: "FBP_SIDE_FOOTER",
      wpbPresetId: "CLASSIC",
    }));
    expect(result.wpbLayoutTemplate).toBe("FBP_SIDE_FOOTER");
    expect(result.wpbPresetId).toBe("CLASSIC");
  });

  it("parses FPB Compact preset", () => {
    const result = parseWpbTemplate(makeForm({
      wpbLayoutTemplate: "FBP_SIDE_FOOTER",
      wpbPresetId: "COMPACT",
    }));
    expect(result.wpbLayoutTemplate).toBe("FBP_SIDE_FOOTER");
    expect(result.wpbPresetId).toBe("COMPACT");
  });

  it("parses FPB Horizontal preset", () => {
    const result = parseWpbTemplate(makeForm({
      wpbLayoutTemplate: "FBP_SIDE_FOOTER",
      wpbPresetId: "HORIZONTAL",
    }));
    expect(result.wpbLayoutTemplate).toBe("FBP_SIDE_FOOTER");
    expect(result.wpbPresetId).toBe("HORIZONTAL");
  });

  // --- valid PPB templates ---

  it("parses PPB Product List (PDP_INPAGE + CASCADE)", () => {
    const result = parseWpbTemplate(makeForm({
      wpbLayoutTemplate: "PDP_INPAGE",
      wpbPresetId: "CASCADE",
    }));
    expect(result.wpbLayoutTemplate).toBe("PDP_INPAGE");
    expect(result.wpbPresetId).toBe("CASCADE");
  });

  it("parses PPB Product Grid (PDP_INPAGE + COGNIVE)", () => {
    const result = parseWpbTemplate(makeForm({
      wpbLayoutTemplate: "PDP_INPAGE",
      wpbPresetId: "COGNIVE",
    }));
    expect(result.wpbLayoutTemplate).toBe("PDP_INPAGE");
    expect(result.wpbPresetId).toBe("COGNIVE");
  });

  it("parses PPB Horizontal Slots (PDP_MODAL + MODAL)", () => {
    const result = parseWpbTemplate(makeForm({
      wpbLayoutTemplate: "PDP_MODAL",
      wpbPresetId: "MODAL",
    }));
    expect(result.wpbLayoutTemplate).toBe("PDP_MODAL");
    expect(result.wpbPresetId).toBe("MODAL");
  });

  it("parses PPB Vertical Slots (PDP_MODAL + SIMPLIFIED)", () => {
    const result = parseWpbTemplate(makeForm({
      wpbLayoutTemplate: "PDP_MODAL",
      wpbPresetId: "SIMPLIFIED",
    }));
    expect(result.wpbLayoutTemplate).toBe("PDP_MODAL");
    expect(result.wpbPresetId).toBe("SIMPLIFIED");
  });

  // --- presetId present, layoutTemplate absent ---

  it("parses wpbPresetId independently when wpbLayoutTemplate is absent", () => {
    const result = parseWpbTemplate(makeForm({ wpbPresetId: "CASCADE" }));
    expect(result.wpbLayoutTemplate).toBeNull();
    expect(result.wpbPresetId).toBe("CASCADE");
  });
});
