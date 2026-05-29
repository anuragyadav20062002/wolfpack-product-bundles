/**
 * UI contract tests for the CREATE bundle wizard footer + Add Rule button.
 *
 * Issue: feedback-jun26-1
 * Spec : test-spec/create-bundle-wizard-footer.spec.md
 *
 * The wizard footer must clear the Crisp chat bubble (bottom-right of viewport)
 * with extra right-side padding, and the Back/Next buttons must be large enough
 * to be comfortably clickable. The Add Rule button must be right-aligned, not
 * forced to full-width.
 */
import fs from "node:fs";
import path from "node:path";

const cssPath = path.join(
  process.cwd(),
  "app/routes/app/app.bundles.create_.configure.$bundleId/wizard-configure.module.css"
);
const css = fs.readFileSync(cssPath, "utf8");

function extractRule(source: string, selector: string): string {
  const index = source.indexOf(selector + " {");
  if (index === -1) return "";
  const start = source.indexOf("{", index);
  const end = source.indexOf("}", start);
  if (start === -1 || end === -1) return "";
  return source.slice(start + 1, end);
}

describe(".wizardFooter CSS contract", () => {
  const rule = extractRule(css, ".wizardFooter");

  it("renders the wizard footer rule", () => {
    expect(rule).not.toBe("");
  });

  it("reserves right-side padding to clear the Crisp chat bubble", () => {
    expect(rule).toMatch(/padding-right:\s*96px/);
  });

  it("retains bottom clearance", () => {
    expect(rule).toMatch(/padding-bottom:\s*40px/);
  });

  it("keeps actions right-aligned", () => {
    expect(rule).toMatch(/justify-content:\s*flex-end/);
  });

  it("renders a visible gap between buttons", () => {
    const match = rule.match(/gap:\s*(\d+)px/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(12);
  });

  it("sizes Back/Next buttons for click comfort", () => {
    const buttonRule = extractRule(css, ".wizardFooter s-button");
    expect(buttonRule).toMatch(/min-height:\s*44px/);
  });
});

describe(".addRuleWrap CSS contract", () => {
  const rule = extractRule(css, ".addRuleWrap");

  it("renders the add-rule wrap rule", () => {
    expect(rule).not.toBe("");
  });

  it("uses flex layout right-aligned", () => {
    expect(rule).toMatch(/display:\s*flex/);
    expect(rule).toMatch(/justify-content:\s*flex-end/);
  });

  it("does not force display: block", () => {
    expect(rule).not.toMatch(/display:\s*block/);
  });

  it("does not force inner button to full-width", () => {
    // No `.addRuleWrap s-button { display: block; width: 100%; }` rule
    expect(css).not.toMatch(/\.addRuleWrap\s+s-button\s*\{[^}]*width:\s*100%/);
  });
});
