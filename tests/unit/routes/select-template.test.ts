/**
 * Unit tests — parseBundleDesignTemplate
 *
 * Spec: test-spec/select-template.spec.md
 */

import { parseBundleDesignTemplate } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers";
import fs from "node:fs";
import path from "node:path";

function makeForm(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

describe("parseBundleDesignTemplate", () => {
  // --- defaults and empty form ---

  it("returns null for both fields when form is empty", () => {
    const result = parseBundleDesignTemplate(makeForm({}));
    expect(result.bundleDesignTemplate).toBeNull();
    expect(result.bundleDesignPresetId).toBeNull();
  });

  it("returns null for bundleDesignPresetId when value is only whitespace", () => {
    const result = parseBundleDesignTemplate(makeForm({ bundleDesignPresetId: "  " }));
    expect(result.bundleDesignPresetId).toBeNull();
  });

  it("returns null for bundleDesignTemplate when value is only whitespace", () => {
    const result = parseBundleDesignTemplate(makeForm({ bundleDesignTemplate: "  " }));
    expect(result.bundleDesignTemplate).toBeNull();
  });

  // --- valid FPB presets ---

  it("parses FPB Standard preset as the audited DEFAULT preset", () => {
    const result = parseBundleDesignTemplate(makeForm({
      bundleDesignTemplate: "FBP_SIDE_FOOTER",
      bundleDesignPresetId: "DEFAULT",
    }));
    expect(result.bundleDesignTemplate).toBe("FBP_SIDE_FOOTER");
    expect(result.bundleDesignPresetId).toBe("DEFAULT");
  });

  it("parses FPB Classic preset", () => {
    const result = parseBundleDesignTemplate(makeForm({
      bundleDesignTemplate: "FBP_SIDE_FOOTER",
      bundleDesignPresetId: "CLASSIC",
    }));
    expect(result.bundleDesignTemplate).toBe("FBP_SIDE_FOOTER");
    expect(result.bundleDesignPresetId).toBe("CLASSIC");
  });

  it("parses FPB Compact preset", () => {
    const result = parseBundleDesignTemplate(makeForm({
      bundleDesignTemplate: "FBP_SIDE_FOOTER",
      bundleDesignPresetId: "COMPACT",
    }));
    expect(result.bundleDesignTemplate).toBe("FBP_SIDE_FOOTER");
    expect(result.bundleDesignPresetId).toBe("COMPACT");
  });

  it("parses FPB Horizontal preset", () => {
    const result = parseBundleDesignTemplate(makeForm({
      bundleDesignTemplate: "FBP_SIDE_FOOTER",
      bundleDesignPresetId: "HORIZONTAL",
    }));
    expect(result.bundleDesignTemplate).toBe("FBP_SIDE_FOOTER");
    expect(result.bundleDesignPresetId).toBe("HORIZONTAL");
  });

  // --- valid PPB templates ---

  it("parses PPB Product List (PDP_INPAGE + CASCADE)", () => {
    const result = parseBundleDesignTemplate(makeForm({
      bundleDesignTemplate: "PDP_INPAGE",
      bundleDesignPresetId: "CASCADE",
    }));
    expect(result.bundleDesignTemplate).toBe("PDP_INPAGE");
    expect(result.bundleDesignPresetId).toBe("CASCADE");
  });

  it("parses PPB Product Grid (PDP_INPAGE + COGNIVE)", () => {
    const result = parseBundleDesignTemplate(makeForm({
      bundleDesignTemplate: "PDP_INPAGE",
      bundleDesignPresetId: "COGNIVE",
    }));
    expect(result.bundleDesignTemplate).toBe("PDP_INPAGE");
    expect(result.bundleDesignPresetId).toBe("COGNIVE");
  });

  it("parses PPB Horizontal Slots (PDP_MODAL + MODAL)", () => {
    const result = parseBundleDesignTemplate(makeForm({
      bundleDesignTemplate: "PDP_MODAL",
      bundleDesignPresetId: "MODAL",
    }));
    expect(result.bundleDesignTemplate).toBe("PDP_MODAL");
    expect(result.bundleDesignPresetId).toBe("MODAL");
  });

  it("parses PPB Vertical Slots (PDP_MODAL + SIMPLIFIED)", () => {
    const result = parseBundleDesignTemplate(makeForm({
      bundleDesignTemplate: "PDP_MODAL",
      bundleDesignPresetId: "SIMPLIFIED",
    }));
    expect(result.bundleDesignTemplate).toBe("PDP_MODAL");
    expect(result.bundleDesignPresetId).toBe("SIMPLIFIED");
  });

  // --- presetId present, template absent ---

  it("parses bundleDesignPresetId independently when bundleDesignTemplate is absent", () => {
    const result = parseBundleDesignTemplate(makeForm({ bundleDesignPresetId: "CASCADE" }));
    expect(result.bundleDesignTemplate).toBeNull();
    expect(result.bundleDesignPresetId).toBe("CASCADE");
  });
});

describe("select-template route constants", () => {
  it("submits the full-page Standard card as DEFAULT", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
      "utf8"
    );

    expect(source).toContain('presetId: "DEFAULT"');
    expect(source).not.toContain('presetId: "STANDARD"');
  });

  it("renders the product-page Select Template surface as an app-owned dialog", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
      "utf8"
    );

    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('onKeyDown={handleSelectTemplateDialogKeyDown}');
    expect(source).toContain('className={productPageBundleStyles.templateDialogBackdrop}');
    expect(source).not.toContain('<s-modal ref={selectTemplateModalRef} heading="Customization"');
  });
});
