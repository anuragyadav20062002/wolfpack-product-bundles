/**
 * JSX contract for EnablePreviewModal.
 *
 * Issue: preview-bundle-gate-1
 * Spec : test-spec/enable-preview-gate.spec.md
 */
import fs from "node:fs";
import path from "node:path";

const componentPath = path.join(
  process.cwd(),
  "app/components/EnablePreviewModal.tsx",
);
const source = fs.readFileSync(componentPath, "utf8");

describe("EnablePreviewModal JSX contract", () => {
  it("returns null early when open is false", () => {
    expect(source).toMatch(/if\s*\(\s*!\s*open\s*\)\s*return\s+null/);
  });

  it("renders the translated visibility-not-set-up heading", () => {
    expect(source).toContain('t("common.previewGate.title")');
  });

  it("renders the body copy directing merchants to set up visibility", () => {
    expect(source).toContain('t("common.previewGate.body")');
  });

  it("wires the primary CTA to open the theme editor URL", () => {
    expect(source).toMatch(/window\.open\(\s*themeEditorUrl/);
  });

  it("renders a translated dismiss button", () => {
    expect(source).toContain('t("common.actions.maybeLater")');
  });
});
