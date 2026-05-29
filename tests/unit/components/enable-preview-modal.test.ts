/**
 * JSX contract for EnablePreviewModal.
 *
 * Issue: feedback-jun26-10
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
  it("returns null early when themeEditorUrl is null", () => {
    expect(source).toMatch(/if\s*\(\s*!\s*themeEditorUrl\s*\)\s*return\s+null/);
  });

  it("renders the enable-extension heading", () => {
    expect(source).toContain("Enable the theme app extension");
  });

  it("describes the three-step Theme Editor flow", () => {
    expect(source).toContain("Online Store");
    expect(source).toContain("Edit Theme");
    expect(source).toContain("Save");
  });

  it("wires the primary CTA to open the theme editor URL", () => {
    expect(source).toMatch(/window\.open\(\s*themeEditorUrl/);
  });
});
